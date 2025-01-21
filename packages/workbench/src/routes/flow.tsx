import { FlowView } from '@/views/flow/flow-view'
import { FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const Flow = () => {
  const { id } = useParams()
  const [flow, setFlow] = useState<FlowResponse | null>(null)

  useEffect(() => {
    fetch(`/flows/${id}`)
      .then((res) => res.json())
      .then((flow) => setFlow(flow))
  }, [id])

  if (!flow) return null

  return (
    <div className="w-screen h-screen">
      <FlowView flow={flow} />
    </div>
  )
}
