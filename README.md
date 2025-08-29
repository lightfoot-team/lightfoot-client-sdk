# Lightfoot Client SDK
A comprehensive client-side SDK for Lightfoot with integrated OpenTelemetry instrumentation and feature flag management for web applications.

# Installation
```bash
npm install lightfoot-client-sdk
```

# Quick Start
```javascript
const { LightFootClientSDK } = require('lightfoot-client-sdk');

// Initialize the SDK
const lightFoot = new LightFootClientSDK({
  OTLPExporterBaseURL: "http://localhost:5173",
  tracesBaseUrl: "http://localhost:4318/",
  propagateTraceHeaderCorsUrls: ["http://localhost:4318/"]
});

const evalContext = {
  targetingKey: user.id,
  kind: 'user',
  user: {
    id: user.id,
    role: user.role,
    group: user.group
  }
};

// Initialize telemetry and feature flags, passing in the evaluation context
lightFoot.init(evalContext);

// Get the OpenFeature client for feature flag evaluation
const featureFlagsClient = lightFoot.getClient();
```

# Features
- **OpenTelemetry Integration** - Automatic client-side instrumentation for traces and metrics
- **Feature Flag Management** - Built-in OpenFeature support for feature flags with user context
- **CORS Support** - Configurable trace header propagation across domains
- **Easy Configuration** - Simple setup for both local development and production

# Configuration
## Local Configuration 
```javascript
const { LightFootClientSDK } = require('lightfoot-client-sdk');

const lightFoot = new LightFootClientSDK({
  OTLPExporterBaseURL: "http://localhost:5173",          // Your local development server
  tracesBaseUrl: "http://localhost:4318/",               // OpenTelemetry collector endpoint
  propagateTraceHeaderCorsUrls: ["http://localhost:4318/"]  // URLs to propagate trace headers to
});
```

## Deployment Configuration
```javascript
const lightFoot = new LightFootClientSDK({
  OTLPExporterBaseURL: "https://your-app.com",
  tracesBaseUrl: "https://otel-collector.your-domain.com/",
  propagateTraceHeaderCorsUrls: ["https://otel-collector.your-domain.com"]
});
```

# Usage Example
```jsx
import React, { useState, useEffect } from 'react';
const { LightFootClientSDK } = require('lightfoot-client-sdk');

const lightFoot = new LightFootClientSDK({
  OTLPExporterBaseURL: "http://localhost:5173",
  tracesBaseUrl: "http://localhost:4318/",
  propagateTraceHeaderCorsUrls: ["http://localhost:4318/"]
});

const HomePage = () => {
  const [newUIFeature, setNewUIFeature] = useState(false);

  useEffect(() => {
    const initializeFeatureFlags = async () => {
      try {
        const evalContext = {
          targetingKey: user.id,
          kind: 'user',
          user: {
            id: user.id,
            role: user.role,
            group: user.group
          }
        };
        
        await lightFoot.init(evalContext);
        const client = lightFoot.getClient();
        const flagValue = client.getBooleanValue("new-UI", false);
        setNewUIFeature(flagValue);
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      }
    };

    initializeFeatureFlags();
  }, []);

  return (
    <>
      {newUIFeature ? (
        <>Render new UI feature</>
      ) : (
        <>Render without new UI feature</>
      )}
    </>
  );
};
```

# Methods Available on Feature Flag Client
`getBooleanValue(flagKey: string, defaultValue: boolean, context?: EvaluationContext): boolean`

`getStringValue(flagKey: string, defaultValue: string, context?: EvaluationContext): string`

`getNumberValue(flagKey: string, defaultValue: number, context?: EvaluationContext): number`

`getObjectValue(flagKey: string, defaultValue: object, context?: EvaluationContext): object`

# Requirements
- Modern web browser with ES2017+ support
- Node.js 16.0.0 or higher (for build tools)
- TypeScript 4.5+ (if using TypeScript)