import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className='flex-1 min-w-0 p-4'> 
        <SidebarTrigger className='hover:bg-secondary hover:text-white size-8 my-2' />
        {children}
        <Toaster />
      </main>
    </SidebarProvider>
  )
}