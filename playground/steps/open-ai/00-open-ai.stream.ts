import { StateStreamConfig } from 'motia'
import { z } from 'zod'

export const config: StateStreamConfig = {
  name: 'openai',
  schema: z.object({ message: z.string() }),
  baseConfig: { storageType: 'state', property: 'message' },
}
