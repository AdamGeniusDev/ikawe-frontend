'use client'

import { useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageViewerProps {
  src: string
  filename: string
  index: number        // élément courant (1-based)
  total: number
  onPrev: () => void
  onNext: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageViewer({
  src,
  filename,
  index,
  total,
  onPrev,
  onNext,
}: ImageViewerProps) {
  const [zoom, setZoom]       = useState(1)
  const [rotation, setRotation] = useState(0)

  const zoomIn  = () => setZoom((z) => Math.min(z + 0.25, 3))
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const rotate  = () => setRotation((r) => (r + 90) % 360)
  const reset   = () => { setZoom(1); setRotation(0) }

  
useEffect(() => {
  const handler = (e: Event) => {
    const ce = e as CustomEvent
    if (e.type === 'ikawe:zoom') {
      ce.detail.dir === 'in' ? setZoom(z => Math.min(z + 0.25, 3)) : setZoom(z => Math.max(z - 0.25, 0.5))
    }
    if (e.type === 'ikawe:imageReset') {
      setZoom(1); setRotation(0)
    }
  }
  window.addEventListener('ikawe:zoom', handler)
  window.addEventListener('ikawe:imageReset', handler)
  return () => {
    window.removeEventListener('ikawe:zoom', handler)
    window.removeEventListener('ikawe:imageReset', handler)
  }
}, [])

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Image area ── */}
      <div className="relative flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={filename}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute bottom-3 left-3 text-[11px] font-mono bg-black/50 text-white px-2 py-0.5 rounded-md">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* ── Toolbar + nav ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">

        {/* Filename + index */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono text-zinc-400 truncate max-w-35">
            {filename}
          </span>
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">
            {index} / {total}
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1">
          <ToolBtn onClick={zoomOut}  disabled={zoom <= 0.5} label="Zoom arrière">
            <ZoomOut size={13} />
          </ToolBtn>
          <ToolBtn onClick={zoomIn}   disabled={zoom >= 3}   label="Zoom avant">
            <ZoomIn size={13} />
          </ToolBtn>
          <ToolBtn onClick={rotate}   label="Rotation">
            <RotateCw size={13} />
          </ToolBtn>
          <ToolBtn onClick={reset}    label="Réinitialiser">
            <Maximize2 size={13} />
          </ToolBtn>
        </div>

        {/* Prev / Next */}
        <div className="flex items-center gap-1">
          <ToolBtn onClick={onPrev} disabled={index <= 1}     label="Précédent">
            <ChevronLeft size={14} />
          </ToolBtn>
          <ToolBtn onClick={onNext} disabled={index >= total} label="Suivant">
            <ChevronRight size={14} />
          </ToolBtn>
        </div>
      </div>
    </div>
  )
}

// ─── ToolBtn ──────────────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
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
          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
      )}
    >
      {children}
    </button>
  )
}