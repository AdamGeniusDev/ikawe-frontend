'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ALargeSmall } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { selectCurrentAnnotation, useAnnotationStore } from '@/store/annotation.store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextViewerProps {
  content: string
  filename: string
  index: number
  total: number
  readonly?: boolean
  onPrev?: () => void
  onNext?: () => void
  onTextSelect?: (selection: { text: string; start: number; end: number }) => void
  highlights?: Array<{
    start: number
    end: number
    label: string
    color: string
    textColor: string
  }>
}

const FONT_SIZES = [13, 15, 17] as const

// ─── Highlighted text renderer ────────────────────────────────────────────────

function HighlightedText({
  content,
  highlights,
  fontSize,
}: {
  content: string
  highlights: NonNullable<TextViewerProps['highlights']>
  fontSize: number
}) {
  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const hl of sorted) {
    // Texte brut avant ce highlight
    if (hl.start > cursor) {
      parts.push(<span key={cursor}>{content.slice(cursor, hl.start)}</span>)
    }

    parts.push(
      <mark
        key={`hl-${hl.start}-${hl.end}`}
        title={hl.label}
        style={{
          backgroundColor: hl.color + '28',
          color:           hl.textColor,
          borderBottom:    `2px solid ${hl.color}`,
          borderRadius:    '3px 3px 0 0',
          padding:         '0 2px',
          cursor:          'default',
        }}
      >
        {content.slice(hl.start, hl.end)}
        {/*
          aria-hidden : le <sup> est purement visuel.
          Sans ça, la sélection native du navigateur peut capturer "Lieu" etc.
          et l'inclure dans sel.toString(), ce qui casse le texte sélectionné.
        */}
        <sup
          aria-hidden="true"
          style={{ fontSize: 9, marginLeft: 2, opacity: 0.7 }}
        >
          {hl.label}
        </sup>
      </mark>
    )

    cursor = hl.end
  }

  // Texte restant après le dernier highlight
  if (cursor < content.length) {
    parts.push(<span key="tail">{content.slice(cursor)}</span>)
  }

  return (
    <p style={{ fontSize, lineHeight: 1.75, color: 'inherit' }}>
      {parts}
    </p>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TextViewer({
  content,
  filename,
  index,
  total,
  readonly=false,
  onPrev,
  onNext,
  onTextSelect,
  highlights = [],
}: TextViewerProps) {
  const [fontIdx, setFontIdx] = useState(0)
  const fontSize = FONT_SIZES[fontIdx]
  const containerRef = useRef<HTMLDivElement>(null)
  const currentAnnotation = useAnnotationStore(selectCurrentAnnotation)

  useEffect(() => {
  const handler = (e: Event) => {
    const { dir } = (e as CustomEvent).detail
    setFontIdx(i => dir === 'up' ? Math.min(i + 1, FONT_SIZES.length - 1) : Math.max(i - 1, 0))
  }
  window.addEventListener('ikawe:fontSize', handler)
  return () => window.removeEventListener('ikawe:fontSize', handler)
}, [])

  const handleMouseUp = () => {
    if (!onTextSelect || !containerRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return

    // sel.toString() peut inclure le texte des <sup> si la sélection
    // les traverse. On utilise range.toString() sur le range exact à la place,
    // mais le plus sûr est de filtrer après coup (voir ci-dessous).
    const text = sel.toString()
    if (!text.trim()) return

    const range = sel.getRangeAt(0)

    // ── Calcul de l'offset de début ──────────────────────────────────────────
    //
    // preRange mesure le texte entre le début du container et le début de
    // la sélection. PROBLÈME : preRange.toString() inclut le texte des <sup>
    // ("Lieu", "Personne"...) qui sont dans le DOM mais pas dans content.
    // Chaque label annoté décalerait l'offset de len(label) caractères.
    //
    // SOLUTION : masquer tous les <sup> avec display:none le temps du calcul.
    // L'opération est synchrone — aucun repaint ne se produit entre les deux
    // lignes, l'utilisateur ne voit rien clignoter.

    const sups = containerRef.current.querySelectorAll('sup')
    sups.forEach((sup) => { sup.style.display = 'none' })

    const preRange = document.createRange()
    preRange.selectNodeContents(containerRef.current)
    preRange.setEnd(range.startContainer, range.startOffset)
    const start = preRange.toString().length

    // Réafficher immédiatement
    sups.forEach((sup) => { sup.style.display = '' })

    const end = start + text.length

    if (end - start > 100) {
      sel.removeAllRanges()
      toast.error('Sélection trop longue (max 100 caractères)')
      return
    }

    // Sanity check : les offsets doivent rester dans les bornes de content
    if (start < 0 || end > content.length) {
      sel.removeAllRanges()
      return
    }

    onTextSelect({ text, start, end })
    sel.removeAllRanges()
  }

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Zone de texte ── */}
      <div
        ref={containerRef}
        className={cn("flex-1 overflow-y-auto px-5 py-4 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200", !readonly && "select-text")}
        onMouseUp={readonly ? undefined : handleMouseUp}
      >
        {highlights.length > 0 ? (
          <HighlightedText
            content={content}
            highlights={highlights}
            fontSize={fontSize}
          />
        ) : (
          <p style={{ fontSize, lineHeight: 1.75 }}>{content}</p>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-40">
          {filename}
        </span>

        <button
          type="button"
          aria-label="Changer la taille de la police"
          onClick={() => setFontIdx((i) => (i + 1) % FONT_SIZES.length)}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ALargeSmall size={14} />
          {fontSize}px
        </button>

        <div className="flex items-center gap-1">
          <NavBtn
            onClick={() => {
              onPrev?.()
            }}
            disabled={index <= 1}
            label="Précédent"
          >
            <ChevronLeft size={14} />
          </NavBtn>

          <span className="text-[10px] text-zinc-400 px-1">{index} / {total}</span>

          <NavBtn
            onClick={() => {
              if (!readonly && currentAnnotation?.status === 'pending') {
                toast.warning('Élément non annoté', {
                  description: `Annotez cet élément ou passez-le`,
                  duration: 1500,
                  id: 'pending-nav-warning',
                })
                return
              }
              onNext?.()
            }}
            disabled={index >= total}
            label="Suivant"
          >
            <ChevronRight size={14} />
          </NavBtn>
        </div>
      </div>
    </div>
  )
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, label, children }: {
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-md border transition-colors',
        disabled
          ? 'border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
    >{children}</button>
  )
}