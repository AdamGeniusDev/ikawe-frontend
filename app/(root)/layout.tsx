import { SidebarProvider} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { LayoutContent } from "./layoutContent" 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
    suppressHydrationWarning 
    >
      <AppSidebar/>
      <LayoutContent> 
        {children}
      </LayoutContent>
    </SidebarProvider>
  )
}