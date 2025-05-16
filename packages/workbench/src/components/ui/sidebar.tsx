import React, { PropsWithChildren, useState } from 'react'
import { cn } from '@/lib/utils'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from './button'

export const Sidebar: React.FC<PropsWithChildren> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'max-h-screen overflow-y-auto transition-[width] duration-300 border-r border-zinc-800 border-solid overflow-hidden',
        isCollapsed ? 'w-[50px]' : 'w-[250px]',
      )}
    >
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && <div className="overflow-y-auto w-[250px]">{children}</div>}
    </div>
  )
}

export const SidebarGroup: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-bold text-muted-foreground px-4 py-2 uppercase">{title}</h2>
      {children}
    </div>
  )
}

type SidebarButtonProps = PropsWithChildren<{
  isActive: boolean
  icon: React.ReactNode
}>

export const SidebarButton: React.FC<SidebarButtonProps> = ({ children, isActive, icon }) => {
  return (
    <div className={cn('flex text-sm font-medium items-center gap-2 px-4 py-3 ', isActive && 'bg-muted')}>
      <div className="text-muted-foreground">{icon}</div>
      {children}
    </div>
  )
}
