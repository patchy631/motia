import { test, expect } from '@playwright/test'
import path from 'path'
import { createTestServer, Event, WistroServer } from 'wistro'

type HybridFlowEventData = {
  items: Array<{
    id: number
    value: number
    transformed_by: string
    enriched_by: string
    processed_at: string
  }>
  summary?: Record<string, unknown>
}

test.describe('Hybrid Flow E2E', () => {
  let collectedEvents: Array<Event<HybridFlowEventData>> = []
  let server: WistroServer
  let eventSubscriber = (event: Event<HybridFlowEventData>) => {
    collectedEvents.push(event)
  }

  test.beforeAll(async () => {
    const result = await createTestServer<HybridFlowEventData>(path.join(__dirname, '../../'), eventSubscriber)
    server = result.server
  })

  test.afterAll(async () => {
    await server.close()
  })

  test.beforeEach(async () => {
    // Reset our array for each test
    collectedEvents = []
  })

  test('processes hybrid flow through all stages', async () => {
    // Test input data
    const testData = {
      items: [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
      ],
    }

    // Send the request to start the hybrid flow
    const res = await fetch('http://localhost:3000/api/hybrid-endpoint-example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: testData }),
    })

    expect(res.status).toBe(200)

    // Wait for the flow to complete
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Adjust time as needed

    // Define the expected sequence of events
    const expectedEventSequence = [
      'hybrid.validated',
      'hybrid.transformed',
      'hybrid.enriched',
      'hybrid.analyzed',
      'hybrid.completed',
    ]

    // Extract event types from collected events
    const emittedEventTypes = collectedEvents.map((e) => e.type)
    expect(emittedEventTypes).toEqual(expect.arrayContaining(expectedEventSequence))

    // Validate intermediate events
    const validatedEvent = collectedEvents.find((e) => e.type === 'hybrid.validated')
    expect(validatedEvent?.data?.items).toEqual(testData)

    const transformedEvent = collectedEvents.find((e) => e.type === 'hybrid.transformed')
    expect(transformedEvent?.data.items).toEqual([
      { id: 1, value: 20, transformed_by: 'python' },
      { id: 2, value: 40, transformed_by: 'python' },
    ])

    const enrichedEvent = collectedEvents.find((e) => e.type === 'hybrid.enriched')
    expect(enrichedEvent?.data.items).toEqual([
      {
        id: 1,
        value: 20,
        transformed_by: 'python',
        enriched_by: 'node',
        processed_at: expect.any(String),
      },
      {
        id: 2,
        value: 40,
        transformed_by: 'python',
        enriched_by: 'node',
        processed_at: expect.any(String),
      },
    ])

    // Validate the final "completed" event
    const completedEvent = collectedEvents.find((e) => e.type === 'hybrid.completed')
    expect(completedEvent?.data?.summary).toEqual({
      itemCount: 2,
      statistics: {
        total: 60,
        average: 30,
        count: 2,
        analyzed_by: 'python',
      },
      startTime: expect.any(String),
      endTime: expect.any(String),
    })
  })
})
