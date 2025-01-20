import { useListFlows } from '@/hooks/use-list-flows'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'
import { Workflow } from 'lucide-react'
import { Link, useMatchRoute } from '@tanstack/react-router'

export const AppSidebar = () => {
  const { flows } = useListFlows()
  const matchRoute = useMatchRoute()

  const isActive = (flowId: string) => {
    return !!matchRoute({ to: '/flow/$id', params: { id: flowId } })
  }

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Flows</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {flows.map((flow) => (
                <SidebarMenuItem key={flow.id}>
                  <SidebarMenuButton asChild className="cursor-pointer" isActive={isActive(flow.id)}>
                    <Link
                      to="/flow/$id"
                      params={{ id: flow.id }}
                      className="flex items-center gap-2"
                      data-testid={`flow-link-${flow.id}`}
                    >
                      <Workflow />
                      <span>{flow.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
