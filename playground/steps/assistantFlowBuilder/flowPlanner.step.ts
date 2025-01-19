import { EventConfig, StepHandler } from '@motia/core'
import { z } from 'zod'
import axios from 'axios'

const inputSchema = z.object({
  messageId: z.string().uuid(),
  understanding: z.object({
    flowPurpose: z.string(),
    mainTrigger: z.string(),
    expectedOutcome: z.string(),
  }),
  documentation: z.array(
    z.object({
      filename: z.string(),
      content: z.string(),
    }),
  ),
})

export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Flow Planner',
  description: 'Designs workflow structure based on requirements and documentation',
  subscribes: ['flow-builder.plan-flow'],
  emits: ['flow-builder.generate-code', 'flow-builder.error'],
  input: inputSchema,
  flows: ['flow-builder'],
}

// Helper to clean JSON response from Claude
function cleanJsonResponse(text: string): string {
  // First, try to isolate the JSON content
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in response')
  }

  return (
    jsonMatch[0]
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Clean up newlines and spaces
      .replace(/\r?\n|\r/g, ' ')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Make sure property names are properly quoted
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
      // Fix any double quotes inside strings
      .replace(/"{2,}/g, '"')
      .trim()
  )
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger, state }) => {
  const { messageId, understanding, documentation } = input

  logger.info('[Flow Planner] Starting flow design', { messageId })

  try {
    await state.set(messageId, 'flowState', {
      currentPhase: 'planning_flow',
      timestamp: new Date().toISOString(),
      error: null,
    })

    const prompt = `You are designing a Motia workflow. Return ONLY a JSON object matching this schema exactly.
No explanation text. No markdown. Just the raw JSON.

{
  "flowName": string,  // Kebab-case name
  "steps": [{
    "name": string,       // Step name
    "filename": string,   // Kebab-case .step.ts filename
    "type": "api" | "event" | "noop",
    "description": string,
    "subscribes": string[],  // Event names this step listens for
    "emits": string[],      // Event names this step emits
    "implementation": {
      "required_imports": string[],
      "core_logic": string,
      "state_management": string,
      "error_handling": string
    }
  }],
  "flowDiagram": string  // ASCII/text representation
}

Requirements:
${JSON.stringify(understanding, null, 2)}

Documentation context:
${documentation.map((doc) => doc.content).join('\n\n')}`

    logger.debug('[Flow Planner] Sending prompt to Claude', {
      understanding,
      docCount: documentation.length,
    })

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      data: {
        model: 'claude-3-5-sonnet-latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0, // Ensure consistent output
      },
    })

    const rawResponse = response.data?.content?.[0]?.text
    if (!rawResponse) {
      throw new Error('Empty response from Claude')
    }

    logger.debug('[Flow Planner] Raw response:', { rawResponse })

    const cleanedJson = cleanJsonResponse(rawResponse)
    logger.debug('[Flow Planner] Cleaned JSON:', { cleanedJson })

    const flowPlan = JSON.parse(cleanedJson)

    // Basic validation of the flow plan
    if (!flowPlan.flowName || !Array.isArray(flowPlan.steps) || flowPlan.steps.length === 0) {
      throw new Error('Invalid flow plan structure')
    }

    logger.info('[Flow Planner] Flow design complete', {
      messageId,
      flowName: flowPlan.flowName,
      stepCount: flowPlan.steps.length,
    })

    // Store the validated flow plan
    await state.set(messageId, 'flowPlan', flowPlan)

    // Emit the next event
    await emit({
      type: 'flow-builder.generate-code',
      data: {
        messageId,
        flowPlan,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error('[Flow Planner] Error designing flow', {
      error: errorMessage,
      messageId,
    })

    await state.set(messageId, 'flowState', {
      currentPhase: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
    })

    await emit({
      type: 'flow-builder.error',
      data: {
        messageId,
        error: 'Failed to design workflow: ' + errorMessage,
      },
    })
  }
}
