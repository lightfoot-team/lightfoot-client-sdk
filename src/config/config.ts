interface Config {
  OTLPExporterBaseURL: string;
  tracesBaseUrl: string;
}

const config: Config = {
  OTLPExporterBaseURL: "http://localhost:5173",
  tracesBaseUrl: "http://localhost:4318/",
};

export default config;