import FrontendTracer from "./telemetry";
import { ClientFeatureProvider } from "./provider";
import { OpenFeature, EvaluationContext } from "@openfeature/web-sdk";
import { TracingHook } from './hook';


const clientFeatureFlagProvider = new ClientFeatureProvider();

OpenFeature.setProvider(clientFeatureFlagProvider);

//TODO: review use case for this async version
// try {
//   await OpenFeature.setProviderAndWait(new ClientFeatureProvider());
// } catch (error) {
//   console.error('Failed to initialize provider:', error);
// }


// expose client
export const featureFlagsClient = OpenFeature.getClient();

// expose async func to start the SDK
export const LightFootClientSDK = {
  init: (context: EvaluationContext) => {
    OpenFeature.setContext(context)
    clientFeatureFlagProvider.initialize()
    featureFlagsClient.addHooks(new TracingHook());
    FrontendTracer();
  }
};
