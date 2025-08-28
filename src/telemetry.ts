import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'; //BatchSpanProcessor
import { WebVitalsInstrumentation } from "@honeycombio/opentelemetry-web";
import FeatureFlagSpanProcessor from './span-processor';
import type { ClientSDKConfig } from "./config/config";

const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'client',
    [ATTR_SERVICE_VERSION]: '0.1.0',
  }),
);

/**
 * Sets up OpenTelemetry instrumentation, telemetry export,
 * and context management for the client SDK
 * @param config the configuration object to use in SDK setup
 */
const FrontendTracer = async (config: ClientSDKConfig) => {
  const exporter = new OTLPTraceExporter({
    url: `${config.OTLPExporterBaseURL}/v1/traces`
  });
  const processor = new SimpleSpanProcessor(exporter);
  const provider = new WebTracerProvider({
    resource: resource,
    spanProcessors: [new FeatureFlagSpanProcessor(), processor]
  });

  provider.register({ contextManager: new ZoneContextManager() });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: config.propagateTraceHeaderCorsUrls,
        },
        '@opentelemetry/instrumentation-xml-http-request': {
          propagateTraceHeaderCorsUrls: config.propagateTraceHeaderCorsUrls,
        }
      }),
      new WebVitalsInstrumentation()
    ]
  });
};

export default FrontendTracer;