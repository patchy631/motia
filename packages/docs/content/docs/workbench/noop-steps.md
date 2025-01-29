---
sidebar_position: 8
title: NoOp Steps
---

# NoOp Steps
TODO: Need to show examples with images on this page
NoOp (No Operation) steps are a powerful feature in Motia that serve multiple purposes:

1. Modeling external processes, webhooks and integrations
2. Representing human-in-the-loop activities
3. Creating custom visualizations in the workbench
4. Testing flows during development

## Representing External Processes

NoOp steps represent parts of your workflow that happen outside your system. Common examples include:

### 1. Webhook Callbacks

```typescript
export const config: NoopConfig = {
  type: 'noop',
  name: 'Wait for Stripe Webhook',
  description: 'Waits for payment confirmation',
  virtualSubscribes: ['payment.initiated'],
  virtualEmits: ['/api/stripe/webhook'],
  flows: ['payment'],
}
```

### 2. Human Approvals

```typescript
export const config: NoopConfig = {
  type: 'noop',
  name: 'Manager Review',
  description: 'Manager reviews request',
  virtualSubscribes: ['approval.requested'],
  virtualEmits: ['/api/approvals/submit'],
  flows: ['approval'],
}
```

### 3. External System Integration

```typescript
export const config: NoopConfig = {
  type: 'noop',
  name: 'GitHub Webhook',
  description: 'Waiting for repository events',
  virtualSubscribes: ['repository.watched'],
  virtualEmits: ['/api/github/webhook'],
  flows: ['repo-automation'],
}
```

### 4. Physical Processes

```typescript
export const config: NoopConfig = {
  type: 'noop',
  name: 'Order Fulfillment',
  description: 'Warehouse processes order',
  virtualSubscribes: ['order.placed'],
  virtualEmits: ['/api/warehouse/status'],
  flows: ['fulfillment'],
}
```

## Visualization in Workbench

NoOp steps appear differently in the Motia Workbench to help visualize your flow:

1. They show as distinct nodes in the flow diagram
2. Virtual events appear as connections
3. The waiting period is clearly visualized
4. External dependencies are obvious

## Custom UI Components

You can enhance your NoOp steps with custom React components for better visualization:

```typescript
// customNode.step.tsx
import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export default (_: EventNodeProps) => {
  return (
    <div className="p-3 px-6 flex flex-col max-w-[300px] bg-blue-500 border-white rounded-full text-white border border-solid text-center text-sm">
      <div>Custom Processing</div>
      <BaseHandle type="target" position={Position.Top} />
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}

// customNode.step.ts
export const config: NoopConfig = {
  type: 'noop',
  name: 'Custom Process',
  virtualEmits: ['/api/process/complete'],
  virtualSubscribes: ['process.start'],
  flows: ['custom-flow']
}
```

## Testing in Workbench

NoOp steps are particularly useful for testing flows in development. Here's a complete example:

### 1. Start Test Node

```typescript
// startTest.step.tsx
import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export default (_: EventNodeProps) => {
  return (
    <div className="p-4 bg-green-500 rounded-full text-white text-center">
      <div>Start Test Flow</div>
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}

// startTest.step.ts
export const config: NoopConfig = {
  type: 'noop',
  name: 'Start Test',
  virtualEmits: ['/api/test/start'],
  virtualSubscribes: [],
  flows: ['test-flow']
}
```

### 2. Monitor Progress

```typescript
// monitor.step.tsx
import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export default (_: EventNodeProps) => {
  return (
    <div className="p-4 bg-yellow-500 rounded-full text-white text-center">
      <div>Monitoring Progress</div>
      <BaseHandle type="target" position={Position.Top} />
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}

// monitor.step.ts
export const config: NoopConfig = {
  type: 'noop',
  name: 'Monitor',
  virtualEmits: ['/api/test/status'],
  virtualSubscribes: ['test.running'],
  flows: ['test-flow']
}
```

### 3. End Test Node

```typescript
// endTest.step.tsx
import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export default (_: EventNodeProps) => {
  return (
    <div className="p-4 bg-red-500 rounded-full text-white text-center">
      <div>End Test Flow</div>
      <BaseHandle type="target" position={Position.Top} />
    </div>
  )
}

// endTest.step.ts
export const config: NoopConfig = {
  type: 'noop',
  name: 'End Test',
  virtualEmits: [],
  virtualSubscribes: ['test.completed'],
  flows: ['test-flow']
}
```

## Best Practices

1. **External Process Modeling**

   - Use clear, descriptive names
   - Document expected timeframes
   - Include all possible outcomes
   - Match API routes exactly

2. **UI Components**

   - Use Tailwind's core utility classes
   - Keep components simple
   - Make connections obvious
   - Use consistent styling

3. **Testing**
   - Create dedicated test flows
   - Use visual indicators
   - Make test steps obvious
   - Document test procedures

## Available Component Tools

1. **Core Imports**

   ```typescript
   import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'
   ```

2. **Handle Placement**

   - Top for inputs
   - Bottom for outputs
   - Match your flow direction

3. **Styling Guidelines**
   - Use semantic colors
   - Keep text readable
   - Show state clearly
   - Maintain consistency

## Next Steps

1. **Start Simple**

   - Model basic external processes
   - Add custom visualization
   - Create test flows

2. **Expand Usage**

   - Add more complex scenarios
   - Enhance visualizations
   - Build comprehensive tests

3. **Optimize**
   - Refine component library
   - Improve test coverage
   - Document patterns
