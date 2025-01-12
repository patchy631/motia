import { mockFlowSteps } from '../../test/fixtures/mockedFlowSteps'
import { generateFlowsList } from '../flows-endpoint'

describe('generateFlowsList', () => {
  it('should generate a list of flows with steps', () => {
    const result = generateFlowsList(mockFlowSteps)

    expect(result.map(({ id }) => id)).toEqual(['wistro-server'])
    expect(result.map(({ steps }) => steps.map((step) => step.name)).flat()).toEqual([
      'Start Event',
      'Processor',
      'Finalizer',
    ])
  })
})
