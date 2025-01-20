import { createMotiaTester } from '@motiadev/test'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

describe('parallelMerge', () => {
  let server: ReturnType<typeof createMotiaTester>

  beforeEach(async () => (server = createMotiaTester()))
  afterEach(async () => server.close())

  it('should run steps concurrently', async () => {
    const timestamp = expect.any(Number)
    // Creating a watcher for the event we want to test
    const joinComplete = await server.watch('pms.join.complete')

    const response = await server.post('/api/parallel-merge', {
      body: { message: 'Start parallel merge test' },
    })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Started parallel merge' })

    // This is important to ensure all events are handled in this test
    await server.waitEvents()

    // Checking all captured events
    expect(joinComplete.getCapturedEvents()).toHaveLength(1)

    // Checking the last captured event
    expect(joinComplete.getLastCapturedEvent()).toEqual({
      traceId: expect.any(String),
      type: 'pms.join.complete',
      flows: ['parallel-merge'],
      data: {
        mergedAt: expect.stringMatching(ISO_DATE_REGEX),
        stepA: { msg: 'Hello from Step A', timestamp },
        stepB: { msg: 'Hello from Step B', timestamp },
        stepC: { msg: 'Hello from Step C', timestamp },
      },
    })
  })
})
