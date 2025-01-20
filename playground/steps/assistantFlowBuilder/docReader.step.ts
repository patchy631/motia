import { EventConfig, StepHandler } from '@motiadev/core'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

// This step expects an input with messageId & a user "understanding"
const inputSchema = z.object({
  messageId: z.string().uuid(),
  understanding: z.object({
    flowPurpose: z.string(),
    mainTrigger: z.string(),
    expectedOutcome: z.string(),
  }),
})

// Our docReader step config
export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Doc Reader',
  description: 'Reads local .md docs, then emits plan-flow',
  subscribes: ['flow-builder.read-docs'],
  emits: ['flow-builder.plan-flow', 'flow-builder.error'],
  input: inputSchema,
  flows: ['flow-builder'],
}

// Utility to read all .md files from a specified directory
async function readMarkdownFiles(directory: string) {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter((file) => file.endsWith('.md'))

  const fileContents = await Promise.all(
    markdownFiles.map(async (filename) => {
      const content = await fs.readFile(path.join(directory, filename), 'utf-8')
      return { filename, content }
    }),
  )

  return fileContents
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger, state }) => {
  const { messageId, understanding } = input

  logger.info('[Doc Reader] Starting doc reading process', { messageId })

  try {
    // Mark our flow state
    await state.set(messageId, 'flowState', {
      currentPhase: 'reading_docs',
      timestamp: new Date().toISOString(),
      error: null,
    })

    // Example doc path: packages/docs/docs (adjust if you keep docs elsewhere)
    const docsDir = path.resolve(process.cwd(), '..', 'packages', 'docs', 'docs')

    let allDocs = []
    try {
      allDocs = await readMarkdownFiles(docsDir)
    } catch (err) {
      logger.warn('[Doc Reader] Could not read from docsDir', {
        docsDir,
        error: (err as Error)?.message,
      })
    }

    if (allDocs.length === 0) {
      // If no docs found, you could still proceed, or throw an error
      logger.warn('[Doc Reader] No docs found, continuing anyway')
      // Or do: throw new Error('No docs found in ' + docsDir)
    }

    logger.info('[Doc Reader] Documentation collected', {
      messageId,
      fileCount: allDocs.length,
    })

    // Now we emit flow-builder.plan-flow with the docs array
    await emit({
      type: 'flow-builder.plan-flow',
      data: {
        messageId,
        understanding,
        documentation: allDocs,
      },
    })
  } catch (error) {
    logger.error('[Doc Reader] Error reading documentation', {
      error: (error as Error)?.message,
      messageId,
    })

    // Mark flow state as error
    await state.set(messageId, 'flowState', {
      currentPhase: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to read documentation',
    })

    // Emit flow-builder.error
    await emit({
      type: 'flow-builder.error',
      data: {
        messageId,
        error: (error as Error)?.message || 'Failed to collect documentation',
      },
    })
  }
}
