import type {Hook, HookContext, EvaluationDetails, FlagValue, Logger} from '@openfeature/server-sdk';
import { trace, context, Context } from '@opentelemetry/api';
import type { OpenTelemetryHookOptions } from './otel-hook';
import { OpenTelemetryHook } from './otel-hook';
export type TracingHookOptions = OpenTelemetryHookOptions;

/**
 * A hook that adds conventionally-compliant span events to feature flag evaluations.
 *
 * See {@link https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/feature-flags/}
 */
export class TracingHook extends OpenTelemetryHook implements Hook {
  protected name = TracingHook.name;

  constructor(options?: TracingHookOptions, logger?: Logger) {
    super(options, logger);
  }

 
  contextMap = new WeakMap<HookContext<any>, Context>();

  /**
   * Retrieves the current active OTel context and adds it to the context map
   * @param hookContext the incoming hook context
   */
  before(hookContext: HookContext) {
    const activeContext = context.active();
    this.contextMap.set(hookContext, activeContext);
  }

  /**
   * Adds feature flag evaluation details to the currently active span
   * after a flag evaluation occurs
   * @param hookContext the incoming hook context
   * @param evaluationDetails the evaluation result of the flag that was just resolved
   * @returns void
   */
  after(hookContext: HookContext, evaluationDetails: EvaluationDetails<FlagValue>) {
    const currContext = this.contextMap.get(hookContext);

    if (!currContext) {
      return;
    }
    context.with(currContext, () => {
      const parent = trace.getSpan(context.active());
      if (!parent) return;

      parent.addEvent('feature_flag.evaluated', {
        flagKey: hookContext.flagKey,
        value: String(evaluationDetails.value),
        variant: (evaluationDetails as any).variant ?? undefined,
      });

      parent.setAttribute(`feature_flag.${hookContext.flagKey}.value`, String(evaluationDetails.value));
      if ((evaluationDetails as any).variant) {
        parent.setAttribute(`feature_flag.${hookContext.flagKey}.variant`, String((evaluationDetails as any).variant));
      }
    });
  }

  error(_: HookContext, err: Error) {
    trace.getActiveSpan()?.recordException(err);
  }
}
