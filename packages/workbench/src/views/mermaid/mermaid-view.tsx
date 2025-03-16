import React, { useEffect, useState } from 'react'
import { FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import mermaid from 'mermaid'
import { Code } from 'lucide-react'

interface MermaidViewProps {
  flow: FlowResponse
}

export const MermaidView: React.FC<MermaidViewProps> = ({ flow }) => {
  const [diagram, setDiagram] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchMermaidDiagram = async () => {
      try {
        const response = await fetch(`/flows/${flow.name}/mermaid`)
        if (!response.ok) {
          throw new Error(`Failed to fetch mermaid diagram: ${response.statusText}`)
        }
        const data = await response.json()
        setDiagram(data.diagram)
      } catch (err) {
        console.error('Error fetching mermaid diagram:', err)
        setError(`Failed to load diagram: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMermaidDiagram()
  }, [flow.name])

  useEffect(() => {
    if (diagram) {
      console.log('Mermaid diagram to render:', diagram); // Debug the diagram syntax
      
      // Configure mermaid
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          useMaxWidth: false,
          rankSpacing: 80,
          nodeSpacing: 50
        },
        themeVariables: {
          // Customizing colors to match workbench theme
          primaryColor: '#6366f1', // Indigo for primary elements
          primaryTextColor: '#fff',
          primaryBorderColor: '#4f46e5',
          secondaryColor: '#1e1b2e',
          tertiaryColor: '#15131E', 
          lineColor: '#64748b',
          
          // Node colors by type (matching our class styling)
          apiStyleFill: '#fb923c', // API - orange
          eventStyleFill: '#60a5fa', // Event - blue
          cronStyleFill: '#4ade80', // Cron - green
          noopStyleFill: '#94a3b8', // Noop - gray
          
          // General styling
          nodeBorder: '#2d2b3a',
          clusterBkg: '#1e1b2e',
          clusterBorder: '#2d2b3a',
          titleColor: '#e2e8f0'
        }
      })

      try {
        // Create a pre element with the diagram code for debugging
        const debugContainer = document.getElementById('mermaid-debug')
        if (debugContainer) {
          debugContainer.textContent = diagram
        }
        
        // Use mermaid.render instead of init for more reliable rendering
        const container = document.getElementById('mermaid-container')
        if (container) {
          // Generate a unique ID for this render
          const id = `mermaid-${Date.now()}`
          
          mermaid.render(id, diagram)
            .then(result => {
              container.innerHTML = result.svg
              
              // Add some post-processing to make links interactive if needed
              const svg = container.querySelector('svg')
              if (svg) {
                svg.style.width = '100%'
                svg.style.maxWidth = '100%'
                svg.style.height = 'auto'
                svg.style.minHeight = '400px'
              }
            })
            .catch(err => {
              console.error('Mermaid rendering error:', err)
              setError(`Diagram syntax error: ${err instanceof Error ? err.message : String(err)}`)
            })
        }
      } catch (err) {
        console.error('Error rendering mermaid diagram:', err)
        setError(`Failed to render diagram: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }, [diagram])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-zinc-400 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading diagram...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-400 bg-red-950/30 p-4 rounded-lg max-w-md">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-[#15131E] p-6 overflow-auto">
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-medium text-white/70 mb-6 flex items-center gap-2">
          <Code size={18} className="text-indigo-400" />
          Flow Diagram: <span className="text-indigo-400 font-semibold">{flow.name}</span>
        </h2>
        <div className="bg-[#1D1A2A] border border-zinc-800 p-6 rounded-lg shadow-lg max-w-6xl w-full">
          <div className="overflow-auto min-h-[400px] flex items-center justify-center" id="mermaid-container"></div>
        </div>
        
        {/* Debug section */}
        <div className="mt-6 w-full max-w-6xl">
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-300 inline-flex items-center gap-1.5 py-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M10 20H4v-6M22 14v6h-6M2 10V4h6" />
              </svg>
              <span>View Mermaid Source</span>
            </summary>
            <pre className="mt-2 p-4 bg-zinc-950 border border-zinc-800/50 rounded text-gray-400 overflow-auto text-xs" id="mermaid-debug"></pre>
          </details>
        </div>
      </div>
    </div>
  )
}