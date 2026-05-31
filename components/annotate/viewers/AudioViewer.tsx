'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudioViewerProps {
  src: string
  filename: string
  index: number
  total: number
  readonly?: boolean
  onPrev?: () => void
  onNext?: () => void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AudioViewer({
  src,
  filename,
  index,
  total,
  onPrev,
  onNext,
}: AudioViewerProps) {
  const audioRef    = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [playing,     setPlaying]     = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [speedIdx,    setSpeedIdx]    = useState(2)   // index dans SPEEDS, défaut = 1×
  const [playCount,   setPlayCount]   = useState(0)

  const speed = SPEEDS[speedIdx]

  // ── Événements de l'élément audio ────────────────────────────────────────────
  // Un seul useEffect gère tous les listeners audio.
  // Les setState ici sont dans des callbacks d'événements (pas dans le corps
  // de l'effet) → pas d'avertissement React.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime  = () => setCurrentTime(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration)
    const onEnded = () => { setPlaying(false); setPlayCount((c) => c + 1) }

    audio.addEventListener('timeupdate',      onTime)
    audio.addEventListener('loadedmetadata',  onMeta)
    audio.addEventListener('ended',           onEnded)

    return () => {
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended',          onEnded)
    }
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }, [src])


 
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])


  useEffect(() => {
    const handler = (e: Event) => {
      const { dir } = (e as CustomEvent<{ dir: 'up' | 'down' }>).detail
      setSpeedIdx((i) =>
        dir === 'up'
          ? Math.min(i + 1, SPEEDS.length - 1)
          : Math.max(i - 1, 0)
      )
    }
    window.addEventListener('ikawe:speed', handler)
    return () => window.removeEventListener('ikawe:speed', handler)
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else         { audio.play();  setPlaying(true)  }
  }, [playing])

  const restart = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }, [])

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length)

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar   = progressRef.current
    if (!audio || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 bg-zinc-50 dark:bg-zinc-900">

        {/* Compteur d'écoutes */}
        {playCount > 0 && (
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Écouté {playCount} fois
          </div>
        )}

        {/* Forme d'onde décorative */}
        <div className="flex items-center gap-0.5 h-12 w-full max-w-xs">
          {Array.from({ length: 48 }, (_, i) => {
            const h      = 20 + Math.abs(Math.sin(i * 0.7) * 60 + Math.cos(i * 1.3) * 20)
            const played = (i / 48) * 100 < pct
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-sm transition-colors',
                  played
                    ? 'bg-violet-500 dark:bg-violet-400'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                )}
                style={{ height: `${Math.min(Math.max(h, 8), 100)}%` }}
              />
            )
          })}
        </div>

        {/* Barre de progression cliquable */}
        <div
          ref={progressRef}
          className="w-full max-w-xs h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Temps + contrôles */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              type="button"
              aria-label="Réécouter depuis le début"
              onClick={restart}
              className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Lire'}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center text-white transition-colors shadow-sm"
            >
              {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button
              type="button"
              aria-label={`Vitesse actuelle : ×${speed}`}
              onClick={cycleSpeed}
              className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[11px] font-mono text-violet-500 dark:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ×{speed}
            </button>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Élément audio caché */}
        <audio ref={audioRef} src={src} preload="metadata" />
      </div>

      {/* ── Barre de méta ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-40">
          {filename}
        </span>
        <div className="flex items-center gap-1">
          <NavBtn onClick={onPrev ?? (()=>{})} disabled={index <= 1}     label="Précédent"><ChevronLeft  size={14} /></NavBtn>
          <span className="text-[10px] text-zinc-400 px-1">{index} / {total}</span>
          <NavBtn onClick={onNext ?? (()=>{})} disabled={index >= total} label="Suivant"><ChevronRight size={14} /></NavBtn>
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