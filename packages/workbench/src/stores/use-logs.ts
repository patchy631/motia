import { create } from 'zustand'

export type Log = {
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

export type LogsState = {
  logs: Log[]
  addLog: (log: Log) => void
  resetLogs: () => void
}

export const useLogs = create<LogsState>()((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ ...state, logs: [...state.logs, log] })),
  resetLogs: () => set({ logs: [] }),
}))
