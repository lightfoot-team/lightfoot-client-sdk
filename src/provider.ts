//import { OpenFeatureEventEmitter } from '@openfeature/js-sdk';
import type { ClientSDKConfig } from './config/config';
import {
  EvaluationContext,
  Hook,
  JsonValue,
  Logger,
  Provider,
  ResolutionDetails,
} from '@openfeature/web-sdk';

import axios from 'axios';
import { axiosConfig } from './config/config';
import { Reason } from './conventions';
import evaluatedFlagsCache from './evaluated-cache';

type DefaultValue = string | boolean | JsonValue | number


/** The maximum time to live for a cached set of evalutions */
const TTL = 180000;

const configCache = new Map();
const flagEvaluationCache = { evaluations: configCache, ttl: Date.now() + TTL }

const isExpired = (ttl: number) => {
  const result = Date.now() > ttl;
  return result;
}


//TODO: look up naming conventions for provider implementations
export class ClientFeatureProvider implements Provider {
  config: ClientSDKConfig;

  constructor(config: ClientSDKConfig) {
    this.config = config;
  }

  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client';

  readonly metadata = {
    name: 'LightFoot Client Provider',
  } as const;

  // Optional provider managed hooks
  hooks: Hook[] = [];

  /** 
 * Retrieves the evaluation results for the current context to enable 
 * static evaluation of feature flags 
 * @param evaluationContext the context for static flag evaluation
 */
  async getFlagEvaluationConfig(evaluationContext: EvaluationContext) {
    //TODO: For now, fetch evaluation for all flags for the given context 
    try {
      const response = await axios.post(`${this.config.OTLPExporterBaseURL}/api/evaluate/config`, { context: evaluationContext }, axiosConfig);
      Object.entries(response.data).forEach((result: Record<string, any>) => {
        const flagKey = result[0];
        const evaluation = result[1];
        configCache.set(flagKey, evaluation);
      });
    }
    catch (error) {
      console.error('Could not fetch flag evaluation data from the evaluation API');
    }
  }

  getFlagEvaluation(flagKey: string, defaultValue: DefaultValue, evaluationContext: EvaluationContext) {
    let evaluation;
    if (!configCache.has(flagKey)) {
      evaluation = {
        value: defaultValue,
        reason: Reason.STATIC
      }
    } else {
      if (isExpired(flagEvaluationCache.ttl)) {
        this.getFlagEvaluationConfig(evaluationContext).catch(console.error);
        evaluation = configCache.get(flagKey);
        evaluation.reason = Reason.STALE;
      } else {
        evaluation = configCache.get(flagKey);
        evaluation.reason = Reason.CACHED;
      }

    }

    evaluatedFlagsCache.set(flagKey, evaluation);

    return evaluation;
  }
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<boolean> {

    const resolutionDetails = this.getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<string> {
    const resolutionDetails = this.getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<number> {
    const resolutionDetails = this.getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<T> {
    const resolutionDetails = this.getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  async onContextChange?(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
    const contextsAreEqual = JSON.stringify(oldContext) === JSON.stringify(newContext);

    if (!contextsAreEqual) {
      try {
        await this.getFlagEvaluationConfig(newContext);
        configCache.clear();
        evaluatedFlagsCache.clear();
      } catch (err) {
        console.error("Error refreshing flag config on context change:", err);
      }
    }
  }

  async initialize(context: EvaluationContext) {

    await this.getFlagEvaluationConfig(context)
  }

}