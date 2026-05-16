'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useSettingsStore } from '@/store/settings.store'
import type { TaskType } from '@/types/datasets'
import {SessionLabel} from '@/types/annotation'

interface ShortcutsPanelProps {
  open: boolean
  taskType: TaskType
  labels: SessionLabel[]
  allowSkip?: boolean
  allowMultiple?: boolean
  onClose: () => void
}

/**
 * Convertit une valeur e.key en label visuel lisible.
 * Doit couvrir toutes les valeurs possibles stockées dans settings.store.
 *
 * Guard sur undefined/null : peut arriver si le localStorage persisté
 * contient une ancienne version du store sans toutes les clés.
 */
export function displayKey(k: string | undefined | null): string {
  if (!k) return '—'
  switch (k) {
    case ' ':           return 'Espace'
    case 'Enter':       return '↵'
    case 'Escape':      return 'Échap'
    case 'Delete':      return 'Suppr'
    case 'Backspace':   return '⌫'
    case 'Tab':         return 'Tab'
    case 'ArrowLeft':   return '←'
    case 'ArrowRight':  return '→'
    case 'ArrowUp':     return '↑'
    case 'ArrowDown':   return '↓'
    // Compatibilité avec d'anciennes valeurs stockées (migration)
    case 'Entrée':      return '↵'
    case 'Espace':      return 'Espace'
    default:            return k.length === 1 ? k.toUpperCase() : k
  }
}

function Row({ keys, label, color }: { keys: string[]; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k) => (
          <kbd key={k} className="inline-flex items-center justify-center min-w-6.5 h-6 px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 shadow-sm">
            {displayKey(k)}
          </kbd>
        ))}
      </div>
      <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
        {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        {label}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export default function ShortcutsPanel({ open, taskType, labels, allowSkip, allowMultiple, onClose }: ShortcutsPanelProps) {
  const settings = useSettingsStore((s) => s.annotation.shortcuts)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Raccourcis clavier</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          <Section title="Navigation">
            <Row keys={[settings.prev]} label="Élément précédent" />
            <Row keys={[settings.next]} label="Élément suivant" />
            {allowSkip && <Row keys={[settings.skip]} label="Passer cet élément" />}
          </Section>

          {(taskType === 'classification' || taskType === 'sequence' || taskType === 'bounding_box') && labels.length > 0 && (
            <Section title="Labels">
              {labels.slice(0, 9).map((label, i) => (
                <Row key={label.id} keys={[String(i + 1)]} label={label.name} color={label.color} />
              ))}
            </Section>
          )}

          {taskType === 'classification' && (
            <Section title="Validation">
              {allowMultiple
                ? <Row keys={[settings.validate]} label="Valider la sélection" />
                : <Row keys={['1–9']} label="Sélectionner et valider directement" />
              }
            </Section>
          )}

          {taskType === 'bounding_box' && (
            <Section title="Zones">
              <Row keys={['Delete', 'Backspace']} label="Supprimer la zone sélectionnée" />
              <Row keys={[settings.validate]} label="Valider les zones" />
            </Section>
          )}

          {taskType === 'transcription' && (
            <Section title="Transcription">
              <Row keys={['Tab']} label="Insérer une hésitation [...]" />
              <Row keys={['Ctrl', settings.validate]} label="Soumettre la transcription" />
              <Row keys={['Alt + r']}       label="Insérer un rire" />
              <Row keys={['Alt + b']}       label="Insérer un bruit " />
              <Row keys={['Alt + s']}       label="Insérer un silence " />
              <Row keys={['Alt + i']}       label="Inaudible " />
            </Section>
          )}

          <Section title="Interface">
            <Row keys={[settings.openHelp]} label="Ouvrir ce panneau" />
            <Row keys={['Escape']} label="Fermer ce panneau" />
          </Section>

          <Section title="Raccourcis contextuels (fixes)">
          <Row keys={['+', '−']} label="Zoom (image) · Vitesse (audio) · Police (texte)" />
          <Row keys={['r']}       label="Reset zoom (image) · Rire (transcription)" />
        </Section>
        </div>
      </div>
    </div>
  )
}
