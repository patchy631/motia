import { Log, useTriggerLogs } from '@/stores/triggerLogs'
import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

type UseWebSocketReturn = {
  isConnected: boolean
}

const socket = io('/')

export const useLogListener = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(socket.connected)
  const addLog = useTriggerLogs((state) => state.addLog)

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onLog = (log: Log) => addLog(log)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('log', onLog)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('log', onLog)
    }
  }, [addLog])

  return { isConnected }
}
