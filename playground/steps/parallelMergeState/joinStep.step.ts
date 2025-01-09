import { z } from 'zod'
import { FlowConfig, FlowExecutor } from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({})

export const config: FlowConfig<Input> = {
  name: 'join-step',
  subscribes: ['pms.stepA.done', 'pms.stepB.done', 'pms.stepC.done'],
  emits: ['pms.join.complete'],
  input: inputSchema,
  flows: ['parallel-merge'],
}

export const executor: FlowExecutor<Input> = async (_, emit, ctx) => {
  const traceId = ctx.traceId
  ctx.logger.info('[join-step] Checking if all partial results exist for traceId =', traceId)

  const state = await ctx.state.get<
    Partial<{
      stepA: { msg: string; timestamp: number }
      stepB: { msg: string; timestamp: number }
      stepC: { msg: string; timestamp: number }
      done: boolean
    }>
  >()

  if (!state.done || !state.stepA || !state.stepB || !state.stepC) {
    ctx.logger.info('[join-step] Not all steps done yet, ignoring for now.')
    return
  }

  ctx.logger.info('[join-step] All steps are complete. Merging results...')

  const merged = {
    stepA: state.stepA,
    stepB: state.stepB,
    stepC: state.stepC,
    mergedAt: new Date().toISOString(),
  }

  await emit({
    type: 'pms.join.complete',
    data: merged,
  })

  await ctx.state.clear()
}
