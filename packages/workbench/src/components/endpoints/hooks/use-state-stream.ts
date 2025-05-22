import { useStreamItem } from '@motiadev/stream-client-react'

export const useStateStream = (object: Record<string, any> | undefined) => {
  const { data } = useStreamItem(object?.__motia)

  return {
    data: data || object,
    isStreamed: !!data,
  }
}
