---
sidebar_position: 7
title: Motia Workbench
---

# Motia Workbench
TODO: Guessing we haven't worked on this yet?
The Motia Workbench is a development UI that helps you build, test, and debug your flows. It provides:

- Visual flow diagrams
- Real-time logs
- Step visualization
- Flow testing

## Starting the Workbench

Run Motia in development mode:

```bash
pnpm dev
```

This starts:

- The Motia server
- The Workbench UI (typically at http://localhost:3000)
- File watching for hot reloading

## Flow Visualization

The Workbench automatically creates visual diagrams of your flows, showing:

- API Steps (as trigger nodes)
- Event Steps (as processing nodes)
- NoOp Steps (as external process nodes)
- Event connections between steps

Each step shows:

- The step name
- Events it subscribes to
- Events it emits
- API routes (for API steps)
- Custom visualizations (if provided)

## Logs Console

The log console shows real-time logs from your flows:

- Log level (info, error, debug, warn)
- Timestamp
- Flow name
- Step name
- Custom log messages
- Trace IDs

Example log output:

```
[INFO] 2024-01-16 10:30:15 [payment-flow] Stripe Webhook: Payment received
[ERROR] 2024-01-16 10:30:16 [payment-flow] Process Payment: Invalid amount
```

## Testing Flows

The Workbench makes it easy to test your flows:

1. **API Testing**

   - API endpoints are automatically exposed
   - Use the OpenAPI documentation
   - Test different payloads
   - See real-time results

2. **Event Monitoring**

   - Watch events flow through the system
   - Trace event paths
   - Debug event payloads
   - Monitor state changes

3. **Custom Test UIs**
   - Create test-specific visualizations
   - Add interactive elements
   - Show test progress
   - Display test results

## Flow Selection

The Workbench sidebar shows all available flows:

- Grouped by category
- Search functionality
- Quick navigation
- Flow metadata

## Step Details

Click any step to see its details:

- Configuration
- Event schemas
- Documentation
- Custom UI elements

## Development Features

1. **Hot Reloading**

   - Changes reflect immediately
   - No server restart needed
   - Step updates in place
   - UI refreshes automatically

2. **Error Handling**

   - Clear error messages
   - Stack traces when needed
   - Error highlighting
   - Quick error fixes

3. **State Management**
   - Monitor Redis state
   - Track event state
   - Debug state issues
   - Clear state when needed

## Next Steps

1. **Getting Started**

   - Run the workbench
   - Create a test flow
   - Add custom visualizations
   - Test your flow

2. **Advanced Usage**

   - Add complex flows
   - Create test suites
   - Monitor performance
   - Debug issues

3. **Best Practices**
   - Organize flows well
   - Use clear naming
   - Add good documentation
   - Create helpful visualizations
