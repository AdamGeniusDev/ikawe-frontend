'use client'

import { useRef, useEffect, useState } from 'react'
import { SkipForward, ArrowRight, Type, AlertCircle, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaptioningTaskProps {
  value:        string
  allowSkip:    boolean
  minLength?:   number   // longueur min de la légende (défaut : 10)
  maxLength?:   number   // longueur max recommandée (défaut : 280)
  language?:    string   // ex : "Français", "Fon", "Wolof"
  onChange:     (text: string) => void
  onValidate:   () => void
  onSkip:       () => void
}

// ─── Hints ────────────────────────────────────────────────────────────────────

const HINTS = [
  { key: '⌘↵', label: 'Soumettre la légende'    },
  { key: '␣',  label: 'Passer (si autorisé)'    },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CaptioningTask({
  value,
  allowSkip,
  minLength = 10,
  maxLength = 280,
  language,
  onChange,
  onValidate,
  onSkip,
}: CaptioningTaskProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [touched, setTouched] = useState(false)

  const trimmed     = value.trim()
  const charCount   = trimmed.length
  const tooShort    = charCount > 0 && charCount < minLength
  const overMax     = charCount > maxLength
  const canValidate = charCount >= minLength && !overMax

  // Pourcentage de la barre de progression
  const progress = Math.min((charCount / maxLength) * 100, 100)
  const barColor =
    overMax   ? 'bg-red-500' :
    charCount >= minLength ? 'bg-sky-500' :
    'bg-zinc-300 dark:bg-zinc-600'

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canValidate) onValidate()
    }
  }

  return (
    <div className="flex flex-col min-h-0 gap-3 p-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <Type size={11} />
          Légende (Captioning)
        </p>
        {language && (
          <span className="flex items-center gap-1 text-[11px] text-sky-500 dark:text-sky-400 font-medium">
            <Sparkles size={11} />
            {language}
          </span>
        )}
      </div>

      {/* ── Instruction ── */}
      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Décrivez le contenu de l'image en une ou deux phrases claires et précises.
      </p>

      {/* ── Textarea ── */}
      <div className="flex flex-col gap-1.5 flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setTouched(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Ex : Un marché animé à Cotonou avec des étals colorés de légumes frais..."
          className={cn(
            'flex-1 resize-none min-h-28 text-sm leading-relaxed font-sans',
            'focus-visible:ring-sky-400',
            tooShort && touched && 'border-red-300 dark:border-red-700 focus-visible:ring-red-400',
            overMax && 'border-orange-300 dark:border-orange-700 focus-visible:ring-orange-400'
          )}
          spellCheck
        />

        {/* Barre de longueur */}
        <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Compteur + erreur */}
        <div className="flex items-center justify-between px-0.5">
          {tooShort && touched ? (
            <span className="flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle size={11} />
              Trop court (min. {minLength} caractères)
            </span>
          ) : overMax ? (
            <span className="flex items-center gap-1 text-[11px] text-orange-500">
              <AlertCircle size={11} />
              Trop long (max. {maxLength} caractères)
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">&nbsp;</span>
          )}
          <span className={cn(
            'text-[11px] font-mono tabular-nums',
            overMax ? 'text-orange-500' : charCount >= minLength ? 'text-sky-500' : 'text-zinc-400'
          )}>
            {charCount} / {maxLength}
          </span>
        </div>
      </div>

      {/* ── Keyboard hints ── */}
      <div className="flex flex-col gap-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg">
        {HINTS.map((h) => (
          <div key={h.key} className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>{h.label}</span>
            <kbd className="font-mono border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[10px]">
              {h.key}
            </kbd>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2">
        {allowSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
              ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
          )}
        >
          <ArrowRight size={15} />
          Soumettre
        </button>
      </div>

    </div>
  )
}