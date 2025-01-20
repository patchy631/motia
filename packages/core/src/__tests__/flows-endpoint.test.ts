import { mockedFlows } from '../../test/fixtures/mocked-flow-steps'
import { generateFlowsList } from '../flows-endpoint'

describe('generateFlowsList', () => {
  it('should generate a list of flows with steps', () => {
    const result = generateFlowsList(mockedFlows)

    expect(result.map(({ id }) => id)).toEqual(['motia-server'])
    expect(result.map(({ steps }) => steps.map((step) => step.name)).flat()).toEqual([
      'Start Event',
      'Processor',
      'Finalizer',
    ])
  })
})
