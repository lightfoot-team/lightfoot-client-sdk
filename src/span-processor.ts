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
        console.log('Flag:', value, flagKey)
        span.addEvent('feature_flag.evaluated',{
            flagKey,
            value: String(value),
          })
        });
      
  }

  onEnd(span: ReadableSpan) {
  
  }

  async shutdown(): Promise<void> {
    // Clean up resources if needed
  }

  async forceFlush(): Promise<void> {
    // If needed, force flush spans manually
  }
}
