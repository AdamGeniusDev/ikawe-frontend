"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, ArrowRight, CheckCircle2,
  ImageIcon, Music, FileText, Table2,
  Braces, Zap, PlayCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CURRENT_USER, getUserById } from "@/constants/mock-data"
import { getMyAnnotationSessions, getDelegatedSessions } from "@/constants/mock-data"
import { AnnotationSession } from "@/types/annotation-session"

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function progressPct(s: AnnotationSession) {
  if (s.totalElements === 0) return 0
  return Math.round((s.completedElements / s.totalElements) * 100)
}

function DataTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === "image") return <ImageIcon className={cn("text-blue-500",    className)} />
  if (type === "audio") return <Music     className={cn("text-violet-500",  className)} />
  if (type === "csv")   return <Table2    className={cn("text-emerald-500", className)} />
  if (type === "json")  return <Braces    className={cn("text-amber-500",   className)} />
  return                        <FileText  className={cn("text-amber-500",   className)} />
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending:     { label: "Non commencée", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours",      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed:   { label: "Terminée",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  paused:      { label: "En pause",      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : SESSION CARD
// ─────────────────────────────────────────────

function SessionCard({
  session,
  variant,
  onClick,
}: {
  session: AnnotationSession
  variant: "mine" | "delegated"
  onClick: () => void
}) {
  const pct         = progressPct(session)
  const statusMeta  = STATUS_META[session.status]
  const isCompleted = session.status === "completed"

  const assignedUsers = session.assignedTo
    .map((id) => getUserById(id))
    .filter(Boolean)

  const ctaLabel = variant === "mine"
    ? session.status === "pending" ? "Commencer" : "Continuer"
    : "Voir la progression"

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-background px-4 pt-4 pb-3 transition-all duration-150",
        isCompleted
          ? "opacity-60"
          : "hover:border-primary/30 hover:shadow-sm cursor-pointer"
      )}
      onClick={isCompleted ? undefined : onClick}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <DataTypeIcon type={session.datasetType} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{session.datasetTitle}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{session.taskName}</span>
            </div>
          </div>
        </div>
        <span className={cn(
          "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
          statusMeta.className
        )}>
          {statusMeta.label}
        </span>
      </div>

      {/* ── Barre de progression ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {session.completedElements} / {session.totalElements} éléments
          </span>
          <span className="text-[11px] font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Labels (hauteur fixe pour uniformiser les cards) ── */}
      <div className="flex min-h-[22px] flex-wrap gap-1">
        {session.labels.slice(0, 4).map((l) => (
          <span
            key={l.id}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: l.color }}
          >
            {l.name}
          </span>
        ))}
        {session.labels.length > 4 && (
          <span className="text-[10px] text-muted-foreground self-center">
            +{session.labels.length - 4}
          </span>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        {variant === "delegated" && assignedUsers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {assignedUsers.slice(0, 3).map((u) => (
                <div
                  key={u!.id}
                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-bold text-white"
                  style={{ backgroundColor: u!.avatarColor }}
                >
                  {u!.avatarInitials}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {assignedUsers.length} collaborateur{assignedUsers.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span />
        )}

        {isCompleted ? (
          <span className="flex items-center  text-[10px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Terminée
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 mt-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            {ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : SECTION TITLE
// ─────────────────────────────────────────────

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
        {count}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : ÉTAT VIDE
// ─────────────────────────────────────────────

function EmptyState({ onCreateSession }: { onCreateSession: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <PlayCircle className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">
          Aucune session d'annotation
        </p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Créez votre première session pour commencer à annoter vos datasets.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateSession}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Créer une session
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

export default function AnnotateHub() {
  const router  = useRouter()
  const userId  = CURRENT_USER.id

  const mySessions       = useMemo(() => getMyAnnotationSessions(userId), [userId])
  const delegatedSessions = useMemo(() => getDelegatedSessions(userId),   [userId])

  const myActive    = mySessions.filter((s) => s.status !== "completed")
  const myCompleted = mySessions.filter((s) => s.status === "completed")

  const hasAnything = mySessions.length > 0 || delegatedSessions.length > 0

  const handleSessionClick = (session: AnnotationSession) =>
    router.push(`/annotate/${session.id}`)

  const handleCreate = () => router.push("/annotate/new")

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── Header ── */}
      <div className="flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px]">
            <span className="text-secondary">Annoter</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Vos sessions d'annotation actives et assignées
          </p>
        </div>
        {hasAnything && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle session
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8 px-6 py-6">

        {!hasAnything && <EmptyState onCreateSession={handleCreate} />}

        {myActive.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionTitle label="À annoter" count={myActive.length} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myActive.map((session) => (
                <SessionCard key={session.id} session={session} variant="mine"
                  onClick={() => handleSessionClick(session)} />
              ))}
            </div>
          </div>
        )}

        {delegatedSessions.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <SectionTitle label="Sessions déléguées" count={delegatedSessions.length} />
              <span className="text-[11px] text-muted-foreground">
                — annotées par vos collaborateurs
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {delegatedSessions.map((session) => (
                <SessionCard key={session.id} session={session} variant="delegated"
                  onClick={() => handleSessionClick(session)} />
              ))}
            </div>
          </div>
        )}

        {myCompleted.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionTitle label="Terminées" count={myCompleted.length} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myCompleted.map((session) => (
                <SessionCard key={session.id} session={session} variant="mine"
                  onClick={() => {}} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}