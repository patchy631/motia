---
sidebar_position: 4
title: Running & Debugging
---

# Running & Debugging

If you followed our previous **Defining Steps** page, you might have two files in your project:

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

```js
// addNumbers.step.js
exports.config = {
  type: 'event',
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
}

exports.handler = async (input, { emit, logger }) => {
  const a = input.a ?? 0
  const b = input.b ?? 0
  const sum = a + b

  logger.info('[AddNumbers] Calculated sum', { sum, input })

  await emit({
    type: 'numbers-added',
    data: { result: sum },
  })
}
```

Here’s how to **run** and **debug** these Steps locally:

## 1. Start the Dev Server

1. Open a terminal in your **Wistro project root**.
2. Run:

```sh
pnpm run dev
```

This command:

- **Scans** your project for `.step.js` files
- Registers each Step’s `config` + `handler`
- **Runs** a local Wistro server (e.g., `http://localhost:3000`)

When it’s up, you’ll see something like:

```
[Wistro] Found Step: "AddNumbers" (event)
[Wistro] Found Step: "AddNumbersApi" (api)
```

## 2. Trigger the API Step

Use `curl` (or Postman, etc.) to **POST** some JSON to `/api/add`:

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"a":5,"b":7}' \
  http://localhost:3000/api/add
```

**What happens?**

- **AddNumbersApi** receives the request and emits `"add-numbers"`.
- **AddNumbers** (our event Step) subscribes to `"add-numbers"`, sums the numbers, then emits `"numbers-added"`.

In your terminal logs:

```
[AddNumbersApi] Received data { body: { a: 5, b: 7 } }
[Wistro] Emitting event: "add-numbers"
[AddNumbers] Calculated sum { sum: 12, input: { a: 5, b: 7 } }
[Wistro] Emitting event: "numbers-added"
```

## 3. Checking Logs

By default, Wistro logs each Step’s subscription, emission, and any logger calls from the handler. Look for lines like:

```
[Wistro] Found Step: "AddNumbers"
[Wistro] Found Step: "AddNumbersApi"
[AddNumbersApi] Received data ...
[AddNumbers] Calculated sum ...
```

If something fails, watch for error logs or stack traces. You can add `logger.info()`, `logger.error()`, etc., in your handlers for more detail.

## 4. Stopping the Dev Server

Press **Ctrl + C** (or **Cmd + C** on macOS) in your terminal. That’s it!
