import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

//
// We'll define the input to this step
//
const inputSchema = z.object({
  messageId: z.string().uuid(),
  flowName: z.string(),
  files: z.array(
    z.object({
      filename: z.string(), // e.g., "process-data.step.ts"
      content: z.string(), // The generated TypeScript code
    }),
  ),
})

//
// Step config
//
export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Write Files',
  description: 'Writes the generated TypeScript files to disk',
  subscribes: ['flow-builder.write-files'],
  emits: ['flow-builder.completed', 'flow-builder.error'],
  input: inputSchema,
  flows: ['flow-builder'],
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger, state }) => {
  const { messageId, flowName, files } = input

  logger.info('[Write Files] Received files to write', {
    messageId,
    fileCount: files.length,
    flowName,
  })

  try {
    // Mark flow state
    await state.set(messageId, 'flowState', {
      currentPhase: 'writing_files',
      timestamp: new Date().toISOString(),
      error: null,
    })

    // We'll create a sub-directory for these files, e.g. /playground/generated
    // or any path you like
    const outputDir = path.join(process.cwd(), 'steps', flowName)

    // Ensure the directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // Write each file
    for (const file of files) {
      const filePath = path.join(outputDir, file.filename)
      logger.info('[Write Files] Writing file', { filePath })
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    logger.info('[Write Files] All files written successfully', { messageId })

    // Optionally store something in state
    await state.set(messageId, 'flowState', {
      currentPhase: 'done',
      timestamp: new Date().toISOString(),
      error: null,
    })

    // Emit final event
    await emit({
      type: 'flow-builder.completed',
      data: {
        messageId,
        flowName,
        fileCount: files.length,
      },
    })
  } catch (error) {
    logger.error('[Write Files] Error writing files', {
      error: (error as Error).message,
      messageId,
    })

    await state.set(messageId, 'flowState', {
      currentPhase: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to write files',
    })

    // Let the flow know we failed
    await emit({
      type: 'flow-builder.error',
      data: {
        messageId,
        error: 'Failed to write files. Please try again.',
      },
    })
  }
}
