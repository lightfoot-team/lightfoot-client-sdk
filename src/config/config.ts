export interface ClientSDKConfig {
  OTLPExporterBaseURL: string;
  tracesBaseUrl: string;
  propagateTraceHeaderCorsUrls?: Array<string>
}

export const defaultConfig: ClientSDKConfig = {
  OTLPExporterBaseURL: "http://localhost:5173",
  tracesBaseUrl: "http://localhost:4318/",
  propagateTraceHeaderCorsUrls: ["http://localhost:4318/"]
};

export const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
  }
};