import { createWistroTester } from '@wistro/test'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

describe('parallelMerge', () => {
  let server: ReturnType<typeof createWistroTester>

  beforeEach(async () => (server = createWistroTester()))
  afterEach(async () => server.close())

  it('should run steps concurrently', async () => {
    const timestamp = expect.any(Number)
    const joinComplete = await server.watch('pms.join.complete')

    const response = await server.post('/api/parallel-merge', {
      body: { message: 'Start parallel merge test' },
    })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Started parallel merge' })

    // This is important to ensure all events are handled in this test
    await server.waitEvents()

    expect(joinComplete.getCapturedEvents()).toHaveLength(1)
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
