import { useQuery }     from '@tanstack/react-query'
import { useUserStore } from '@/store/user.store'
import type { User }    from '@/types/user'

//hook pour avoir toutes les donnees du user selon la definition dans user.ts
export function useCurrentUser() {
  const session = useUserStore(s => s.session)

  return useQuery({
    queryKey: ['currentUser', session?.id],
    queryFn:  () => fetch('/api/me').then(r => r.json()) as Promise<User>,
    enabled:  !!session,            // pas de fetch si non connecté
    staleTime: 5 * 60 * 1000,      // cache 5 minutes
  })
}