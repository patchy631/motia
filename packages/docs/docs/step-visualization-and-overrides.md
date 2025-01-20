---
sidebar_position: 9
title: Step Visualization And Overrides
---

# Step Visualization

Every step in Motia can have a custom visualization in the workbench by providing a React component. This allows you to:

- Create more intuitive flow diagrams
- Add visual feedback for different states
- Make testing and development easier
- Provide better documentation through the UI

## Basic Override

To override a step's visualization:

1. Create a `.tsx` file next to your step with the same base name:

```
steps/
  └── myStep/
      ├── myStep.step.ts      # Step definition
      └── myStep.step.tsx     # Visual override
```

2. Export a default React component:

```typescript
// myStep.step.tsx
import React from 'react'
import { EventNode, EventNodeProps } from '@motiadev/workbench'

export default ({ data }: EventNodeProps) => {
  return (
    <EventNode
      data={data}
      variant="white"
      className="py-2 px-4"
    />
  )
}
```

## Available Base Components

Motia provides several base components for building step visualizations:

### 1. EventNode

For general purpose steps:

```typescript
import { EventNode, EventNodeProps } from '@motiadev/workbench'

export default ({ data }: EventNodeProps) => {
  return (
    <EventNode
      data={data}
      variant="white" // 'white' | 'ghost' | 'noop'
      shape="rounded" // 'rounded' | 'square' | 'noop'
      className="custom-styles"
    >
      <div>Custom content here</div>
    </EventNode>
  )
}
```

### 2. ApiNode

For API and api steps:

```typescript
import { ApiNode, ApiNodeProps } from '@motiadev/workbench'

export default ({ data }: ApiNodeProps) => {
  return (
    <ApiNode
      data={data}
      className="custom-styles"
    >
      <div>Custom api content</div>
    </ApiNode>
  )
}
```

### 3. BaseHandle

For custom node connections:

```typescript
import { BaseHandle, Position } from '@motiadev/workbench'

export default () => {
  return (
    <div className="custom-node">
      <BaseHandle
        type="target"
        position={Position.Top}
      />
      <div>Node content</div>
      <BaseHandle
        type="source"
        position={Position.Bottom}
      />
    </div>
  )
}
```

## Styling Rules

1. Use Tailwind's core utility classes only
2. No arbitrary values (wrong: w-[123px], correct: w-32)
3. Keep styling responsive and flexible
4. Match Motia's visual design system

## Real-World Examples

### Processing Step

```typescript
import React from 'react'
import { EventNode, EventNodeProps } from '@motiadev/workbench'

export default ({ data }: EventNodeProps) => {
  return (
    <EventNode
      data={data}
      variant="ghost"
      className="bg-blue-500 text-white rounded-full px-6 py-3"
    >
      <div className="flex items-center gap-2">
        <ProcessingIcon className="w-4 h-4" />
        <span>Processing Data</span>
      </div>
    </EventNode>
  )
}
```

### API Endpoint

```typescript
import React from 'react'
import { ApiNode, ApiNodeProps } from '@motiadev/workbench'
import { Globe } from 'lucide-react'

export default ({ data }: ApiNodeProps) => {
  return (
    <ApiNode
      data={data}
      className="border-sky-500"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span>{data.name}</span>
      </div>
    </ApiNode>
  )
}
```

### Custom Node

```typescript
import React from 'react'
import { BaseHandle, Position, EventNodeProps } from '@motiadev/workbench'

export default ({ data }: EventNodeProps) => {
  return (
    <div className="bg-green-500 text-white rounded-full p-4 text-center">
      <BaseHandle type="target" position={Position.Top} />
      <div>{data.name}</div>
      <div className="text-sm">{data.description}</div>
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
```

## Common Patterns

### 1. State Indication

```typescript
export default ({ data }: EventNodeProps) => {
  return (
    <EventNode
      data={data}
      variant={isActive ? "white" : "ghost"}
      className={cn(
        "transition-colors",
        isActive && "bg-green-500",
        isError && "bg-red-500"
      )}
    />
  )
}
```

### 2. Progress Visualization

```typescript
export default ({ data }: EventNodeProps) => {
  return (
    <EventNode data={data}>
      <div className="relative w-full h-2 bg-gray-200 rounded">
        <div
          className="absolute h-2 bg-blue-500 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
    </EventNode>
  )
}
```

### 3. Interactive Elements

```typescript
export default ({ data }: EventNodeProps) => {
  return (
    <EventNode data={data}>
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={() => console.log('Clicked')}
      >
        Trigger
      </button>
    </EventNode>
  )
}
```

## Best Practices

1. **Keep it Simple**

   - Use base components when possible
   - Minimize custom styling
   - Make connections clear

2. **Visual Clarity**

   - Show state clearly
   - Use consistent colors
   - Keep text readable

3. **Performance**

   - Avoid heavy computations
   - Minimize state usage
   - Keep components light

4. **Maintenance**
   - Document custom components
   - Use consistent patterns
   - Share common styles

## Next Steps

1. Review existing step visualizations in your project
2. Identify steps that need custom visualization
3. Create reusable components for common patterns
4. Document your visual design system
