import { StepConfig } from '../wistro.types'

export type FlowDefinition = {
  name: string
}

export type CronDefinition = {
  name: string
  description?: string
  cron: string
  emits: string
  tags?: string[]
  flows: string[]
}

export type StateConfig = {
  adapter: string
  host: string
  port: number
  password?: string
}

export type Config = {
  port: number
  flows: Record<string, FlowDefinition>
  state: StateConfig
}

export type Step<TConfig extends StepConfig = StepConfig> = {
  config: TConfig
  file: string
  filePath: string
}
