'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowLeft, RotateCcw, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnnotationStore, selectSessionProgress } from '@/store/annotation.store'
// Ajout de useShallow pour corriger la boucle infinie
import { useShallow } from 'zustand/react/shallow' 
import type { TaskType } from '@/types/datasets'
import { useEffect } from 'react'

// ─── Accent color by task ─────────────────────────────────────────────────────

const ACCENT: Record<TaskType, string> = {
  classification: 'text-amber-500',
  bounding_box:   'text-orange-500',
  transcription:  'text-violet-500',
  sequence:       'text-rose-500',
  captioning:     'text-sky-500',  
}

const ACCENT_BG: Record<TaskType, string> = {
  classification: 'bg-amber-50 dark:bg-amber-900/20',
  bounding_box:   'bg-orange-50 dark:bg-orange-900/20',
  transcription:  'bg-violet-50 dark:bg-violet-900/20',
  sequence:       'bg-rose-50 dark:bg-rose-900/20',
  captioning:     'bg-sky-50 dark:bg-sky-900/20',       
}

const ACCENT_BORDER: Record<TaskType, string> = {
  classification: 'border-amber-200 dark:border-amber-700',
  bounding_box:   'border-orange-200 dark:border-orange-700',
  transcription:  'border-violet-200 dark:border-violet-700',
  sequence:       'border-rose-200 dark:border-rose-700',
  captioning:     'border-sky-200 dark:border-sky-700',   
}

const ACCENT_BTN: Record<TaskType, string> = {
  classification: 'bg-amber-500 hover:bg-amber-600',
  bounding_box:   'bg-orange-500 hover:bg-orange-600',
  transcription:  'bg-violet-500 hover:bg-violet-600',
  sequence:       'bg-rose-500 hover:bg-rose-600',
  captioning:     'bg-sky-500 hover:bg-sky-600',          
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompletionScreen() {
  const router    = useRouter()
  const session   = useAnnotationStore((s) => s.session)
  
  /**
   * CORRECTION : 
   * On utilise useShallow ici car selectSessionProgress renvoie un objet.
   * Sans cela, le composant boucle à l'infini sur le snapshot.
   */
  const progress  = useAnnotationStore(useShallow(selectSessionProgress))
  
  const clearSession = useAnnotationStore((s) => s.clearSession)
  const loadSession  = useAnnotationStore((s) => s.loadSession)



useEffect(() => {
  const timer = setTimeout(() => {
    clearSession()
    router.push('/annotate')
  }, 5000)
  return () => clearTimeout(timer)
}, [])

  if (!session) return null

  const { taskType } = session
  const accuracy = progress.total > 0
    ? Math.round((progress.annotated / progress.total) * 100)
    : 0

  const handleBack = () => {
    clearSession()
    router.push('/annotate')
  }

  const handleRestart = () => {
    loadSession(session)
  }

 


  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10 gap-8 bg-zinc-50 dark:bg-zinc-950">

      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-20 h-20 rounded-full border-2',
        ACCENT_BG[taskType],
        ACCENT_BORDER[taskType],
      )}>
        <CheckCircle2 size={36} className={ACCENT[taskType]} />
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">
          Session terminée !
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {session.datasetName}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        <StatCard
          value={progress.annotated}
          label="Annotés"
          accent={ACCENT[taskType]}
          bg={ACCENT_BG[taskType]}
          border={ACCENT_BORDER[taskType]}
        />
        <StatCard
          value={progress.skipped}
          label="Passés"
          accent="text-zinc-400"
          bg="bg-zinc-50 dark:bg-zinc-900"
          border="border-zinc-200 dark:border-zinc-800"
        />
        <StatCard
          value={`${accuracy}%`}
          label="Couverture"
          accent="text-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          border="border-emerald-200 dark:border-emerald-700"
        />
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors shadow-sm',
            ACCENT_BTN[taskType]
          )}
        >
          <BarChart3 size={16} />
          Retour au tableau de bord
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRestart}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw size={14} />
            Recommencer
          </button>

          <button
            type="button"
            onClick={() => { clearSession(); router.push('/annotate') }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Mes sessions
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  accent,
  bg,
  border,
}: {
  value: number | string
  label: string
  accent: string
  bg: string
  border: string
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-xl border py-3 px-2 gap-0.5',
      bg, border
    )}>
      <span className={cn('text-xl font-bold', accent)}>{value}</span>
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-tight">
        {label}
      </span>
    </div>
  )
}