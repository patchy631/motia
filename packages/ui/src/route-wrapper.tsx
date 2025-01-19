import { AppSidebar } from './components/app-sidebar'
import { SidebarProvider } from './components/ui/sidebar'
import { MotiaChat } from './components/motia-chat.tsx' // Add this import

export const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    {children}
    <MotiaChat /> {/* Add the chat component here */}
  </SidebarProvider>
)
