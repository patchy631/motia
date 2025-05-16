import { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../../../hooks/use-socket'

type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
type QueryParam = { name: string; description: string }

export type ApiEndpoint = {
  method: ApiRouteMethod
  path: string
  description?: string
  queryParams?: QueryParam[]
  responseSchema?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  bodySchema?: Record<string, Record<string, any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const useGetEndpoints = () => {
  const { socket } = useSocket()
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])

  const fetchEndpoints = useCallback(() => {
    fetch(`/api-endpoints`)
      .then((res) => res.json())
      .then((endpoints) => setEndpoints(endpoints))
  }, [])

  useEffect(() => {
    fetchEndpoints()
    socket.on('api-endpoint-changed', fetchEndpoints)

    return () => {
      socket.off('api-endpoint-changed', fetchEndpoints)
    }
  }, [socket, fetchEndpoints])

  return endpoints
}
