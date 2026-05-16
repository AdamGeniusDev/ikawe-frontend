'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { SkipForward, ArrowRight, Trash2, MousePointer, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionLabel } from '@/types/annotation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoundingBox {
  id: string
  x: number
  y: number
  w: number
  h: number
  labelId: string
}

export type BBoxTool = 'draw' | 'select' | 'zoom'

export interface BoundingBoxTaskProps {
  imageSrc: string
  filename: string
  index: number
  total: number
  labels: SessionLabel[]
  boxes: BoundingBox[]
  allowSkip: boolean
  onAddBox: (box: Omit<BoundingBox, 'id'>) => void
  onRemoveBox: (id: string) => void
  onValidate: () => void
  onSkip: () => void
  onPrev: () => void
  onNext: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Listeners clavier conservés UNIQUEMENT pour Delete/Backspace (suppression de
// la box sélectionnée — état local à ce composant).
// La validation (Enter), navigation (←/→), skip (Espace) et labels 1–9 sont
// gérés par useKeyboardShortcuts dans AnnotationShell via 'ikawe:setActiveLabel'.

export default function BoundingBoxTask({
  imageSrc,
  filename,
  index,
  total,
  labels,
  boxes,
  allowSkip,
  onAddBox,
  onRemoveBox,
  onValidate,
  onSkip,
  onPrev,
  onNext,
}: BoundingBoxTaskProps) {
  const canvasRef                           = useRef<HTMLDivElement>(null)
  const [tool, setTool]                     = useState<BBoxTool>('draw')
  const [activeLabelId, setActiveLabelId]   = useState<string>(labels[0]?.id ?? '')
  const [selectedBoxId, setSelectedBoxId]   = useState<string | null>(null)
  const [drawing, setDrawing]               = useState<{
    startX: number; startY: number; x: number; y: number; w: number; h: number
  } | null>(null)

  const activeLabel = labels.find((l) => l.id === activeLabelId)
  const canValidate = boxes.length > 0

  // Synchroniser le label actif depuis useKeyboardShortcuts (touches 1–9)
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

  // Delete/Backspace — suppression de la box sélectionnée (état local)
  // On conserve ce listener car selectedBoxId est local à ce composant.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBoxId) {
        e.preventDefault()
        onRemoveBox(selectedBoxId)
        setSelectedBoxId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedBoxId, onRemoveBox])

  // ── Mouse draw handlers ──
  const getRelPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { rx: 0, ry: 0 }
    return {
      rx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      ry: Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height)),
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') return
    e.preventDefault()
    const { rx, ry } = getRelPos(e)
    setDrawing({ startX: rx, startY: ry, x: rx, y: ry, w: 0, h: 0 })
  }, [tool])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawing || tool !== 'draw') return
    const { rx, ry } = getRelPos(e)
    const x = Math.min(drawing.startX, rx)
    const y = Math.min(drawing.startY, ry)
    const w = Math.abs(rx - drawing.startX)
    const h = Math.abs(ry - drawing.startY)
    setDrawing((d) => d ? { ...d, x, y, w, h } : null)
  }, [drawing, tool])

  const handleMouseUp = useCallback(() => {
    if (!drawing || tool !== 'draw') return
    if (drawing.w > 0.02 && drawing.h > 0.02) {
      onAddBox({ x: drawing.x, y: drawing.y, w: drawing.w, h: drawing.h, labelId: activeLabelId })
    }
    setDrawing(null)
  }, [drawing, tool, activeLabelId, onAddBox])

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          {([
            { id: 'draw',   icon: <Square size={13} />,       label: 'Dessiner' },
            { id: 'select', icon: <MousePointer size={13} />, label: 'Sélectionner' },
          ] as { id: BBoxTool; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              onClick={() => setTool(id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                tool === id
                  ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Label selector */}
        <div className="flex items-center gap-1.5 ml-3 flex-1 flex-wrap">
          {labels.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveLabelId(l.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                activeLabelId === l.id
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
              )}
              style={activeLabelId === l.id ? { backgroundColor: l.color, borderColor: l.color } : {}}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeLabelId === l.id ? 'rgba(255,255,255,0.6)' : l.color }}
              />
              {l.name}
              <span className="font-mono opacity-60">{i + 1}</span>
            </button>
          ))}
        </div>

        {/* Delete selected */}
        {selectedBoxId && (
          <button
            type="button"
            onClick={() => { onRemoveBox(selectedBoxId); setSelectedBoxId(null) }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
          >
            <Trash2 size={12} />
            Supprimer
            <kbd className="font-mono opacity-60 text-[10px]">⌫</kbd>
          </button>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        className={cn(
          'relative flex-1 overflow-hidden select-none',
          tool === 'draw' ? 'cursor-crosshair' : 'cursor-default',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={filename}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Existing boxes */}
        {boxes.map((box) => {
          const label = labels.find((l) => l.id === box.labelId)
          const isSelected = box.id === selectedBoxId
          return (
            <div
              key={box.id}
              onClick={(e) => { e.stopPropagation(); if (tool === 'select') setSelectedBoxId(box.id) }}
              className="absolute"
              style={{
                left:   `${box.x * 100}%`,
                top:    `${box.y * 100}%`,
                width:  `${box.w * 100}%`,
                height: `${box.h * 100}%`,
                border: `2px solid ${label?.color ?? '#EF9F27'}`,
                background: (label?.color ?? '#EF9F27') + '18',
                boxShadow: isSelected ? `0 0 0 2px ${label?.color ?? '#EF9F27'}60` : 'none',
                cursor: tool === 'select' ? 'pointer' : 'crosshair',
              }}
            >
              <div
                className="absolute -top-5 left-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm text-white whitespace-nowrap"
                style={{ backgroundColor: label?.color ?? '#EF9F27' }}
              >
                {label?.name}
              </div>
            </div>
          )
        })}

        {/* Drawing preview */}
        {drawing && drawing.w > 0.005 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left:    `${drawing.x * 100}%`,
              top:     `${drawing.y * 100}%`,
              width:   `${drawing.w * 100}%`,
              height:  `${drawing.h * 100}%`,
              border:  `2px dashed ${activeLabel?.color ?? '#EF9F27'}`,
              background: (activeLabel?.color ?? '#EF9F27') + '15',
            }}
          />
        )}

        <div className="absolute top-2 right-2 text-[11px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-md">
          {boxes.length} zone{boxes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-35">{filename}</span>

        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <button onClick={onPrev} disabled={index <= 1} className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800">‹</button>
          <span className="px-1">{index} / {total}</span>
          <button onClick={onNext} disabled={index >= total} className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800">›</button>
        </div>

        <div className="flex items-center gap-2">
          {allowSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <SkipForward size={12} />
              Passer
            </button>
          )}
          <button
            type="button"
            onClick={onValidate}
            disabled={!canValidate}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              canValidate
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            )}
          >
            <ArrowRight size={13} />
            Valider
            <kbd className="ml-1 text-[10px] font-mono opacity-60 border border-current rounded px-1">↵</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}