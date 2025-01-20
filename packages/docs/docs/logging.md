---
sidebar_position: 5
title: Logging
---

# Logging in Motia

## Overview

Motia provides a powerful logging system that works across different programming languages and runtime environments. The logging system:

- Supports multiple log levels
- Includes contextual information
- Provides real-time log streaming
- Integrates with the Motia Workbench UI

## Core Concepts

### Log Levels

Motia supports four standard log levels:

- `info`: General information about step execution
- `error`: Error conditions and exceptions
- `debug`: Detailed debugging information
- `warn`: Warning conditions

### Log Context

Each log entry automatically includes:

- `traceId`: Unique identifier for the workflow execution
- `flows`: Array of flow names this step belongs to
- `file`: Source file generating the log
- `timestamp`: When the log was generated
- `level`: Log level
- `msg`: Log message

## Using Logging in Steps

### TypeScript/JavaScript

```typescript
import { EventConfig, StepHandler } from '@motiadev/core'

export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  // Basic logging
  logger.info('Processing payment')

  // Logging with context
  logger.info('Payment processed', {
    amount: input.amount,
    currency: input.currency,
  })

  // Error logging
  try {
    await processPayment(input)
  } catch (error) {
    logger.error('Payment failed', {
      error: error.message,
      code: error.code,
    })
  }

  // Debug logging
  logger.debug('Payment details', {
    rawInput: input,
    timestamp: Date.now(),
  })

  // Warning logging
  if (input.amount > 10000) {
    logger.warn('Large payment detected', {
      amount: input.amount,
    })
  }
}
```

### Python

```python
async def handler(input, ctx):
    # Basic logging
    ctx.logger.info('Processing payment')

    # Logging with context
    ctx.logger.info('Payment processed', {
        'amount': input.amount,
        'currency': input.currency
    })

    # Error logging
    try:
        await process_payment(input)
    except Exception as error:
        ctx.logger.error('Payment failed', {
            'error': str(error)
        })

    # Debug logging
    ctx.logger.debug('Payment details', {
        'raw_input': input.__dict__,
        'timestamp': time.time()
    })
```

### Ruby

```ruby
def executor(input, ctx)
  # Basic logging
  ctx.logger.info('Processing payment')

  # Logging with context
  ctx.logger.info('Payment processed', {
    amount: input.amount,
    currency: input.currency
  })

  # Error logging
  begin
    process_payment(input)
  rescue StandardError => error
    ctx.logger.error('Payment failed', {
      error: error.message
    })
  end

  # Debug logging
  ctx.logger.debug('Payment details', {
    raw_input: input.to_h,
    timestamp: Time.now.to_i
  })
end
```

## Configuration

### Log Levels

```yaml
# config.yml
logging:
  level: debug # 'debug', 'info', 'warn', or 'error'
```

### Custom Logger

```typescript
import { Logger } from '@motiadev/core'

class CustomLogger extends Logger {
  constructor(traceId: string, flows: string[], file: string) {
    super(traceId, flows, file)
  }

  info(message: string, args?: any) {
    // Custom info logging implementation
  }

  error(message: string, args?: any) {
    // Custom error logging implementation
  }

  debug(message: string, args?: any) {
    // Custom debug logging implementation
  }

  warn(message: string, args?: any) {
    // Custom warning logging implementation
  }
}
```

## Best Practices

### Consistent Log Levels

1. **Use `info` for**:

   - Step start/completion
   - Important business events
   - State changes

2. **Use `error` for**:

   - Exceptions
   - API failures
   - Business rule violations

3. **Use `debug` for**:

   - Detailed execution data
   - Input/output values
   - Performance metrics

4. **Use `warn` for**:
   - Potential issues
   - Deprecated features
   - Resource warnings

### Structured Logging

```typescript
// Good
logger.info('Payment processed', {
  paymentId: '123',
  amount: 100,
  status: 'success',
})

// Avoid
logger.info(`Payment ${paymentId} processed: amount=${amount}`)
```

### Context Propagation

```typescript
export const handler: StepHandler<typeof config> = async (input, { logger, traceId }) => {
  // Add business context
  logger.info('Starting payment processing', {
    businessUnit: input.businessUnit,
    region: input.region,
    correlationId: input.correlationId,
  })

  try {
    const result = await processPayment(input)

    // Log success with result context
    logger.info('Payment successful', {
      transactionId: result.transactionId,
      processingTime: result.duration,
    })
  } catch (error) {
    // Log error with full context
    logger.error('Payment failed', {
      error: error.message,
      code: error.code,
      attempt: error.attempt,
      failureType: error.type,
    })
  }
}
```

### Performance Logging

```typescript
export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  const startTime = Date.now()

  // Process payment
  const result = await processPayment(input)

  // Log performance metrics
  logger.info('Payment processing completed', {
    duration: Date.now() - startTime,
    steps: result.steps.length,
    dataSize: JSON.stringify(input).length,
  })
}
```

## Debugging

### Log Filtering

In the Motia Workbench UI:

1. Filter by log level
2. Filter by flow
3. Filter by time range
4. Search by content

### Common Patterns

1. **Transaction Tracing**

```typescript
logger.info('Starting transaction', {
  type: 'START',
  transactionId,
})

// ... processing ...

logger.info('Transaction complete', {
  type: 'END',
  transactionId,
  duration,
})
```

2. **Error Correlation**

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    correlationId: input.correlationId,
  })
}
```

## Monitoring

### Metrics to Track

- Log volume by level
- Error rates
- Warning patterns
- Performance metrics

### Log Analysis

```typescript
// Track error rates
logger.error('API failure', {
  endpoint: '/api/payment',
  statusCode: 500,
  retryCount: 3,
  errorType: 'TIMEOUT',
})

// Monitor performance
logger.info('Operation complete', {
  operationType: 'payment',
  duration: 1500,
  resourceUsage: {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  },
})
```
