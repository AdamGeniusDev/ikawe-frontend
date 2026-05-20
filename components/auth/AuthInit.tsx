'use client'
import { useEffect }    from 'react'
import { api }          from '@/lib/api/client'
import { useUserStore } from '@/store/user.store'

export function AuthInit() {
  const setSession = useUserStore(s => s.setSession)
  const logout     = useUserStore(s => s.logout)

  useEffect(() => {
       api.get('/auth/session') //definir le nom de l'endpoint qui permet de verifier la session (nom temporaire pour l'instant)
      .then(({ data }) => setSession(data))
      .catch(() => logout())
  }, [])


  return null
}