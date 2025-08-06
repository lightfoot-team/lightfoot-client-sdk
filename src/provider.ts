//import { OpenFeatureEventEmitter } from '@openfeature/js-sdk';
import type { ClientSDKConfig } from './config/config';
import {
  AnyProviderEvent,
  ClientProviderEvents,
  EvaluationContext,
  Hook,
  JsonValue,
  Logger,
  OpenFeature,
  Provider,
  ProviderEventEmitter,
  ResolutionDetails,
} from '@openfeature/web-sdk';

import axios from 'axios';

import { trace, context } from '@opentelemetry/api';
import evaluatedFlagsCache from './evaluated-cache';
type DefaultValue = string | boolean | JsonValue | number
const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
  }
};

/** The maximum time to live for a cached set of evalutions */
const TTL = 1000;

const configCache = new Map();
const flagEvaluationCache = {evaluations: configCache, ttl: Date.now() + TTL}

const isExpired = (ttl: number) => {
  const result = Date.now() > ttl;
  return result;
}

const getFlagEvaluation = (flagKey: string, defaultValue: DefaultValue, evaluationContext: EvaluationContext) => {
  let evaluation;
  if (!configCache.has(flagKey)) {
    console.log('not in config')
    evaluation = { // Default if flag is not in cache? 
      value: defaultValue,
      reason: 'STATIC'
    }
  } else {
    if (isExpired(flagEvaluationCache.ttl)) {
      console.log("Here in isExpired block");
      OpenFeature.setContext(evaluationContext);
    }
    evaluation = configCache.get(flagKey);
  }

  evaluatedFlagsCache.set(flagKey, evaluation);
  console.log('Setting evaluated flags', evaluatedFlagsCache)

  return evaluation;
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
    name: 'Frontend Provider',
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
    // Set the flag evaluation result for each flag
      // Add flag evaluations to cache
    Object.entries(response.data).forEach((result: Record<string, any>) => {
      console.log('result:', result)
      configCache.set(result[0], result[1]);
    });
    console.log('Config:', configCache)
    }
    catch (error) {
      console.error('Could not fetch flag evaluation data from the evaluation API');
    }
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<boolean> {

    const resolutionDetails = getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<string> {
    const resolutionDetails = getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<number> {
    const resolutionDetails = getFlagEvaluation(flagKey, defaultValue, context);
    return resolutionDetails;
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<T> {
    const resolutionDetails = getFlagEvaluation(flagKey, defaultValue, context);
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

  // implement with "new OpenFeatureEventEmitter()", and use "emit()" to emit events
  //events: ProviderEventEmitter<AnyProviderEvent> = new OpenFeatureEventEmitter() as unknown as ProviderEventEmitter<AnyProviderEvent>;

  // events = ProviderEventEmitter<AnyProviderEvent> = new OpenFeatureEventEmitter();

  async initialize(context: EvaluationContext) {
    // code to initialize your provider
    console.log('Getting config')
    await this.getFlagEvaluationConfig(context)
  }
  // onClose?(){
  //   // code to shut down your provider
  // }

}