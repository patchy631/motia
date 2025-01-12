exports.config = {
  type: 'event',
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
  flows: ['demo-flow'], // <-- Assign it to a flow
}

exports.handler = async (input, { emit, logger }) => {
  const sum = (input.a ?? 0) + (input.b ?? 0)
  logger.info(`[AddNumbers] Calculated ${sum}`)
  await emit({ type: 'numbers-added', data: { result: sum } })
}
