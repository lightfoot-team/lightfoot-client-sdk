import { Span } from '@opentelemetry/api';
import { type SpanProcessor, type ReadableSpan } from '@opentelemetry/sdk-trace-base';
import evaluatedFlags from './evaluated-cache';

export default class FeatureFlagSpanProcessor implements SpanProcessor {

  /**
   * Called when a Span is started, if the span.isRecording() returns true.
   * Retrieves the feature flags that have been evaluated in the current evaluation context
   * and adds their evaluation details to the new Span
   * @param span the span that just started.
   */
  onStart(span: Span) {
       evaluatedFlags.forEach((value, flagKey) => {
        span.addEvent('feature_flag.evaluated',{
            flagKey,
            value: String(value), //TODO: send value and/or variant?
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
