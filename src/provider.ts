//import { OpenFeatureEventEmitter } from '@openfeature/js-sdk';
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


/** 
 * Retrieves the evaluation results for the current context to enable 
 * static evaluation of feature flags 
 * @param evaluationContext the context for static flag evaluation
 */
const getFlagEvaluationConfig = async (evaluationContext: EvaluationContext) => {
  //TODO: For now, fetch evaluation for all flags for the given context 
  const response = await axios.post('http://localhost:5173/api/evaluate/config', { context: evaluationContext }, axiosConfig);
  // 3001
  // Set the flag evaluation result for each flag
    // Add flag evaluations to cache
  Object.entries(response.data).forEach((result: Record<string, any>) => {
    console.log('result:', result)
    configCache.set(result[0], result[1]);
  });
  console.log('Config:', configCache)
}

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

  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'client';

  readonly metadata = {
    name: 'Frontend Provider',
  } as const;

  // Optional provider managed hooks
  hooks: Hook[] = [];

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
    // reconcile the provider's cached flags, if applicable
    await getFlagEvaluationConfig; //TODO: add try/catch + error handling 
    configCache.clear();
    evaluatedFlagsCache.clear(); 
    console.log("onContextChange, changing context");
    //TODO: verify that onContextChange is only clearing evaluated flags cache when context has changed
    //.     maybe only remove the evaluations that have changed in the new context? 
  }


  // implement with "new OpenFeatureEventEmitter()", and use "emit()" to emit events
  //events: ProviderEventEmitter<AnyProviderEvent> = new OpenFeatureEventEmitter() as unknown as ProviderEventEmitter<AnyProviderEvent>;

  // events = ProviderEventEmitter<AnyProviderEvent> = new OpenFeatureEventEmitter();


  async initialize(context: EvaluationContext) {
    // code to initialize your provider
    console.log('Getting config')
    await getFlagEvaluationConfig(context)
  }
  // onClose?(){
  //   // code to shut down your provider
  // }

}