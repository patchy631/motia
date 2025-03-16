import React, { useEffect, useState, useRef, useCallback } from 'react'
import { FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import mermaid from 'mermaid'
import { Code, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MermaidViewProps {
  flow: FlowResponse
}

export const MermaidView: React.FC<MermaidViewProps> = ({ flow }) => {
  const [diagram, setDiagram] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Zoom and pan state
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch the mermaid diagram
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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + 0.02, 3.0)) // Reduced increment from 0.05 to 0.02
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - 0.02, 0.15)) // Reduced increment from 0.05 to 0.02
  }, [])

  const handleResetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return
    
    // Find the SVG element
    const svgElement = document.querySelector('#mermaid-diagram svg') as SVGSVGElement;
    if (!svgElement) {
      // If SVG not found, just reset view
      handleResetView();
      return;
    }
    
    // Get container and SVG dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgRect = svgElement.getBoundingClientRect();
    
    // Add padding
    const padding = 40;
    const containerWidth = containerRect.width - padding;
    const containerHeight = containerRect.height - padding;
    
    // Calculate scale to fit
    const scaleX = containerWidth / svgRect.width;
    const scaleY = containerHeight / svgRect.height;
    
    // Use the smaller scale to ensure the entire diagram fits
    const fitScale = Math.min(scaleX, scaleY);
    
    // Set scale and center position
    setScale(Math.min(Math.max(fitScale, 0.15), 1.0)); // Cap at 1.0 for fit to screen
    setPosition({ x: 0, y: 0 }); // Reset position to center
  }, [handleResetView])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const dx = (e.clientX - dragStart.x) * 1.5 // Added multiplier for faster pan
    const dy = (e.clientY - dragStart.y) * 1.5 // Added multiplier for faster pan

    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Mouse wheel zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()

    // Calculate zoom increment based on delta - significantly reduced sensitivity
    const zoomIncrement = 0.02 * Math.sign(e.deltaY) * -1 // Reduced from 0.05 to 0.02
    
    // Apply the zoom, making sure to stay within limits
    setScale(prevScale => {
      const newScale = prevScale + zoomIncrement
      return Math.min(Math.max(newScale, 0.15), 3.0) // Updated zoom limits
    })
  }, [])

  useEffect(() => {
    if (diagram) {
      // Initialize and render the mermaid diagram

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
          noopStyleFill: '#3f3a50', // Noop - darker gray for better contrast with text

          // Text colors to ensure readability
          textColor: '#ffffff', // Default bright text for all nodes
          nodeTextColor: '#ffffff', // Ensure node text is always white
          edgeTextColor: '#cbd5e1', // Slightly muted text for edge labels

          // General styling
          nodeBorder: '#2d2b3a',
          clusterBkg: '#1e1b2e',
          clusterBorder: '#2d2b3a',
          titleColor: '#e2e8f0',

          // Font weight and size for better readability
          fontSize: '16px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      })

      try {
        // Create a pre element with the diagram code for debugging
        const debugContainer = document.getElementById('mermaid-debug')
        if (debugContainer) {
          debugContainer.textContent = diagram
        }

        // Use mermaid.render instead of init for more reliable rendering
        const container = document.getElementById('mermaid-diagram')
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
    <div className="w-full h-full bg-[#15131E] p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-white/70 flex items-center gap-2">
          <Code size={18} className="text-indigo-400" />
          Flow Diagram: <span className="text-indigo-400 font-semibold">{flow.name}</span>
        </h2>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0 flex items-center justify-center text-gray-400 hover:text-white bg-[#1D1A2A] hover:bg-[#2D2A3A] rounded-md"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </Button>

          <div className="text-zinc-400 text-xs min-w-12 text-center">
            {Math.round(scale * 100)}%
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0 flex items-center justify-center text-gray-400 hover:text-white bg-[#1D1A2A] hover:bg-[#2D2A3A] rounded-md"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToScreen}
            className="h-8 w-8 p-0 flex items-center justify-center text-gray-400 hover:text-white bg-[#1D1A2A] hover:bg-[#2D2A3A] rounded-md"
            title="Fit to screen"
          >
            <Maximize size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="h-8 w-8 p-0 flex items-center justify-center text-gray-400 hover:text-white bg-[#1D1A2A] hover:bg-[#2D2A3A] rounded-md"
            title="Reset view"
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      {/* Zoomable diagram container */}
      <div
        className="flex-1 bg-[#1D1A2A] border border-zinc-800 rounded-lg shadow-lg overflow-hidden relative"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <div id="mermaid-diagram" className="min-h-[400px] flex items-center justify-center"></div>
        </div>
      </div>

      {/* Debug section */}
      <div className="mt-6 w-full">
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
  )
}