exports.config = {
  type: 'api',
  name: 'AddNumbersApi',
  path: '/api/add',
  method: 'POST',
  emits: ['add-numbers'],
  flows: ['demo-flow'], // <-- Same flow name
}

exports.handler = async (req, { emit, logger }) => {
  logger.info('[AddNumbersApi] Received data', { body: req.body })
  await emit({ type: 'add-numbers', data: req.body })
  return { status: 200, body: { message: 'Triggered add-numbers event' } }
}
