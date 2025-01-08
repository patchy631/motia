import { test, expect } from '@playwright/test'
import path from 'path'
import { createTestServer, Event, WistroServer } from 'wistro'

type EventDataType = {
  stepA: Record<string, unknown>
  stepB: Record<string, unknown>
  stepC: Record<string, unknown>
  mergedAt: Record<string, unknown>
}

test.describe('Parallel Merge State Workflow + Redis E2E', () => {
  let collectedEvents: Array<Event<EventDataType>> = []
  let server: WistroServer
  let eventSubscriber = (event: Event<EventDataType>) => {
    collectedEvents.push(event)
  }

  test.beforeAll(async () => {
    const result = await createTestServer(path.join(__dirname, '../../'), eventSubscriber)
    server = result.server
  })

  test.afterAll(async () => {
    await server.close()
  })

  test.beforeEach(async () => {
    // Reset our array for each test
    collectedEvents = []
  })

  test('verifies parallel merge flow state & events', async ({ page }) => {
    // 1. Trigger the flow
    const response = await fetch('http://localhost:3000/api/parallel-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Start parallel merge test',
      }),
    })
    expect(response.status).toBe(200)

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 2. Verify event sequence
    const eventTypes = collectedEvents.map((ev) => ev.type)

    // Expected event sequence
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        'pms.initialize',
        'pms.start',
        'pms.stepA.done',
        'pms.stepB.done',
        'pms.stepC.done',
        'pms.join.complete',
      ]),
    )

    // 3. Get the flow trace ID
    const startEvent = collectedEvents.find((ev) => ev.type === 'pms.start')
    expect(startEvent?.traceId).toBeDefined()

    // 5. Verify final completion event data
    const completionEvent = collectedEvents.find((ev) => ev.type === 'pms.join.complete')
    expect(completionEvent).toBeDefined()
    expect(completionEvent?.data).toMatchObject({
      stepA: expect.any(Object),
      stepB: expect.any(Object),
      stepC: expect.any(Object),
      mergedAt: expect.any(String),
    })
  })
})
