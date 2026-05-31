'use client'

import { CheckCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AppNotification } from '@/types/notification'
import { formatDate } from '@/lib/utils'

interface NotificationsDialogProps {
  open:        boolean
  onClose:     () => void
  notifs:      AppNotification[]
  unreadCount: number
  markAllRead: () => void
}

export function NotificationsDialog({
  open,
  onClose,
  notifs,
  unreadCount,
  markAllRead,
}: NotificationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pt-2 shrink-0">
          <DialogTitle>Notifications</DialogTitle>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck size={14} />
              Tout marquer comme lu
            </button>
          )}
        </DialogHeader>

        <ul className="divide-y overflow-y-auto flex-1 -mx-6 px-6">
          {notifs.length === 0 && (
            <li className="py-10 text-center text-sm text-muted-foreground">
              Aucune notification
            </li>
          )}
          {notifs.map((n) => (
            <li
              key={n.id}
              className={`py-3 flex items-start gap-3 ${
                !n.read ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                  !n.read ? 'bg-primary' : 'bg-transparent'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {n.message}
                </p>
                <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                  {formatDate(n.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}