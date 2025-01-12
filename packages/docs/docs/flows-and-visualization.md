---
sidebar_position: 5
title: Flows & Visualization
---

# Flows & Visualization

**Flows** let you group multiple Steps under a single name, making it easier to visually map out how events move from Step to Step. While flows are technically optional, they're very useful for:

- **Clarity**: Understand which Steps belong together.
- **Visualization**: See a "flow diagram" of triggers, event-based Steps, and how they connect.
- **Observability**: Group logs and events by flow name.

## 1. Tagging Steps with a Flow

To associate Steps with a flow, add a `flows` field to your Step config. For example:

```js
// addNumbers.step.js
exports.config = {
  type: 'event',
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
  flows: ['demo-flow'], // <-- Assign it to a flow
}

exports.handler = async (input, { emit, logger }) => {
  const sum = (input.a ?? 0) + (input.b ?? 0)
  logger.info('[AddNumbers] Calculated sum', { sum })
  await emit({ type: 'numbers-added', data: { result: sum } })
}
```

```js
// exampleApi.step.js
exports.config = {
  type: 'api',
  name: 'AddNumbersApi',
  path: '/api/add',
  method: 'POST',
  emits: ['add-numbers'],
  flows: ['demo-flow'], // <-- Same flow name
}

exports.handler = async (req, { emit, logger }) => {
  logger.info('[AddNumbersApi] Received data', { body: req.body })
  await emit({ type: 'add-numbers', data: req.body })
  return { status: 200, body: { message: 'Triggered add-numbers event' } }
}
```

If you have multiple flows, you can list them, e.g. `flows: ['billing-flow', 'analytics-flow']`, but most Steps just use one.

## 2. Viewing Your Flows

1. **Run your Wistro server** (as before):

   ```sh
   pnpm run dev
   ```

2. **Open** your browser to the local Wistro UI (often `http://localhost:3000` or `http://127.0.0.1:3000`).

3. **Look for** a flow named **“demo-flow”** (or whatever name you used). You’ll see each Step displayed as a node, with lines showing how events connect.

4. **Click** on a Step node to see its config details, e.g. the Step name, emits, and subscribes.

![Demo Workbench](/img/demo-workbench.jpg)

## 3. Flow Diagram Basics

The Wistro UI tries to map your Steps in a graph:

- **API Steps** appear as “inbound triggers” (they create events).
- **Event Steps** appear as nodes that subscribe to one or more events and possibly emit new events.
- Lines connect “emits” from one Step to “subscribes” of another.

This helps you see the big picture:

1. **AddNumbersApi** triggers on `POST /api/add`.
2. It emits `add-numbers`.
3. **AddNumbers** receives `add-numbers`, sums up, and emits `numbers-added`.
4. If you had another Step subscribing to `numbers-added`, that would appear downstream.

## 4. Flow-Specific Logs

In your terminal (or in the UI logs panel if provided), Steps that share a flow can be filtered by that flow name. This makes it easier to debug all events belonging to **“demo-flow”** rather than scanning all Steps across your entire project.

---

### Next Steps

- **Advanced Triggers**: Explore cron Steps and more complex API usage.
- **Observability**: Learn about advanced logging, metrics, and event tracing.
- **Production & Deployment**: Best practices for shipping Wistro flows at scale.
