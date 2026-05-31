'use client'

// app/(root)/tasks/[taskId]/page.tsx

import { useParams, useRouter, notFound } from 'next/navigation'
import {
  ArrowLeft, Play, ArrowRight, CheckCircle2,
  ImageIcon, Music, FileText, Table2, Braces,
  AlertCircle, Clock, ChevronRight, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task, STATUS_META, RevisionEvent } from '@/types/tasks'
import { MOCK_TASKS } from '@/constants/mock-data'
import { DATA_TYPE_LABELS } from '@/types/datasets'
import { getAvatarProps } from '@/types/user'
import type { DataType } from '@/types/tasks'
import Image from 'next/image'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(task: Task): number {
  if (task.totalElements === 0) return 0
  return Math.round((task.completedElements / task.totalElements) * 100)
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `Il y a ${mins} min`
  if (hours < 24)  return `Il y a ${hours}h`
  if (days  < 2)   return 'Hier'
  if (days  < 7)   return `Il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DataTypeIcon({ type }: { type: DataType }) {
  if (type === 'image') return <ImageIcon className="h-5 w-5 text-blue-500" />
  if (type === 'audio') return <Music     className="h-5 w-5 text-violet-500" />
  if (type === 'csv')   return <Table2    className="h-5 w-5 text-emerald-500" />
  if (type === 'json')  return <Braces    className="h-5 w-5 text-amber-500" />
  return                        <FileText  className="h-5 w-5 text-amber-500" />
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

function StatBox({ label, children, sub }: {
  label:    string
  children: React.ReactNode
  sub?:     string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border bg-background px-5 py-4">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="text-2xl font-bold tracking-tight">{children}</div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── RevisionRow ──────────────────────────────────────────────────────────────

function RevisionRow({ event, onCorrect }: {
  event:     RevisionEvent
  onCorrect: (ids: string[]) => void
}) {
  const avatar      = getAvatarProps({
    id:        event.actorId,
    name:      event.actorName,
    avatarUrl: event.actorAvatarUrl,
  })
  const isRejection = event.action === 'rejected'
  const isValidated = event.action === 'validated'
  const isStarted   = event.action === 'started'

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">

      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white mt-0.5 overflow-hidden"
        style={{ backgroundColor: avatar.avatarUrl ? 'transparent' : avatar.color }}
      >
        {avatar.avatarUrl
          ? <Image src={avatar.avatarUrl} alt={event.actorName} className="h-8 w-8 rounded-full object-cover" />
          : avatar.initials
        }
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{event.actorName}</span>
            {' '}
            {isStarted   && 'a démarré cette tâche'}
            {isValidated && (
              <span>
                a validé{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {event.count} annotation{(event.count ?? 0) > 1 ? 's' : ''}
                </span>
              </span>
            )}
            {isRejection && (
              <span>
                a rejeté{' '}
                <span className="text-red-500 font-semibold">
                  {event.count} annotation{(event.count ?? 0) > 1 ? 's' : ''}
                </span>
              </span>
            )}
          </p>
          <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
            {formatRelative(event.createdAt)}
          </span>
        </div>

        {/* Message de rejet */}
        {isRejection && event.comment && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10 px-3 py-2">
            <p className="text-[12px] text-red-700 dark:text-red-400 leading-relaxed italic">
              "{event.comment}"
            </p>
          </div>
        )}

        {/* Lien corriger */}
        {isRejection && event.elementIds && event.elementIds.length > 0 && (
          <button
            type="button"
            onClick={() => onCorrect(event.elementIds!)}
            className="mt-2 flex items-center gap-1 text-[12px] text-primary hover:underline font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            Voir et corriger ces éléments
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const router     = useRouter()

  const task = MOCK_TASKS.find(t => t.id === taskId)
  if (!task) return notFound()

  const progress = pct(task)
  const days     = daysUntil(task.deadline)
  const isDone   = task.status === 'completed'
  const isUrgent = days <= 3 && !isDone

  const instructionLines = task.instructions
    ?.split('\n')
    .filter(l => l.trim())
    ?? []

  const revisions = [...(task.revisionHistory ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const taskID = task.id

  function handleCorrect(elementIds: string[]) {
    // En production : router.push(`/annotate/${task.id}?rejected=${elementIds.join(',')}`)
    router.push(`/annotate/${taskID}`)
  }

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center gap-2 py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Mes tâches
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-sm font-medium truncate max-w-xs">{task.title}</span>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 w-full">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted mt-0.5">
              <DataTypeIcon type={task.dataType} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {task.labels.slice(0, 3).map(l => (
                  <span key={l.id}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
                {task.labels.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{task.labels.length - 3} autres
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {task.datasetSource} · {DATA_TYPE_LABELS[task.dataType]} · {task.totalElements.toLocaleString('fr-FR')} élém.
                </span>
              </div>
              {task.assignedByName && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Assignée par <span className="font-medium">{task.assignedByName}</span>
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          {!isDone ? (
            <button
              type="button"
              onClick={() => router.push(`/annotate/${task.id}`)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              {task.status === 'pending'     && <><Play       className="h-4 w-4" /> Commencer l'annotation</>}
              {task.status === 'paused'      && <><Play       className="h-4 w-4" /> Reprendre</>}
              {task.status === 'in_progress' && <><ArrowRight className="h-4 w-4" /> Continuer l'annotation</>}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              Terminée
            </span>
          )}
        </div>

        {/* Barre de progression */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>{task.completedElements.toLocaleString('fr-FR')} / {task.totalElements.toLocaleString('fr-FR')} éléments</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isDone ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            label="Avancement"
            sub={`${task.completedElements.toLocaleString('fr-FR')} / ${task.totalElements.toLocaleString('fr-FR')} éléments`}
          >
            {progress}%
          </StatBox>

          <StatBox
            label="Échéance"
            sub={
              isDone        ? 'Terminée'
              : days > 0    ? `Dans ${days} jour${days > 1 ? 's' : ''}`
              : days === 0  ? "Aujourd'hui"
              : `En retard de ${Math.abs(days)} j`
            }
          >
            <span className="flex items-center gap-1.5 text-xl">
              <Clock className={cn('h-4 w-4 shrink-0', isUrgent ? 'text-red-500' : 'text-muted-foreground')} />
              <span className={cn(isUrgent && 'text-red-500')}>{task.deadline}</span>
            </span>
          </StatBox>

          <StatBox
            label="Taux d'acceptation"
            sub={task.reviewedCount ? `Sur ${task.reviewedCount.toLocaleString('fr-FR')} soumises` : 'Aucune révision encore'}
          >
            {task.acceptanceRate !== undefined ? (
              <span className={cn(
                task.acceptanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400'
                : task.acceptanceRate >= 70 ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-500'
              )}>
                {task.acceptanceRate}%
              </span>
            ) : (
              <span className="text-base text-muted-foreground font-normal">—</span>
            )}
          </StatBox>

          <StatBox
            label="Statut"
            sub={task.assignedByName ? `Assignée par ${task.assignedByName}` : undefined}
          >
            <span className={cn(
              'text-base',
              task.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400'
              : task.status === 'completed'  ? 'text-emerald-600 dark:text-emerald-400'
              : task.status === 'paused'     ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
            )}>
              {STATUS_META[task.status].label}
            </span>
          </StatBox>
        </div>

        {/* Alerte taux d'acceptation faible */}
        {task.acceptanceRate !== undefined && task.acceptanceRate < 70 && !isDone && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Votre taux d'acceptation est de <strong>{task.acceptanceRate}%</strong>.
              Relisez les instructions et corrigez les éléments rejetés avant de continuer.
            </p>
          </div>
        )}

        {/* Instructions + Labels — 2 colonnes */}
        {(instructionLines.length > 0 || task.labels.length > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {instructionLines.length > 0 && (
              <div className="rounded-2xl border bg-background overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Instructions
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2">
                  {instructionLines.map((line, i) => {
                    const isBullet = line.trim().startsWith('•')
                    return (
                      <p key={i} className={cn(
                        'text-sm leading-relaxed',
                        isBullet ? 'pl-3 text-muted-foreground' : 'font-medium text-foreground'
                      )}>
                        {line.trim()}
                      </p>
                    )
                  })}
                </div>
              </div>
            )}

            {task.labels.length > 0 && (
              <div className="rounded-2xl border bg-background overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Labels disponibles
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {task.labels.map(l => (
                    <span key={l.id}
                      className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                      style={{ backgroundColor: l.color }}>
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historique des révisions */}
        {revisions.length > 0 && (
          <div className="rounded-2xl border bg-background overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Historique des révisions
              </p>
            </div>
            <div className="px-5">
              {revisions.map(event => (
                <RevisionRow
                  key={event.id}
                  event={event}
                  onCorrect={handleCorrect}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}