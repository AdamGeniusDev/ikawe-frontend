import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import { api }     from '@/lib/api/client'
import type { SessionUser } from '@/types/user'

interface UserState {
  session:    SessionUser | null
  isLoading:  boolean
  setSession: (user: SessionUser | null) => void
  logout:     () => void
  login:      (email: string, password: string) => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      session:   null,
      isLoading: true,
      setSession: (user) => set({ session: user, isLoading: false }),

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({ session: data.user, isLoading: false })
        // ↑ store mis à jour → tous les composants re-rendent
      },
      logout: () => set({ session: null, isLoading: false }),
     

    }),
    {
      name: 'ikawe-auth',
      partialize: (state) => ({ session: state.session }),
    }
  )
)