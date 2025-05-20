import { useStreamGroup } from '@motiadev/stream-client-react'

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
  const { data: endpoints } = useStreamGroup<ApiEndpoint>({
    streamName: '__motia.api-endpoints',
    groupId: 'default',
  })

  return endpoints
}
