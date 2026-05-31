import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarSections: Record<string, boolean>
  toggleSection:   (key: string) => void
  setSection:      (key: string, open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarSections: { datasets: true },
      toggleSection: (key) =>
        set((s) => ({
          sidebarSections: {
            ...s.sidebarSections,
            [key]: !s.sidebarSections[key],
          },
        })),
      setSection: (key, open) =>
        set((s) => ({
          sidebarSections: { ...s.sidebarSections, [key]: open },
        })),
    }),
    { name: 'ikawe-ui' }
  )
)