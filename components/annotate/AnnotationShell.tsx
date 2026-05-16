'use client'

import { useState } from 'react'
import { ArrowLeft, Keyboard, User, Sparkles, GitMerge, X, Construction } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  useAnnotationStore,
  selectSessionProgress,
  type AnnotationMode,
} from '@/store/annotation.store'
import { useShallow } from 'zustand/react/shallow'
import ShortcutsPanel from './ShortcutsPanel'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { type TaskType , TASK_TYPE_LABELS } from '@/types/datasets'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AnnotationShellProps {
  children: React.ReactNode
}

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: {
  id:       AnnotationMode
  label:    string
  icon:     React.ReactNode
  disabled: boolean
}[] = [
  { id: 'manual', label: 'Manuel',  icon: <User      size={12} />, disabled: false },
  { id: 'ai',     label: 'IA',      icon: <Sparkles  size={12} />, disabled: true  },
  { id: 'hybrid', label: 'Hybride', icon: <GitMerge  size={12} />, disabled: true  },
]

function taskAccentClass(taskType: TaskType): string {
  switch (taskType) {
    case 'classification': return 'bg-amber-500'
    case 'bounding_box':   return 'bg-orange-500'
    case 'transcription':  return 'bg-violet-500'
    case 'sequence':       return 'bg-rose-500'
    default:               return 'bg-zinc-500'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotationShell({ children }: AnnotationShellProps) {
  const session  = useAnnotationStore((s) => s.session)
  const mode     = useAnnotationStore((s) => s.mode)
  const setMode  = useAnnotationStore((s) => s.setMode)
  const progress = useAnnotationStore(useShallow(selectSessionProgress))

  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [wipModalMode,  setWipModalMode]  = useState<AnnotationMode | null>(null)

  // ── Source unique de raccourcis clavier ───────────────────────────────────
  // Gère : navigation, validation, skip, labels 1–9 pour tous les task types
  useKeyboardShortcuts(() => setShortcutsOpen(true))

  if (!session) return null

  const pct = progress.total > 0
    ? Math.round(((progress.annotated + progress.skipped) / progress.total) * 100)
    : 0

  const handleModeClick = (m: typeof MODES[number]) => {
    if (m.disabled) { setWipModalMode(m.id); return }
    setMode(m.id)
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 z-10">

        <Link
          href="/annotate"
          className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Retour aux sessions"
        >
          <ArrowLeft size={14} />
        </Link>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {session.datasetName}
          </span>
          <TaskBadge taskType={session.taskType} />
        </div>

        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModeClick(m)}
              aria-label={`Mode ${m.label}`}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                mode === m.id && !m.disabled
                  ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                  : m.disabled
                  ? 'text-zinc-400 dark:text-zinc-600 cursor-pointer hover:text-zinc-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              )}
            >
              {m.icon}
              {m.label}
              {m.disabled && (
                <span className="text-[9px] font-semibold uppercase tracking-wide bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 px-1 py-0.5 rounded">
                  bientôt
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {progress.annotated + progress.skipped}
          </span>
          <span>/</span>
          <span>{progress.total}</span>
          {progress.skipped > 0 && (
            <span className="text-zinc-300 dark:text-zinc-600">
              ({progress.skipped} passé{progress.skipped > 1 ? 's' : ''})
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Raccourcis clavier"
          onClick={() => setShortcutsOpen(true)}
          className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Keyboard size={13} />
        </button>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-zinc-100 dark:bg-zinc-800 shrink-0">
        <div
          className={cn('h-full transition-all duration-500', taskAccentClass(session.taskType))}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>

      <ShortcutsPanel
        open={shortcutsOpen}
        taskType={session.taskType}
        labels={session.labels}
        allowSkip={session.allowSkip}
        allowMultiple={session.allowMultiple}
        onClose={() => setShortcutsOpen(false)}
      />

      {wipModalMode && (
        <WipModal
          mode={wipModalMode}
          onClose={() => setWipModalMode(null)}
        />
      )}
    </div>
  )
}

// ─── WipModal ─────────────────────────────────────────────────────────────────

const WIP_CONTENT: Record<AnnotationMode, { title: string; description: string }> = {
  manual:  { title: '', description: '' },
  ai:      {
    title:       'Mode IA — en développement',
    description: 'Le modèle d\'annotation automatique est en cours d\'entraînement. Cette fonctionnalité sera disponible dès qu\'il sera prêt à être déployé.',
  },
  hybrid:  {
    title:       'Mode Hybride — en développement',
    description: 'Le mode hybride permet à l\'IA de pré-annoter les éléments et à l\'annotateur de valider ou corriger les prédictions. Disponible dès que le modèle sera opérationnel.',
  },
}

function WipModal({ mode, onClose }: { mode: AnnotationMode; onClose: () => void }) {
  const { title, description } = WIP_CONTENT[mode]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={14} />
        </button>
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-4">
          <Construction size={20} className="text-amber-500" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{title}</h2>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Compris
        </button>
      </div>
    </div>
  )
}


const TASK_COLORS: Record<TaskType, string> = {
  classification: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  bounding_box:   'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700',
  transcription:  'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-700',
  sequence:       'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700',
  captioning:     'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-700',
}

function TaskBadge({ taskType }: { taskType: TaskType }) {
  return (
    <span className={cn(
      'shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
      TASK_COLORS[taskType]
    )}>
      {TASK_TYPE_LABELS[taskType]}
    </span>
  )
}