# @motiadev/core

Core functionality for the Motia framework, providing the foundation for building event-driven workflows.

## Installation

```bash
npm install @motiadev/core
# or
yarn add @motiadev/core
# or
pnpm add @motiadev/core
```

## Overview

`@motiadev/core` is the foundation of the Motia framework, providing:

- Event-driven architecture with pub/sub capabilities
- Multi-language support (TypeScript, Python, Ruby)
- State management
- Cron job scheduling
- API route handling
- Logging infrastructure

## Telemetry and Monitoring

Motia Core includes OpenTelemetry integration for monitoring and tracking your application's performance, errors, and metrics. This is particularly useful when deploying your Motia application to production, as it allows you to monitor what's happening in your users' environments.

### Enabling Telemetry

Telemetry is enabled by default but can be disabled by setting the environment variable `MOTIA_TELEMETRY_ENABLED=false`.

### Configuration

The telemetry system can be configured with the following options:

```typescript
interface TelemetryOptions {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  instrumentationName: string;
  tracing?: {
    endpoint?: string;
    debug?: boolean;
    headers?: Record<string, string>;
  };
  metrics?: {
    endpoint?: string;
    headers?: Record<string, string>;
    exportIntervalMillis?: number;
  };
  enableGlobalErrorHandlers?: boolean;
}
```

### Environment Variables

You can configure telemetry using the following environment variables:

- `MOTIA_TELEMETRY_ENABLED`: Set to 'false' to disable telemetry (default: 'true')
- `MOTIA_SERVICE_NAME`: Name of your service (default: 'motia-core' or 'motia-user-app')
- `OTEL_EXPORTER_OTLP_ENDPOINT`: URL of your OpenTelemetry collector (default: 'http://localhost:4318')
- `MOTIA_TELEMETRY_DEBUG`: Set to 'true' to enable debug logging for telemetry (default: 'false')
- `NODE_ENV`: Environment name (default: 'development')

### Example Usage

Here's how to initialize telemetry when creating a server:

```typescript
import { createServer, createEventManager, createStateAdapter, LockedData } from '@motiadev/core';

// Initialize server with telemetry
const server = await createServer(lockedData, eventManager, state, {
  isVerbose: true,
  telemetry: {
    enabled: true,
    serviceName: 'my-motia-app',
    environment: 'production',
    endpoint: 'https://otel-collector.example.com:4318',
  }
});
```

### Using the Telemetry API

Once initialized, you can access the telemetry object to create custom spans, record metrics, and track errors:

```typescript
const { telemetry } = server;

// Create a custom span
telemetry?.tracer.startActiveSpan('custom-operation', async (span) => {
  try {
    // Your code here
    
    // Add attributes to the span
    telemetry.tracer.setAttributes({
      'custom.attribute': 'value'
    });
    
    // Record a metric
    telemetry.metrics.incrementCounter('custom.counter', 1, {
      category: 'my-category'
    });
    
    // Start a timer
    const endTimer = telemetry.metrics.startTimer('operation.duration');
    
    // ... do some work ...
    
    // End timer
    endTimer();
  } catch (error) {
    // Record exception
    telemetry.tracer.recordException(error);
    throw error;
  }
});
```

## Key Components

### Server

Create and manage an HTTP server for handling API requests:

```typescript
import { createServer } from '@motiadev/core'

const server = await createServer(lockedData, eventManager, stateAdapter, config)
```

### Event Management

Publish and subscribe to events across your application:

```typescript
import { createEventManager } from '@motiadev/core'

const eventManager = createEventManager()

// Subscribe to events
eventManager.subscribe({
  event: 'user.created',
  handlerName: 'sendWelcomeEmail',
  filePath: '/path/to/handler.ts',
  handler: (event) => {
    // Handle the event
  }
})

// Emit events
eventManager.emit({
  topic: 'user.created',
  data: { userId: '123' },
  traceId: 'trace-123',
  logger: logger
})
```

### Step Handlers

Create handlers for different types of steps (API, Event, Cron):

```typescript
import { createStepHandlers } from '@motiadev/core'

const stepHandlers = createStepHandlers(lockedData, eventManager, state, config)
```

### State Management

Manage application state with different adapters:

```typescript
import { createStateAdapter } from '@motiadev/core'

const stateAdapter = createStateAdapter({
  adapter: 'redis',
  host: 'localhost',
  port: 6379
})

// Use state in your handlers
await state.set(traceId, 'key', value)
const value = await state.get(traceId, 'key')
```

### Cron Jobs

Schedule and manage cron jobs:

```typescript
import { setupCronHandlers } from '@motiadev/core'

const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory)
```

### Logging

Use the built-in logging system:

```typescript
import { globalLogger } from '@motiadev/core'

globalLogger.info('Application started')
globalLogger.error('Something went wrong', { error: err })
```

## Multi-language Support

Motia supports writing step handlers in multiple languages:

- TypeScript/JavaScript
- Python
- Ruby

Each language has its own runner that communicates with the core framework.

## Types

The package exports TypeScript types for all components:

```typescript
import { 
  Event, 
  FlowContext, 
  ApiRouteConfig, 
  EventConfig, 
  CronConfig 
} from '@motiadev/core'
```

## License

This package is part of the Motia framework and is licensed under the same terms.
```
