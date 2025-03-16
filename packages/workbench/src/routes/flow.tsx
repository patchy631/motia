import { FlowView } from '@/views/flow/flow-view'
import { MermaidView } from '@/views/mermaid/mermaid-view'
import { FlowConfigResponse, FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useFlowUpdateListener } from '../hooks/use-flow-update-listener'
import { Button } from '@/components/ui/button'
import { GitBranch, Code } from 'lucide-react'

type ViewMode = 'graph' | 'mermaid'

export const Flow = () => {
  const { id } = useParams()
  const flowId = id!
  const [flow, setFlow] = useState<FlowResponse | null>(null)
  const [flowConfig, setFlowConfig] = useState<FlowConfigResponse | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('graph')

  const fetchFlow = useCallback(() => {
    Promise.all([fetch(`/flows/${flowId}`), fetch(`/flows/${flowId}/config`)])
      .then(([flowRes, configRes]) => Promise.all([flowRes.json(), configRes.json()]))
      .then(([flow, config]) => {
        setFlow(flow)
        setFlowConfig(config)
      })
  }, [flowId])

  useEffect(fetchFlow, [fetchFlow])
  useFlowUpdateListener(flowId, fetchFlow)

  if (!flow) return null

  return (
    <div className="w-full h-screen relative">
      {/* View switcher */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <Button 
          variant={viewMode === 'graph' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('graph')}
          className="flex items-center gap-2"
        >
          <GitBranch size={16} />
          Graph View
        </Button>
        <Button 
          variant={viewMode === 'mermaid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('mermaid')}
          className="flex items-center gap-2"
        >
          <Code size={16} />
          Mermaid View
        </Button>
      </div>

      {/* Render current view */}
      {viewMode === 'graph' ? (
        <FlowView flow={flow} flowConfig={flowConfig!} />
      ) : (
        <MermaidView flow={flow} />
      )}
    </div>
  )
}
