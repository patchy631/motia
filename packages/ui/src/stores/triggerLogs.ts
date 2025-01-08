import { create } from 'zustand'

export type Log = {
  level: string
  time: number
  msg: string
  traceId: string
  workflowId: string
  [key: string]: any
}

export type TriggerLogsState = {
  logs: Log[]
  addLog: (log: Log) => void
  resetLogs: () => void
}

export const useTriggerLogs = create<TriggerLogsState>()((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ ...state, logs: [...state.logs, log] })),
  resetLogs: () => set({ logs: [] }),
}))
