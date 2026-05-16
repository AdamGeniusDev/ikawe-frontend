'use client'

import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "sonner"
import { usePathname } from "next/navigation"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar() 
  const pathname  = usePathname()

  const showNav = pathname.startsWith('/settings')

  const sidebarW = open
    ? 'var(--sidebar-width)'
    : 'var(--sidebar-width-icon, 0px)'

  return (
    <main className="flex-1 min-w-0 p-4">
      <SidebarTrigger className="hover:bg-secondary hover:text-white size-8 my-2" />
      {children}
      <Toaster />

      {showNav && (
        <style>{`
          .settings-nav {
            position: fixed;
            bottom: 24px;
            z-index: 50;
            left: calc(${sidebarW} + (100vw - ${sidebarW}) / 2);
            transform: translateX(-50%);
            transition: left 200ms ease;
          }
        `}</style>
      )}
    </main>
  )
}