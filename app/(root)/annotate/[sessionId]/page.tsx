"use client"

// ─────────────────────────────────────────────
// app/(root)/annotate/[sessionId]/page.tsx
// Interface d'annotation — Classification MVP
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, SkipForward, CheckCircle2,
   Music, FileText, Table2, Braces,
   Flag, Trophy,
  Keyboard, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_ANNOTATION_SESSIONS } from "@/constants/mock-data"
import { AnnotationSession, SessionLabel } from "@/types/annotation-session"

// ─────────────────────────────────────────────
// TYPES LOCAUX
// ─────────────────────────────────────────────

interface AnnotationRecord {
  elementIndex: number
  labelIds: string[]
  skipped: boolean
  annotatedAt: Date
}

// ─────────────────────────────────────────────
// MOCK : générer les éléments de la session
// En prod : GET /api/sessions/:id/elements
// ─────────────────────────────────────────────

interface SessionElement {
  index: number
  name: string
  previewUrl?: string
  type: string
}

function generateElements(session: AnnotationSession): SessionElement[] {
  const total = Math.min(session.totalElements, 30) // aperçu limité en mock
  return Array.from({ length: total }, (_, i) => {
    const idx = session.completedElements + i + 1
    return {
      index: idx,
      name:
        session.datasetType === "image"
          ? `img_${String(idx).padStart(3, "0")}.jpg`
          : session.datasetType === "audio"
          ? `audio_${String(idx).padStart(3, "0")}.mp3`
          : `doc_${String(idx).padStart(3, "0")}.txt`,
      type: session.datasetType,
      previewUrl:
        session.datasetType === "image"
          ? `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(`Image ${idx}`)}`
          : undefined,
    }
  })
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : PREVIEW DE L'ÉLÉMENT
// ─────────────────────────────────────────────

function ElementPreview({
  element,
  className,
}: {
  element: SessionElement
  className?: string
}) {
  if (element.type === "image" && element.previewUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={element.previewUrl}
          alt={element.name}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  const iconMap: Record<string, React.ReactNode> = {
    audio: <Music    className="h-12 w-12 text-violet-400" />,
    text:  <FileText className="h-12 w-12 text-amber-400"  />,
    csv:   <Table2   className="h-12 w-12 text-emerald-400"/>,
    json:  <Braces   className="h-12 w-12 text-amber-400"  />,
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted",
      className
    )}>
      {iconMap[element.type] ?? <FileText className="h-12 w-12 text-muted-foreground/40" />}
      <p className="text-sm font-medium text-muted-foreground">{element.name}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : BOUTON LABEL
// ─────────────────────────────────────────────

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
        "group relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 w-full",
        selected
          ? "border-transparent shadow-md scale-[1.01]"
          : "border-border bg-background hover:border-border/80 hover:bg-muted/20 hover:scale-[1.005]"
      )}
      style={selected ? {
        backgroundColor: label.color + "18",
        borderColor: label.color + "60",
        boxShadow: `0 4px 12px ${label.color}25`,
      } : {}}
    >
      {/* Swatch */}
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-full transition-all",
          selected ? "scale-110 shadow-sm" : ""
        )}
        style={{ backgroundColor: label.color }}
      />

      {/* Nom */}
      <span className={cn(
        "flex-1 text-sm font-semibold transition-colors",
        selected ? "text-foreground" : "text-foreground/80"
      )}
        style={selected ? { color: label.color } : {}}
      >
        {label.name}
      </span>

      {/* Shortcut hint */}
      {shortcut && (
        <span className={cn(
          "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold font-mono transition-colors",
          selected
            ? "border-current opacity-60"
            : "border-border text-muted-foreground"
        )}>
          {shortcut}
        </span>
      )}

      {/* Check */}
      {selected && (
        <CheckCircle2
          className="h-4 w-4 shrink-0"
          style={{ color: label.color }}
        />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : BARRE DE PROGRESSION
// ─────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  annotated,
  skipped,
}: {
  current: number
  total: number
  annotated: number
  skipped: number
}) {
  const pct = Math.round(((annotated + skipped) / total) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {current} / {total} éléments
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          {annotated > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {annotated} annoté{annotated > 1 ? "s" : ""}
            </span>
          )}
          {skipped > 0 && (
            <span className="flex items-center gap-1">
              <SkipForward className="h-3 w-3" />
              {skipped} passé{skipped > 1 ? "s" : ""}
            </span>
          )}
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : ÉCRAN DE FIN
// ─────────────────────────────────────────────

function CompletionScreen({
  session,
  annotations,
  onBackToHub,
}: {
  session: AnnotationSession
  annotations: AnnotationRecord[]
  onBackToHub: () => void
}) {
  const annotated = annotations.filter((a) => !a.skipped).length
  const skipped   = annotations.filter((a) =>  a.skipped).length

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Session terminée !</h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          Vous avez annoté tous les éléments de la session{" "}
          <strong className="text-foreground">{session.datasetTitle}</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-emerald-600">{annotated}</span>
          <span className="text-xs text-muted-foreground">Annotés</span>
        </div>
        {skipped > 0 && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-muted-foreground">{skipped}</span>
              <span className="text-xs text-muted-foreground">Passés</span>
            </div>
          </>
        )}
        <div className="h-8 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-primary">{annotations.length}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBackToHub}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Retour aux sessions
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export default function AnnotateSessionPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const router = useRouter()
  const { sessionId } = params

  // Récupérer la session depuis le mock
  // En prod : const session = await fetch(`/api/sessions/${sessionId}`)
  const session = useMemo(
    () => MOCK_ANNOTATION_SESSIONS.find((s) => s.id === sessionId) ?? null,
    [sessionId]
  )

  const elements = useMemo(
    () => (session ? generateElements(session) : []),
    [session]
  )

  // ── State d'annotation ──
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [annotations, setAnnotations]   = useState<AnnotationRecord[]>([])
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [completed, setCompleted]       = useState(false)

  const currentElement = elements[currentIdx] ?? null
  const totalToAnnotate = elements.length
  const annotatedCount  = annotations.filter((a) => !a.skipped).length
  const skippedCount    = annotations.filter((a) =>  a.skipped).length

  // ── Valider l'annotation courante ──
  const handleValidate = useCallback(() => {
    if (selectedIds.length === 0) return
    if (!currentElement) return

    setAnnotations((prev) => [
      ...prev,
      {
        elementIndex: currentElement.index,
        labelIds: selectedIds,
        skipped: false,
        annotatedAt: new Date(),
      },
    ])
    setSelectedIds([])

    if (currentIdx + 1 >= totalToAnnotate) {
      setCompleted(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }, [selectedIds, currentElement, currentIdx, totalToAnnotate])

  // ── Passer un élément ──
  const handleSkip = useCallback(() => {
    if (!session?.allowSkip || !currentElement) return

    setAnnotations((prev) => [
      ...prev,
      {
        elementIndex: currentElement.index,
        labelIds: [],
        skipped: true,
        annotatedAt: new Date(),
      },
    ])
    setSelectedIds([])

    if (currentIdx + 1 >= totalToAnnotate) {
      setCompleted(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }, [session, currentElement, currentIdx, totalToAnnotate])

  // ── Toggler un label ──
  const toggleLabel = useCallback((labelId: string) => {
    if (!session) return
    if (session.allowMultiple) {
      setSelectedIds((prev) =>
        prev.includes(labelId)
          ? prev.filter((id) => id !== labelId)
          : [...prev, labelId]
      )
    } else {
      // Mode exclusif : sélection directe + validation auto
      setSelectedIds([labelId])
    }
  }, [session])

  // ── Validation auto en mode single-label ──
  useEffect(() => {
    if (!session?.allowMultiple && selectedIds.length === 1) {
      const timer = setTimeout(() => handleValidate(), 300)
      return () => clearTimeout(timer)
    }
  }, [selectedIds, session?.allowMultiple, handleValidate])

  // ── Raccourcis clavier ──
  useEffect(() => {
    if (!session || completed) return

    const handleKey = (e: KeyboardEvent) => {
      // Ignorer si focus sur un input
      if (e.target instanceof HTMLInputElement) return

      // Touche espace = passer
      if (e.key === " " && session.allowSkip) {
        e.preventDefault()
        handleSkip()
        return
      }
      // Entrée = valider
      if (e.key === "Enter") {
        e.preventDefault()
        handleValidate()
        return
      }
      // Chiffres 1-9 = sélectionner label par position
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= session.labels.length) {
        toggleLabel(session.labels[num - 1].id)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [session, completed, handleSkip, handleValidate, toggleLabel])

  // ── Session introuvable ──
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Flag className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">Session introuvable</p>
        <button
          type="button"
          onClick={() => router.push("/annotate")}
          className="text-sm text-primary hover:underline"
        >
          Retour aux sessions
        </button>
      </div>
    )
  }

  // ── Écran de fin ──
  if (completed) {
    return (
      <div className="flex flex-col w-full min-h-screen">
        <AnnotateHeader session={session} onBack={() => router.push("/annotate")} />
        <div className="flex-1 px-6">
          <CompletionScreen
            session={session}
            annotations={annotations}
            onBackToHub={() => router.push("/annotate")}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── Header ── */}
      <AnnotateHeader
        session={session}
        onBack={() => router.push("/annotate")}
        onToggleShortcuts={() => setShowShortcuts((p) => !p)}
      />

      {/* ── Corps principal ── */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 max-w-2xl mx-auto w-full">

        {/* Barre de progression */}
        <ProgressBar
          current={currentIdx + 1}
          total={totalToAnnotate}
          annotated={annotatedCount}
          skipped={skippedCount}
        />

        {/* Preview de l'élément courant */}
        {currentElement && (
          <ElementPreview
            element={currentElement}
            className="h-64 sm:h-80"
          />
        )}

        {/* Nom de l'élément */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {currentElement?.name}
          </p>
          <span className="text-xs text-muted-foreground">
            Élément {currentIdx + 1} sur {totalToAnnotate}
          </span>
        </div>

        {/* ── Labels ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {session.allowMultiple
              ? "Sélectionnez un ou plusieurs labels"
              : "Sélectionnez un label"}
          </p>

          {session.labels.map((label, i) => (
            <LabelButton
              key={label.id}
              label={label}
              selected={selectedIds.includes(label.id)}
              shortcut={String(i + 1)}
              onClick={() => toggleLabel(label.id)}
            />
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">

          {/* Passer */}
          {session.allowSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
              Passer
              <span className="ml-1 rounded border px-1 text-[10px] font-mono">Espace</span>
            </button>
          )}

          {/* Valider (mode multi-labels seulement) */}
          {session.allowMultiple && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={selectedIds.length === 0}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                selectedIds.length > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Valider
              <ArrowRight className="h-4 w-4" />
              <span className="ml-1 rounded border border-current/30 px-1 text-[10px] font-mono opacity-60">
                ↵
              </span>
            </button>
          )}
        </div>

        {/* Hint mode single */}
        {!session.allowMultiple && (
          <p className="text-center text-[11px] text-muted-foreground -mt-2">
            Cliquez sur un label pour valider automatiquement
          </p>
        )}
      </div>

      {/* ── Panel raccourcis clavier ── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="flex flex-col gap-4 rounded-2xl border bg-background p-6 shadow-xl w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Raccourcis clavier</p>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {session.labels.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-sm">{l.name}</span>
                  </div>
                  <kbd className="rounded border px-2 py-0.5 text-xs font-mono bg-muted">
                    {i + 1}
                  </kbd>
                </div>
              ))}
              <div className="h-px bg-border my-1" />
              {session.allowSkip && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Passer</span>
                  <kbd className="rounded border px-2 py-0.5 text-xs font-mono bg-muted">Espace</kbd>
                </div>
              )}
              {session.allowMultiple && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valider</span>
                  <kbd className="rounded border px-2 py-0.5 text-xs font-mono bg-muted">↵</kbd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : HEADER DE LA PAGE
// ─────────────────────────────────────────────

function AnnotateHeader({
  session,
  onBack,
  onToggleShortcuts,
}: {
  session: AnnotationSession
  onBack: () => void
  onToggleShortcuts?: () => void
}) {
  return (
    <div className="flex w-full items-center justify-between px-4 py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="h-4 w-px bg-border shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{session.datasetTitle}</p>
          <p className="text-[11px] text-muted-foreground">{session.taskName}</p>
        </div>
      </div>

      {onToggleShortcuts && (
        <button
          type="button"
          onClick={onToggleShortcuts}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors shrink-0"
        >
          <Keyboard className="h-3.5 w-3.5" />
          Raccourcis
        </button>
      )}
    </div>
  )
}