import { useStreamGroup } from '@motiadev/stream-client-react'

type Flow = {
  id: string
  name: string
}

export const useListFlows = () => {
  const { data: flows } = useStreamGroup<Flow>({ streamName: '__motia.flows', groupId: 'default' })

  return { flows }
}
