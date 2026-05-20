"use client"

// components/datasets/upload/preview/AudioPreview.tsx
// Affiche les 3 premiers fichiers audio d'un ZIP avec lecteur inline.
// État play/pause/progress isolé ici — pas dans la page parente.

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Music } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AudioFilePreview {
  id:       string
  name:     string
  duration: string   // ex: "2min 14s"
  sizeMb:   string   // ex: "4.2 MB"
  url?:     string   // URL réelle en prod — absent en mock
}

interface AudioPlayerProps {
  file:      AudioFilePreview
  isActive:  boolean
  onActivate: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// ─── Lecteur audio pour un fichier ───────────────────────────────────────────

function AudioPlayer({ file, isActive, onActivate }: AudioPlayerProps) {
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Pause quand un autre lecteur devient actif
  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
  }, [isActive, isPlaying])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    onActivate()
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {
        // URL fictive en mock — on simule la progression
        setIsPlaying(true)
        simulateProgress()
      })
      setIsPlaying(true)
    }
  }

  // Simulation de progression pour les mocks sans vraie URL
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const simulateProgress = () => {
    const fakeDuration = 134 // 2min 14s
    if (duration === 0) setDuration(fakeDuration)
    simulationRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= fakeDuration) {
          clearInterval(simulationRef.current!)
          setIsPlaying(false)
          return 0
        }
        return prev + 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => { if (simulationRef.current) clearInterval(simulationRef.current) }
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "AUDIO"

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newTime = ratio * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all",
      isActive && isPlaying
        ? "border-primary/40 bg-primary/5"
        : "border-border bg-background hover:border-border/80"
    )}>

      {/* Icône format */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold",
        isActive && isPlaying ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {ext}
      </div>

      {/* Infos + barre */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {file.duration} · {file.sizeMb}
        </p>

        {/* Barre de progression — visible seulement si actif */}
        {isActive && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="flex-1 h-1 rounded-full bg-muted overflow-hidden cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground w-8 shrink-0 text-right">
              {duration > 0 ? formatTime(currentTime) : file.duration}
            </span>
          </div>
        )}
      </div>

      {/* Bouton play/pause */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold shrink-0 transition-colors",
          isActive && isPlaying
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        )}
      >
        {isActive && isPlaying
          ? <><Pause className="h-3 w-3" /> Pause</>
          : <><Play  className="h-3 w-3" /> Écouter</>
        }
      </button>

      {/* Audio element réel — silencieux si pas d'URL */}
      {file.url && (
        <audio
          ref={audioRef}
          src={file.url}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
        />
      )}
    </div>
  )
}

// ─── AudioPreview ─────────────────────────────────────────────────────────────

interface AudioPreviewProps {
  files:        AudioFilePreview[]
  totalCount:   number
  detectedExts: string[]   // ex: ["mp3", "wav"]
  totalDuration?: string   // ex: "42h 18min" — calculé côté serveur sur les vrais fichiers
}

export function AudioPreview({ files, totalCount, detectedExts, totalDuration }: AudioPreviewProps) {
  // Un seul lecteur actif à la fois
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">

      {/* En-tête */}
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Aperçu des {Math.min(files.length, 3)} premiers fichiers
        </p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {totalCount} fichier{totalCount > 1 ? "s" : ""} au total
          {detectedExts.length > 0 && (
            <> · {detectedExts.map(e => `.${e}`).join(" · ")}</>
          )}
          {totalDuration && <> · {totalDuration}</>}
        </span>
      </div>

      {/* Lecteurs */}
      <div className="flex flex-col gap-2">
        {files.map(file => (
          <AudioPlayer
            key={file.id}
            file={file}
            isActive={activeId === file.id}
            onActivate={() => setActiveId(file.id)}
          />
        ))}
      </div>

      {totalCount > 3 && (
        <p className="text-[11px] text-muted-foreground text-center">
          + {totalCount - 3} autre{totalCount - 3 > 1 ? "s" : ""} fichier{totalCount - 3 > 1 ? "s" : ""} non affichés
        </p>
      )}
    </div>
  )
}