'use client'

import { useState, useCallback, useEffect } from 'react'
import { SkipForward, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionLabel } from '@/types/annotation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpanAnnotation {
  id: string
  start: number
  end: number
  text: string
  labelId: string
}

export interface SequenceTaskProps {
  labels: SessionLabel[]
  spans: SpanAnnotation[]
  pendingSelection?: { text: string; start: number; end: number } | null
  allowSkip: boolean
  onLabelSelect: (labelId: string) => void
  onRemoveSpan: (spanId: string) => void
  onValidate: () => void
  onSkip: () => void
  onClearPending: () => void
}

export default function SequenceTask({
  labels,
  spans,
  pendingSelection,
  allowSkip,
  onLabelSelect,
  onRemoveSpan,
  onValidate,
  onSkip,
  onClearPending,
}: SequenceTaskProps) {
  const [activeLabelId, setActiveLabelId] = useState<string>(labels[0]?.id ?? '')

  const activeLabel = labels.find((l) => l.id === activeLabelId)

  // Écoute l'event dispatché par useKeyboardShortcuts pour changer le label actif
  useEffect(() => {
    const handler = (e: Event) => {
      const { labelId } = (e as CustomEvent<{ labelId: string }>).detail
      if (labels.some((l) => l.id === labelId)) {
        setActiveLabelId(labelId)
      }
    }
    window.addEventListener('ikawe:setActiveLabel', handler)
    return () => window.removeEventListener('ikawe:setActiveLabel', handler)
  }, [labels])

  // Quand l'utilisateur clique un label :
  // - si sélection en attente → annoter
  // - sinon → changer le label actif pour la prochaine sélection
  const handleLabelClick = useCallback((labelId: string) => {
    if (pendingSelection) {
      onLabelSelect(labelId)
    } else {
      setActiveLabelId(labelId)
    }
  }, [pendingSelection, onLabelSelect])

  const canValidate = spans.length > 0

  return (
    <div className="flex flex-col min-h-0 gap-3 p-4">

      {/* ── Pending selection banner ── */}
      {pendingSelection && (
        <div
          className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border text-sm animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            borderColor: (activeLabel?.color ?? '#EF9F27') + '60',
            background:  (activeLabel?.color ?? '#EF9F27') + '12',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: activeLabel?.color ?? '#EF9F27' }}
            />
            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
              "{pendingSelection.text}"
            </span>
          </div>
          <button
            type="button"
            onClick={onClearPending}
            aria-label="Annuler la sélection"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Labels ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
          {pendingSelection ? 'Choisissez le type' : 'Label actif'}
        </p>
        <div className="flex flex-col gap-1.5">
          {labels.map((label, i) => {
            const isActive  = label.id === activeLabelId && !pendingSelection
            const isPending = pendingSelection != null && label.id === activeLabelId
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => handleLabelClick(label.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-all duration-150 w-full',
                  isActive
                    ? 'shadow-sm'
                    : pendingSelection
                    ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                )}
                style={isActive || isPending ? {
                  backgroundColor: label.color + '15',
                  borderColor:     label.color + '70',
                } : {}}
              >
                <div
                  className={cn('w-3 h-3 rounded-full shrink-0', (isActive || isPending) && 'ring-2 ring-offset-1')}
                  style={{
                    backgroundColor: label.color,
                    outlineColor: label.color,
                  }}
                />
                <span
                  className={cn(
                    'flex-1 text-sm font-medium',
                    (isActive || isPending) ? 'font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                  )}
                  style={(isActive || isPending) ? { color: label.color } : {}}
                >
                  {label.name}
                </span>
                <kbd className="text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-400 rounded px-1.5 py-0.5">
                  {i + 1}
                </kbd>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Spans list ── */}
      {spans.length > 0 && (() => {
        
        const groups: {
          text:    string
          labelId: string
          count:   number
          ids:     string[]
        }[] = []

        for (const span of spans) {
          const existing = groups.find(
            (g) => g.text === span.text && g.labelId === span.labelId
          )
          if (existing) {
            existing.count++
            existing.ids.push(span.id)
          } else {
            groups.push({ text: span.text, labelId: span.labelId, count: 1, ids: [span.id] })
          }
        }

        return (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
              Annotations posées · {groups.length} mot{groups.length > 1 ? 's' : ''}
              <span className="font-normal ml-1">({spans.length} occurrence{spans.length > 1 ? 's' : ''})</span>
            </p>
            <div className="flex flex-col gap-1 max-h-30 overflow-y-auto pr-1">
              {groups.map((group) => {
                const label = labels.find((l) => l.id === group.labelId)
                return (
                  <div
                    key={`${group.text}-${group.labelId}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px]"
                    style={{ background: (label?.color ?? '#888') + '12' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: label?.color ?? '#888' }}
                    />
                    <span className="flex-1 font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {group.text}
                    </span>

                    {/* Badge ×N si plusieurs occurrences */}
                    {group.count > 1 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: (label?.color ?? '#888') + '20',
                          color:           label?.color ?? '#888',
                        }}
                      >
                        ×{group.count}
                      </span>
                    )}

                    <span
                      className="text-[10px] font-semibold shrink-0"
                      style={{ color: label?.color ?? '#888' }}
                    >
                      {label?.name}
                    </span>

                    {/* Supprime TOUTES les occurrences du groupe */}
                    <button
                      type="button"
                      onClick={() => group.ids.forEach((id) => onRemoveSpan(id))}
                      aria-label={`Supprimer toutes les annotations "${group.text}"`}
                      className="text-zinc-300 hover:text-red-400 dark:hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Actions ── */}
      <div className="mt-auto flex gap-2">
        {allowSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <SkipForward size={14} />
            Passer
          </button>
        )}
        <button
          type="button"
          onClick={onValidate}
          disabled={!canValidate}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            canValidate
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
          )}
        >
          <ArrowRight size={15} />
          Valider
          <kbd className="ml-1 text-[10px] font-mono opacity-60 border border-current rounded px-1">↵</kbd>
        </button>
      </div>

      <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 -mt-1">
        Sélectionnez du texte dans le viewer puis choisissez un label
      </p>
    </div>
  )
}