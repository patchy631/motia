import { StateAdapter } from 'wistro'

export const updateStateResults = async (state: StateAdapter, stepName: string, result: any) => {
  // Read current state
  const currentResults = (await state.get('results')) || {}

  // Create new state object with new result
  const newResults = {
    ...currentResults,
    [stepName]: result,
  }

  // Write back complete state
  await state.set('results', newResults)

  return newResults
}
