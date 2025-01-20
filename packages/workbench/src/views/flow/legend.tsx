export const Legend = ({ onHover }: { onHover: (type: string | null) => void }) => {
  const legendItems = [
    {
      label: 'Event (Core)',
      type: 'event',
      bgColor: 'bg-green-950/40',
      description: 'Core logic components that process events',
    },
    {
      label: 'API',
      type: 'api',
      bgColor: 'bg-blue-950/40',
      description: 'HTTP endpoints that trigger flows',
    },
    {
      label: 'Noop (Non-Operation)',
      type: 'noop',
      bgColor: 'bg-zinc-950/40',
      description: 'Placeholder nodes for external processes',
    },
  ]

  const renderSwatch = (bgColor: string) => (
    <div className="relative group">
      {/* Border gradient container */}
      <div className="absolute -inset-[1px] rounded bg-gradient-to-r from-white/20 to-white/10" />

      {/* Main swatch */}
      <div className={`relative ${bgColor} w-8 h-8 rounded border border-white/10`} />

      {/* Stacked effect */}
      <div className="absolute inset-0 -z-10 translate-y-0.5 translate-x-0.5 bg-black/20 rounded border border-white/5" />
    </div>
  )

  return (
    <div className="absolute right-4 top-4 font-mono rounded-lg border border-white/20 p-4 z-10 shadow-xl">
      <div className="text-sm text-white mb-3 font-semibold">Flow Legend</div>
      <div className="flex flex-col gap-3">
        {legendItems.map((item) => (
          <div
            key={item.type}
            onMouseEnter={() => onHover(item.type)}
            onMouseLeave={() => onHover(null)}
            className="group cursor-pointer transition-all hover:bg-white/5 rounded p-1 -mx-1"
          >
            <div className="flex items-start gap-3">
              {renderSwatch(item.bgColor)}
              <div className="flex-1">
                <div className="text-white text-xs font-medium">{item.label}</div>
                <div className="text-white/60 text-xs mt-0.5">{item.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
