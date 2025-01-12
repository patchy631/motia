---
sidebar_position: 3
title: Defining Steps
---

# Defining Steps

In **Wistro**, **all logic** is broken down into **Steps**. Each Step has:

- A **type** (`event`, `api`, or `cron`)
- A **config** object describing how it’s triggered
- A **handler** function that processes input and can **emit** new events

## Event Steps

**Event** Steps subscribe to one or more event topics and optionally emit new events.

```js
// addNumbers.step.js

exports.config = {
  type: 'event', // "event", "api", or "cron"
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
}

exports.handler = async (input, { emit }) => {
  const sum = (input.a || 0) + (input.b || 0)
  await emit({ type: 'numbers-added', data: { result: sum } })
}
```

- **subscribes**: array of event topics that trigger this Step
- **emits**: array of event topics this Step may emit

## API Steps

**API** Steps define a REST endpoint. Typically, they also **emit** a follow-up event after handling the request.

```js
// exampleApi.step.js
exports.config = {
  type: 'api',
  name: 'AddNumbersApi',
  path: '/api/add',
  method: 'POST',
  emits: ['add-numbers'],
}

exports.handler = async (req, { emit, logger }) => {
  logger.info('[AddNumbersApi] Received data', { body: req.body })

  await emit({
    type: 'add-numbers',
    data: req.body,
  })

  return {
    status: 200,
    body: { message: 'Triggered add-numbers event' },
  }
}
```

- **path**: the URL path for this endpoint (e.g., `/api/hello`)
- **method**: HTTP method (e.g., `POST`)
- **emits**: event(s) sent after request is handled

## Cron Steps

**Cron** Steps run on a schedule using standard [cron syntax](https://crontab.guru/).

```js
// periodicJob.step.js

exports.config = {
  type: 'cron',
  name: 'PeriodicJob',
  cron: '0/10 * * * *', // run every 10 minutes
  emits: ['cron-ticked'],
}

exports.handler = async (_, { emit }) => {
  // Some repeating job or background task
  await emit({ type: 'cron-ticked', data: { timestamp: Date.now() } })
}
```

- **cron**: standard cron string (e.g. `0/10 * * * *`)

## The Handler Signature

Each **handler** receives:

```
(input, { emit, state, traceId }) => { ... }
```

- **input**: Data from the triggered event or inbound request
- **emit(...)**: Send new events into Wistro
- **state**: Access or store flow state (if configured)
- **traceId**: Correlate or log across multiple Steps

## The config Field

Every `.step.js` must export a **config** object:

- **type**: `'event'` | `'api'` | `'cron'`
- **name**: a human-friendly identifier
- **subscribes**/**emits** (for `event` steps)
- **method**, **path** (for `api` steps)
- **cron** (for `cron` steps)

## Next Steps

- **[Installation](./installation.md)**: If you haven’t set up Wistro yet.
- **Flows** (Optional): Group related Steps for easier visualization and logs.
- **Observability**: Explore logs, event traces, and debugging.
