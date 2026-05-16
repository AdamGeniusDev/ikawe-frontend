'use client'

import { CheckCircle2, SkipForward, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionLabel } from '@/types/annotation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassificationTaskProps {
  labels: SessionLabel[]
  selectedIds: string[]
  allowMultiple: boolean
  allowSkip: boolean
  onToggle: (labelId: string) => void
  onValidate: () => void
  onSkip: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Aucun listener clavier ici.
// Navigation (←/→), validation (Enter), skip (Espace) et labels 1–9
// sont tous gérés par useKeyboardShortcuts dans AnnotationShell.

export default function ClassificationTask({
  labels,
  selectedIds,
  allowMultiple,
  allowSkip,
  onToggle,
  onValidate,
  onSkip,
}: ClassificationTaskProps) {
  const canValidate = selectedIds.length > 0

  return (
    <div className="flex flex-col min-h-0 gap-3 p-4">

      {/* ── Header ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
          {allowMultiple ? 'Sélectionnez un ou plusieurs labels' : 'Sélectionnez un label'}
        </p>

        <div className="flex flex-col gap-1.5">
          {labels.map((label, i) => {
            const selected = selectedIds.includes(label.id)
            return (
              <LabelButton
                key={label.id}
                label={label}
                selected={selected}
                shortcut={i < 9 ? String(i + 1) : undefined}
                onClick={() => {
                  onToggle(label.id)
                }}
              />
            )
          })}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-auto flex flex-col gap-2">

        {/* Validate — mode multi uniquement */}
        {allowMultiple && (
          <button
            type="button"
            onClick={onValidate}
            disabled={!canValidate}
            className={cn(
              'flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              canValidate
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            )}
          >
            <ArrowRight size={15} />
            Valider
            <kbd className="ml-1 text-[10px] font-mono opacity-60 border border-current rounded px-1">↵</kbd>
          </button>
        )}

        {/* Skip */}
        {allowSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <SkipForward size={14} />
            Passer
            <kbd className="ml-1 text-[10px] font-mono opacity-60 border border-current rounded px-1">␣</kbd>
          </button>
        )}

        {!allowMultiple && (
          <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            Cliquez ou appuyez sur 1–{Math.min(labels.length, 9)} pour valider
          </p>
        )}
      </div>
    </div>
  )
}

// ─── LabelButton ──────────────────────────────────────────────────────────────

function LabelButton({
  label,
  selected,
  shortcut,
  onClick,
}: {
  label: SessionLabel
  selected: boolean
  shortcut?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 w-full',
        selected
          ? 'shadow-sm scale-[1.01]'
          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
      )}
      style={selected ? {
        backgroundColor: label.color + '15',
        borderColor: label.color + '70',
        boxShadow: `0 2px 8px ${label.color}20`,
      } : {}}
    >
      <div
        className={cn('w-3 h-3 rounded-full shrink-0 transition-transform', selected && 'scale-110')}
        style={{ backgroundColor: label.color }}
      />
      <span
        className={cn(
          'flex-1 text-sm font-medium transition-colors',
          selected ? 'font-semibold' : 'text-zinc-700 dark:text-zinc-300'
        )}
        style={selected ? { color: label.color } : {}}
      >
        {label.name}
      </span>
      {shortcut && (
        <kbd className={cn(
          'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono transition-colors',
          selected
            ? 'border-current opacity-50'
            : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'
        )}>
          {shortcut}
        </kbd>
      )}
      {selected && (
        <CheckCircle2 size={15} className="shrink-0" style={{ color: label.color }} />
      )}
    </button>
  )
}