import FrontendTracer from "./telemetry";
import { ClientFeatureProvider } from "./provider";
import { OpenFeature, EvaluationContext } from "@openfeature/web-sdk";
import { TracingHook } from './hook';
import { ClientSDKConfig, defaultConfig } from "./config/config";

class LightFootClientSDK {
  config: ClientSDKConfig;
  provider: ClientFeatureProvider;
  featureFlagsClient;

  constructor(config: ClientSDKConfig) {
    this.config = config;
    this.provider = new ClientFeatureProvider(this.config);
    OpenFeature.setProvider(this.provider);
    this.featureFlagsClient = OpenFeature.getClient();
  }

  async init(context: EvaluationContext) {
    OpenFeature.setContext(context);
    await this.provider.initialize(context);
    this.featureFlagsClient.addHooks(new TracingHook());
    await FrontendTracer(this.config);
  }

  getClient() {
    return this.featureFlagsClient;
  }

  getConfig() {
    return this.config;
  }
}

export default LightFootClientSDK;
export { LightFootClientSDK, defaultConfig };
