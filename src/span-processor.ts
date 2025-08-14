import { Span, ValueType } from '@opentelemetry/api';
import { type SpanProcessor, type ReadableSpan } from '@opentelemetry/sdk-trace-base';
import evaluatedFlags from './evaluated-cache';
import { FEATURE_FLAG, KEY_ATTR, VALUE_ATTR, VARIANT_ATTR, PROVIDER_NAME_ATTR  } from './conventions';
export default class FeatureFlagSpanProcessor implements SpanProcessor {

  /**
   * Called when a Span is started, if the span.isRecording() returns true.
   * Retrieves the feature flags that have been evaluated in the current evaluation context
   * and adds their evaluation details to the new Span
   * @param span the span that just started.
   */
  onStart(span: Span) {
    evaluatedFlags.forEach((evaluation, flagKey) => {
      const { value, variant } = evaluation;
      span.addEvent(`${FEATURE_FLAG}.evaluated`, {
        [KEY_ATTR]: flagKey,
        [VALUE_ATTR]: String(value), 
        [VARIANT_ATTR]: variant,
      })
    });
  }

  onEnd(span: ReadableSpan) {
    // No procedures needed when span ends
  }

  async shutdown(): Promise<void> {
    // No shutdown procedures needed
  }

  async forceFlush(): Promise<void> {
    // No force flush procedures needed
  }
}
