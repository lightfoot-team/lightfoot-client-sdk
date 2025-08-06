export interface ClientSDKConfig {
  OTLPExporterBaseURL: string;
  tracesBaseUrl: string;
}

export const defaultConfig: ClientSDKConfig = {
  OTLPExporterBaseURL: "http://localhost:5173",
  tracesBaseUrl: "http://localhost:4318/",
};
