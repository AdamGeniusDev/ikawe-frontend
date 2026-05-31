'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LucideIcon } from 'lucide-react'

interface MenuItem {
  title: string
  icon:  LucideIcon
  url:   string
}

interface SearchDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  items:        MenuItem[]
}

// Lecture directe côté client — pas de state, pas d'effet, pas de cascade
function getShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl K'
  return navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl K'
}

export function SearchDialog({ open, onOpenChange, items }: SearchDialogProps) {
  const [query, setQuery] = useState('')

  // Raccourci clavier global ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac      = navigator.platform.toUpperCase().includes('MAC')
      const isShortcut = isMac
        ? e.metaKey && e.key === 'k'
        : e.ctrlKey && e.key === 'k'

      if (!isShortcut) return

      const tag = document.activeElement?.tagName ?? ''
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      e.preventDefault()
      onOpenChange(true)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenChange])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setQuery('')
  }, [onOpenChange])

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rechercher</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 border rounded-md px-3 py-2">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder="Rechercher une page, un dataset…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(item => (
              <li key={item.url}>
                <Link
                  href={item.url}
                  onClick={handleClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <item.icon size={16} className="text-muted-foreground shrink-0" />
                  {item.title}
                </Link>
              </li>
            ))
          ) : query ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </p>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

// Exporté pour AppSidebar — afficher ⌘K ou Ctrl K dans le bouton
export { getShortcutLabel }