import { useListFlows } from '@/hooks/use-list-flows'
import { Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
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

export const AppSidebar = () => {
  const { flows } = useListFlows()

  const isActive = (_flowId: string) => {
    return false // TODO: Implement this
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
                      to={`/flow/${flow.id}`}
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
