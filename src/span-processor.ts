import { Span } from '@opentelemetry/api';
import { type SpanProcessor, type ReadableSpan } from '@opentelemetry/sdk-trace-base';
import evaluatedFlags from './evaluated-cache';
import { KEY_ATTR, VALUE_ATTR, VARIANT_ATTR, PROVIDER_NAME_ATTR, EVALUATED } from './conventions';

export default class FeatureFlagSpanProcessor implements SpanProcessor {

  /**
   * Called when a Span is started, if the span.isRecording() returns true.
   * Retrieves the feature flags that have been evaluated in the current evaluation context
   * and adds their evaluation details to the new Span
   * @param span the span that just started.
   */
  onStart(span: Span) {
    evaluatedFlags.forEach((evaluation, flagKey) => {
      let { value, variant } = evaluation;
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      if (!variant) {
        variant = value;
      }
      span.addEvent(EVALUATED, {
        [KEY_ATTR]: flagKey,
        [VALUE_ATTR]: value,
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
