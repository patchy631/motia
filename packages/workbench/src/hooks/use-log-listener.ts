import { useLogs } from '@/stores/use-logs'
import { useStreamGroup, useStreamEventHandler } from '@motiadev/stream-client-react'

export const useLogListener = () => {
  const addLog = useLogs((state) => state.addLog)
  const { event } = useStreamGroup({ streamName: '__motia.logs', groupId: 'default' })

  useStreamEventHandler({ event, type: 'log', listener: addLog }, [addLog])
}
