'use client'

import { useRef, useEffect, useState } from 'react'
import { SkipForward, ArrowRight, Mic, AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptionTaskProps {
  value: string
  language?: string
  allowSkip: boolean
  minLength?: number
  onChange: (text: string) => void
  onValidate: () => void
  onSkip: () => void
}

// ─── Hints ───────────────────────────────────────────────────────────────────

const HINTS = [
  { key: 'Tab',   label: 'Insérer une hésitation [...]' },
  { key: 'Alt+R', label: 'Insérer [rire]'               },
  { key: 'Alt+B', label: 'Insérer [bruit]'              },
  { key: 'Alt+S', label: 'Insérer [silence]'            },
  { key: 'Alt+I', label: 'Insérer [inaudible]'          },
  { key: '⌘↵',   label: 'Soumettre'                    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function insertAtCursor(
  ta: HTMLTextAreaElement,
  value: string,
  marker: string,
  onChange: (v: string) => void
) {
  const start = ta.selectionStart
  const end   = ta.selectionEnd
  onChange(value.slice(0, start) + marker + value.slice(end))
  requestAnimationFrame(() => {
    ta.selectionStart = ta.selectionEnd = start + marker.length
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionTask({
  value,
  language,
  allowSkip,
  minLength = 3,
  onChange,
  onValidate,
  onSkip,
}: TranscriptionTaskProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [touched, setTouched] = useState(false)

  const trimmed     = value.trim()
  const charCount   = trimmed.length
  const tooShort    = charCount > 0 && charCount < minLength
  const canValidate = charCount >= minLength

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Listener global pour les événements ikawe:insertMarker
  // (déclenché depuis useKeyboardShortcuts quand le textarea n'a PAS le focus)
  useEffect(() => {
    const handler = (e: Event) => {
      const { marker } = (e as CustomEvent).detail
      const ta = textareaRef.current
      if (!ta) return
      insertAtCursor(ta, value, marker, onChange)
    }
    window.addEventListener('ikawe:insertMarker', handler)
    return () => window.removeEventListener('ikawe:insertMarker', handler)
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current
    if (!ta) return

    // ── Ctrl/Cmd + Enter : soumettre ─────────────────────────────────────
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canValidate) onValidate()
      return
    }

    // ── Tab : hésitation [...] ────────────────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault()
      insertAtCursor(ta, value, '[...]', onChange)
      return
    }

    // ── Alt+lettre : marqueurs — même comportement que Tab ────────────────
    // Géré ici (dans le textarea) pour fonctionner avec ou sans focus global.
    // useKeyboardShortcuts dispatch ikawe:insertMarker pour les mêmes touches
    // quand le focus est ailleurs — les deux chemins aboutissent au même résultat.
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          insertAtCursor(ta, value, '[rire]', onChange)
          return
        case 'b':
          e.preventDefault()
          insertAtCursor(ta, value, '[bruit]', onChange)
          return
        case 's':
          e.preventDefault()
          insertAtCursor(ta, value, '[silence]', onChange)
          return
        case 'i':
          e.preventDefault()
          insertAtCursor(ta, value, '[inaudible]', onChange)
          return
      }
    }
  }

  return (
    <div className="flex flex-col min-h-0 gap-3 p-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Transcription
        </p>
        {language && (
          <span className="flex items-center gap-1 text-[11px] text-violet-500 dark:text-violet-400 font-medium">
            <Mic size={11} />
            {language}
          </span>
        )}
      </div>

      {/* ── Textarea ── */}
      <div className="flex flex-col gap-1.5 flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setTouched(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Retranscrivez ce que vous entendez..."
          className={cn(
            'flex-1 resize-none min-h-25 text-sm leading-relaxed font-sans',
            'focus-visible:ring-violet-400',
            tooShort && touched && 'border-red-300 dark:border-red-700 focus-visible:ring-red-400'
          )}
          spellCheck={false}
        />

        {/* Char count + error */}
        <div className="flex items-center justify-between px-0.5">
          {tooShort && touched ? (
            <span className="flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle size={11} />
              Trop court (min. {minLength} caractères)
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">{charCount} caractères</span>
          )}
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
              ? 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm'
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