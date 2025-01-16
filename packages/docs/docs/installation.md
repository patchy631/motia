---
sidebar_position: 2
title: Installation
---

# Installation

This guide shows how to define a **minimal Step** and run the **Wistro** dev server—using **pnpm** for package management.

## 1. Install Wistro

Use **pnpm** (or npm, yarn, etc.):

```bash
pnpm add wistro
```

Then, add a script to your **package.json**:

```json
{
  "scripts": {
    "dev": "wistro dev"
  }
}
```

## 2. Minimal Step Example

Create a file named **addNumbers.step.js** in your project:

```js
// file: addNumbers.step.js

exports.config = {
  type: 'event', // "event", "api", or "cron"
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
}

exports.handler = async (input, { emit }) => {
  const sum = (input.a || 0) + (input.b || 0)
  await emit({
    type: 'numbers-added',
    data: { result: sum },
  })
}
```

This Step **listens** for the event `"add-numbers"` and **emits** `"numbers-added"`.
It’s the simplest possible example with **no** extra dependencies or logs.

## 3. Start Wistro

From your project root, run:

```bash
pnpm run dev
```

Wistro will:

1. Scan for `.step.<py, ts, js, rb>` files
2. Register your Steps
3. Launch a dev server (port 3000 by default)

## 4. Next Steps

- **Create More Steps**: Explore `event`, `api`, and `cron` types
- **Flows (Optional)**: Group Steps for better visualization in Wistro UI
- **Observability**: Investigate logs & traces

Need help? See our [Community Resources](./community.md) for questions, examples, and discussions.
