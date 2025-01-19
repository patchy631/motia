import { EventConfig, StepHandler } from '@motia/core'
import { z } from 'zod'
import axios from 'axios'

// The payload expected by this step
const inputSchema = z.object({
  messageId: z.string().uuid(),
  flowPlan: z.object({
    flowName: z.string(),
    steps: z.array(
      z.object({
        name: z.string(),
        filename: z.string(),
        type: z.enum(['api', 'event', 'noop']),
        description: z.string(),
        subscribes: z.array(z.string()).optional(),
        emits: z.array(z.string()),
        implementation: z.object({
          required_imports: z.array(z.string()),
          core_logic: z.string(),
          state_management: z.string(),
          error_handling: z.string(),
        }),
      }),
    ),
    flowDiagram: z.string(),
  }),
})

// The step config
export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Code Generator',
  description: 'Generates TypeScript code for each step in the flow',
  subscribes: ['flow-builder.generate-code'],
  emits: ['flow-builder.write-files', 'flow-builder.error'],
  input: inputSchema,
  flows: ['flow-builder'],
}

// This is the prompt skeleton for each step
const STEP_CODE_PROMPT = `Generate TypeScript code for a Motia workflow step with these requirements:

Step Name: {name}
Type: {type}
Description: {description}
Subscribes to: {subscribes}
Emits: {emits}

Implementation Details:
{implementation}

Generate complete, production-ready TypeScript code that:
1. Uses proper Motia framework imports
2. Includes complete type definitions
3. Implements proper error handling
4. Uses state management if needed
5. Follows best practices for logging

Return ONLY the complete TypeScript code with no additional text or explanation.`

export const handler: StepHandler<typeof config> = async (input, { emit, logger, state }) => {
  const { messageId, flowPlan } = input

  logger.info('[Code Generator] Starting code generation', {
    messageId,
    flowName: flowPlan.flowName,
  })

  try {
    // Mark flow state as generating_code
    await state.set(messageId, 'flowState', {
      currentPhase: 'generating_code',
      timestamp: new Date().toISOString(),
      error: null,
    })

    const generatedFiles = []

    // For each step in the plan, call Anthropic to generate code
    for (const step of flowPlan.steps) {
      logger.info('[Code Generator] Generating step', {
        stepName: step.name,
        filename: step.filename,
      })

      // Build the prompt
      const prompt = STEP_CODE_PROMPT.replace('{name}', step.name)
        .replace('{type}', step.type)
        .replace('{description}', step.description)
        .replace('{subscribes}', JSON.stringify(step.subscribes || []))
        .replace('{emits}', JSON.stringify(step.emits))
        .replace('{implementation}', JSON.stringify(step.implementation, null, 2))

      const response = await axios({
        method: 'post',
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'content-type': 'application/json',
        },
        data: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 2048,
          system: 'Generate the code based on the message.',
        },
        validateStatus: null, // Don't throw on non-2xx
      })

      // We expect the code text in response.data.content[0].text
      if (!response.data?.content || !response.data.content[0]?.text) {
        throw new Error('Anthropic code generation response missing text')
      }
      const generatedCode = response.data.content[0].text.trim()

      // Validate basic presence of key items
      // validateGeneratedCode(generatedCode)

      // Push the file into our array
      generatedFiles.push({
        filename: step.filename,
        content: generatedCode,
      })
    }

    logger.info('[Code Generator] Code generation complete', {
      messageId,
      fileCount: generatedFiles.length,
    })

    // Store the code
    await state.set(messageId, 'generatedFiles', generatedFiles)

    // Next step: write these files somewhere (flow-builder.write-files)
    await emit({
      type: 'flow-builder.write-files',
      data: {
        messageId,
        flowName: flowPlan.flowName,
        files: generatedFiles,
      },
    })
  } catch (error) {
    logger.error('[Code Generator] Error generating code', {
      error: (error as Error).message,
      messageId,
    })

    await state.set(messageId, 'flowState', {
      currentPhase: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to generate code',
    })

    await emit({
      type: 'flow-builder.error',
      data: {
        messageId,
        error: 'Failed to generate workflow code. Please try again.',
      },
    })
  }
}

// Quick checks to ensure the generated code is somewhat valid
function validateGeneratedCode(code: string) {
  // Basic checks
  if (!code.includes('import')) {
    throw new Error('Generated code missing imports')
  }
  if (!code.includes('export const config')) {
    throw new Error('Generated code missing config export')
  }
  if (!code.includes('export const handler')) {
    throw new Error('Generated code missing handler export')
  }

  // Check for typical TS syntax
  const syntaxChecks = ['interface', 'type', 'async', 'try', 'catch']
  if (!syntaxChecks.some((kw) => code.includes(kw))) {
    throw new Error('Generated code missing expected TypeScript syntax')
  }
}
