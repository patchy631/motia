import { FlowView } from '@/views/flow/flow-view'
import { MermaidView } from '@/views/mermaid/mermaid-view'
import { FlowConfigResponse, FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useFlowUpdateListener } from '../hooks/use-flow-update-listener'
import { Button } from '@/components/ui/button'
import { GitBranch, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="absolute top-4 left-4 z-10 flex bg-zinc-900/80 backdrop-blur-sm rounded-md shadow-md p-1">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('graph')}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            viewMode === 'graph' 
              ? "bg-[#242036] text-white" 
              : "text-gray-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <GitBranch size={14} />
          Graph
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('mermaid')}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            viewMode === 'mermaid' 
              ? "bg-[#242036] text-white" 
              : "text-gray-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <Code size={14} />
          Mermaid
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
