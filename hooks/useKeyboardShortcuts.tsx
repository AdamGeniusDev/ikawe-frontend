'use client'

import { useEffect } from 'react'
import { selectCurrentAnnotation, useAnnotationStore } from '@/store/annotation.store'
import { useSettingsStore } from '@/store/settings.store'
import { toast } from 'sonner'


export function useKeyboardShortcuts(onOpenHelp?: () => void) {
  const {
    session,
    validateCurrent,
    skipCurrent,
    goNext,
    goPrev,
    toggleLabel,
    applyLabelToSelection,
    pendingSelection,
  } = useAnnotationStore()

  const shortcuts         = useSettingsStore((s) => s.annotation.shortcuts)
  const currentAnnotation = useAnnotationStore(selectCurrentAnnotation)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      // ── Guard : ne pas interférer avec les champs texte ──────────────────
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return

      const key = e.key

      // ── Labels 1–9 ───────────────────────────────────────────────────────
      if (session && session.taskType !== 'transcription') {
        const num = parseInt(key, 10)
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const label = session.labels[num - 1]
          if (label) {
            e.preventDefault()

            if (session.taskType === 'classification') {
              toggleLabel(label.id)
              if (!session.allowMultiple) {
                setTimeout(() => validateCurrent(), 2500)
              }

            } else if (session.taskType === 'sequence') {
              if (pendingSelection) {
                applyLabelToSelection(label.id)
              }
              window.dispatchEvent(
                new CustomEvent('ikawe:setActiveLabel', { detail: { labelId: label.id } })
              )

            } else if (session.taskType === 'bounding_box') {
              window.dispatchEvent(
                new CustomEvent('ikawe:setActiveLabel', { detail: { labelId: label.id } })
              )
            }
            return
          }
        }
      }

      if (session) {

        // + / = : zoom avant · vitesse + · police +
        if (key === '+' || key === '=') {
          e.preventDefault()
          if (session.dataType === 'image') {
            window.dispatchEvent(new CustomEvent('ikawe:zoom', { detail: { dir: 'in' } }))
          } else if (session.dataType === 'audio') {
            window.dispatchEvent(new CustomEvent('ikawe:speed', { detail: { dir: 'up' } }))
          } else if (session.dataType === 'text') {
            window.dispatchEvent(new CustomEvent('ikawe:fontSize', { detail: { dir: 'up' } }))
          }
          return
        }

        // - : zoom arrière · vitesse − · police −
        if (key === '-') {
          e.preventDefault()
          if (session.dataType === 'image') {
            window.dispatchEvent(new CustomEvent('ikawe:zoom', { detail: { dir: 'out' } }))
          } else if (session.dataType === 'audio') {
            window.dispatchEvent(new CustomEvent('ikawe:speed', { detail: { dir: 'down' } }))
          } else if (session.dataType === 'text') {
            window.dispatchEvent(new CustomEvent('ikawe:fontSize', { detail: { dir: 'down' } }))
          }
          return
        }

        // ── Raccourcis image : Alt+R = reset zoom/rotation ────────────────
        if (e.altKey && key === 'r' && session.dataType === 'image') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('ikawe:imageReset'))
          return
        }

        // ── Marqueurs transcription : Alt+lettre ──────────────────────────
        // Alt+R → [rire]      Alt+B → [bruit]
        // Alt+S → [silence]   Alt+I → [inaudible]
        // Le guard sur taskType évite tout conflit avec d'autres modes.
        if (e.altKey && session.taskType === 'transcription') {
          switch (key.toLowerCase()) {
            case 'r':
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('ikawe:insertMarker', { detail: { marker: '[rire]' } }))
              return
            case 'b':
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('ikawe:insertMarker', { detail: { marker: '[bruit]' } }))
              return
            case 's':
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('ikawe:insertMarker', { detail: { marker: '[silence]' } }))
              return
            case 'i':
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('ikawe:insertMarker', { detail: { marker: '[inaudible]' } }))
              return
          }
        }
      }

      // ── Raccourcis configurables (settings.store) ─────────────────────────

      if (key === shortcuts.validate) {
        e.preventDefault()
        validateCurrent()
        return
      }

      if (key === shortcuts.skip) {
        e.preventDefault()
        skipCurrent()
        return
      }

      // ── Navigation suivant ────────────────────────────────────────────────
      if (key === shortcuts.next) {
        e.preventDefault()
        if (currentAnnotation?.status === 'pending') {
          toast.warning('Élément non annoté', {
            description: `Annotez cet élément ou passez-le`,
            duration: 1500,
            id: 'pending-nav-warning',
          })
          return
        }
        goNext()
        return
      }

      // ── Navigation précédent ──────────────────────────────────────────────
      if (key === shortcuts.prev) {
        e.preventDefault()
        goPrev()
        return
      }

      if (key === shortcuts.openHelp) {
        e.preventDefault()
        onOpenHelp?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    session,
    shortcuts,
    currentAnnotation,
    pendingSelection,
    validateCurrent,
    skipCurrent,
    goNext,
    goPrev,
    toggleLabel,
    applyLabelToSelection,
    onOpenHelp,
  ])
}