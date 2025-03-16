import React, { useEffect, useState } from 'react'
import { FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import mermaid from 'mermaid'

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
      // Configure mermaid
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        },
        themeVariables: {
          // Customizing colors to match workbench theme
          primaryColor: '#333',
          primaryTextColor: '#fff',
          primaryBorderColor: '#555',
          lineColor: '#666',
          secondaryColor: '#333',
          tertiaryColor: '#222'
        }
      })

      try {
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
    <div className="w-full h-full bg-zinc-900 p-6 overflow-auto">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold text-white mb-6">
          Flow: <span className="text-blue-400">{flow.name}</span>
        </h2>
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg max-w-6xl w-full">
          <div className="overflow-auto" id="mermaid-container"></div>
        </div>
      </div>
    </div>
  )
}