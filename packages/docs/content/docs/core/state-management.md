---
sidebar_position: 6
title: State Management
---

Motia provides a robust state management system for maintaining workflow state across steps. The system:

- Is distributed by default using Redis
- Supports atomic operations
- Provides TTL-based cleanup
- Maintains state isolation between flows

## Core Concepts

### State Scope

Each workflow execution gets a unique state space identified by its `traceId`. This ensures:

- Isolation between concurrent executions
- Clean state boundaries
- Automatic cleanup

### State Structure

```typescript
// Example state structure
{
  "motia:state:{traceId}": {
    "booking": {
      "customer": { ... },
      "venue": { ... }
    },
    "payment": {
      "status": "pending",
      "amount": 100
    }
  }
}
```

## Using State in Steps

### TypeScript/JavaScript

```typescript
import { EventConfig, StepHandler } from '@motiadev/core'

export const handler: StepHandler<typeof config> = async (input, { state, traceId }) => {
  // Store state
  await state.set(traceId, 'booking', {
    customer: input.customer,
    venue: input.venue,
  })

  // Retrieve state
  const booking = await state.get<BookingData>(traceId, 'booking')

  // Delete specific state
  await state.delete(traceId, 'booking')

  // Clear all state for this trace
  await state.clear(traceId)
}
```

### Python

```python
async def handler(input, ctx):
    # Store state
    await ctx.state.set('booking', {
        'customer': input.customer,
        'venue': input.venue
    })

    # Retrieve state
    booking = await ctx.state.get('booking')

    # Delete specific state
    await ctx.state.delete('booking')

    # Clear all state
    await ctx.state.clear()
```

### Ruby

```ruby
def handler(input, ctx)
  # Store state
  ctx.state.set('booking', {
    customer: input.customer,
    venue: input.venue
  })

  # Retrieve state
  booking = ctx.state.get('booking')

  # Delete specific state
  ctx.state.delete('booking')

  # Clear all state
  ctx.state.clear()
end
```

## Configuration

### Redis Adapter

```yaml
# config.yml
state:
  adapter: redis
  host: localhost
  port: 6379
  password: optional
  ttl: 3600 # Optional: Time in seconds before state expires
```

### Custom State Adapters

```typescript
import { StateAdapter } from '@motiadev/core'

class CustomStateAdapter extends StateAdapter {
  async get<T>(traceId: string, key: string): Promise<T | null> {
    // Implementation
  }

  async set<T>(traceId: string, key: string, value: T): Promise<void> {
    // Implementation
  }

  async delete(traceId: string, key: string): Promise<void> {
    // Implementation
  }

  async clear(traceId: string): Promise<void> {
    // Implementation
  }

  async cleanup(): Promise<void> {
    // Implementation
  }
}
```

## Best Practices

### State Organization

1. **Use Namespacing**

   ```typescript
   // Good
   await state.set(traceId, 'booking.customer', customerData)
   await state.set(traceId, 'booking.venue', venueData)

   // Avoid
   await state.set(traceId, 'customer', customerData)
   await state.set(traceId, 'venue', venueData)
   ```

2. **Type Safety**

   ```typescript
   // Define types for your state
   interface BookingState {
     customer: CustomerData
     venue: VenueData
     status: 'pending' | 'confirmed'
   }

   // Use typed state access
   const booking = await state.get<BookingState>(traceId, 'booking')
   ```

3. **State Cleanup**

   ```typescript
   // Clean up after flow completion
   export const handler: StepHandler<typeof config> = async (input, { state, traceId }) => {
     try {
       // Process final step
       await processFinalization(input)

       // Clean up state
       await state.clear(traceId)
     } catch (error) {
       // Handle errors
     }
   }
   ```

### Performance Considerations

1. **Batch Operations**

   - Group related state updates
   - Use atomic operations when possible
   - Consider state size and access patterns

2. **TTL Management**
   - Set appropriate TTLs for your workflow
   - Consider workflow duration
   - Account for error recovery time

## Debugging

### Redis CLI Commands

```bash
# List all state keys
redis-cli KEYS "motia:state:*"

# Get specific state
redis-cli GET "motia:state:{traceId}:booking"

# Check TTL
redis-cli TTL "motia:state:{traceId}"
```

### Common Issues

1. **State Not Found**

   - Check TTL expiration
   - Verify traceId
   - Check key namespacing

2. **Concurrent Access**

   - Use atomic operations
   - Implement retry logic
   - Handle race conditions

3. **Memory Usage**
   - Monitor Redis memory
   - Implement state cleanup
   - Use appropriate TTLs
