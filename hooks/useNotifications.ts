import { useState } from 'react'
import type { AppNotification } from '@/types/notification'
import { MOCK_NOTIFICATIONS } from '@/constants/mock-data'

// Hook notifications — s'appuie sur le type canonique AppNotification
// (types/notification.ts) et la fixture unique MOCK_NOTIFICATIONS.
// Plus de modèle « Notification » parallèle défini ici.
export function useNotifications() {
  const [notifs, setNotifs] = useState<AppNotification[]>(MOCK_NOTIFICATIONS)

  const markAllRead = () =>
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  const unreadCount = notifs.filter(n => !n.read).length

  return { notifs, markAllRead, unreadCount }
}
