'use client'

// app/(root)/annotate/job/[jobId]/page.tsx

import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight,
  Layers, Zap, Users, BarChart3, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MOCK_JOBS,
  getBatchesForJob, canAccessBatch,
} from '@/constants/mock-data'
import { MOCK_USERS } from '@/types/user'
import { AnnotationJob, BATCH_STATUS_META, resolveBatchUserRole, type AnnotationBatch } from '@/types/annotation'
import { resolveBatchCTA } from '@/lib/batch-cta'
import { CURRENT_USER } from '@/constants/mock-data'



const TASK_LABEL: Record<string, string> = {
  classification: 'Classification',
  bounding_box:   'Bounding Box',
  transcription:  'Transcription',
  sequence:       'NER / Séquence',
}

function pct(batch: AnnotationBatch): number {
  const p = batch.progress
  if (!p || p.total === 0) return 0
  return Math.round(((p.annotated + p.skipped) / p.total) * 100)
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({ batch, canAnnotate, job }: {
  batch:       AnnotationBatch
  canAnnotate: boolean
  job:         AnnotationJob
}) {
  const progress = pct(batch)
  const config   = BATCH_STATUS_META[batch.status]
  const isDone   = batch.status === 'completed'
  const p        = batch.progress
  const role     = resolveBatchUserRole(batch, CURRENT_USER.id, job.createdBy)
  const cta      = resolveBatchCTA(job.id,batch.id, batch.status, role)
  const router   = useRouter()

  const assigneeNames = batch.assignedTo
    ? [MOCK_USERS.find(u => u.id === batch.assignedTo)?.name ?? batch.assignedTo]
    : []

  return (
    <div className={cn(
      'flex flex-col gap-4 rounded-2xl border bg-background p-5 transition-all duration-150',
      canAnnotate && !isDone ? 'hover:border-primary/30 hover:shadow-sm' : ''
    )}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold',
            canAnnotate && !isDone ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {batch.batchIndex}
          </div>
          <div>
            <p className="text-sm font-semibold">
              Groupe {batch.batchIndex}
              <span className="text-muted-foreground font-normal ml-1">/ {batch.batchTotal}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {p ? `${p.annotated + p.skipped} / ${p.total} éléments traités` : '—'}
            </p>
          </div>
        </div>
        <span className={cn(
          'flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          config.className
        )}>
          {config.icon && <config.icon className="h-3 w-3" />}
          {config.label}
        </span>
      </div>

      {/* Barre progression */}
      <div className="flex flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted-foreground">Avancement</span>
          <span className="text-[10px] font-semibold">{progress}%</span>
        </div>
      </div>

      {/* Assignés */}
      {assigneeNames.length > 0 && (
        <div className="flex items-start gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {assigneeNames.join(', ')}
          </p>
        </div>
      )}

      {/* Action */}
      <div className="mt-auto pt-2 border-t border-border/50">
        {cta.href ? (
          <button
            type="button"
            onClick={() => router.push(cta.href!)}
            title={cta.tooltip}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              cta.variant === 'primary'   && 'bg-primary text-primary-foreground hover:bg-primary/90',
              cta.variant === 'secondary' && 'border border-border hover:bg-muted text-foreground',
              cta.variant === 'warning'   && 'bg-orange-500 text-white hover:bg-orange-600',
            )}
          >
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title={cta.tooltip}>
            <Lock className="h-3 w-3 shrink-0" />
            {cta.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()

  const jobId = typeof params?.jobId === 'string' ? params.jobId : null

  if (!jobId) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Chargement…
      </div>
    )
  }

  const job = MOCK_JOBS.find(j => j.id === jobId)

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-muted-foreground">Projet introuvable.</p>
        <button type="button" onClick={() => router.push('/annotate')}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>
    )
  }

  const batches  = getBatchesForJob(jobId)
  const totalEl  = batches.reduce((a, b) => a + (b.progress?.total     ?? 0), 0)
  const doneEl   = batches.reduce((a, b) => a + (b.progress?.annotated ?? 0) + (b.progress?.skipped ?? 0), 0)
  const progress = totalEl > 0 ? Math.round((doneEl / totalEl) * 100) : 0

  const JOB_STATUS: Record<string, { label: string; className: string }> = {
    pending:     { label: 'En attente', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    completed:   { label: 'Terminé',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    cancelled:   { label: 'Annulé',     className: 'bg-red-100 text-red-600' },
  }
  const statusMeta = JOB_STATUS[job.status] ?? JOB_STATUS.pending
  const isOwner    = job.createdBy === CURRENT_USER.id

  const myAnnotableBatches = batches.filter(b =>
    canAccessBatch(b, CURRENT_USER.id)
  ).length

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center gap-3 py-3 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <button type="button" onClick={() => router.push('/annotate')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Mes projets
        </button>
        <span className="text-muted-foreground/40">›</span>
        <span className="text-sm font-semibold text-secondary truncate">{job.datasetName}</span>
        <span className={cn(
          'ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
          statusMeta.className
        )}>
          {statusMeta.label}
        </span>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 w-full">

        {/* Titre */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{job.datasetName}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {TASK_LABEL[job.taskType] ?? job.taskType}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span>{batches.length} groupe{batches.length > 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{totalEl} éléments</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{job.distributionMode === 'sequential' ? "Dans l'ordre" : 'Au hasard'}</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Progression */}
          <div className="rounded-2xl border bg-background px-5 py-4 flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Avancement global
              </span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500',
                  job.status === 'completed' ? 'bg-emerald-500' : 'bg-primary')}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {doneEl} / {totalEl} éléments traités
            </span>
          </div>

          {/* Ma part */}
          <div className="rounded-2xl border bg-background px-5 py-4 flex flex-col justify-center gap-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
              Mes groupes
            </p>
            <p className="text-2xl font-bold text-primary">{myAnnotableBatches}</p>
            <p className="text-[11px] text-muted-foreground">
              groupe{myAnnotableBatches > 1 ? 's' : ''} à traiter
            </p>
          </div>
        </div>

        {/* Labels */}
        {job.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.labels.map(l => (
              <span key={l.id}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: l.color }}>
                {l.name}
              </span>
            ))}
          </div>
        )}

        {/* Note owner */}
        {isOwner && myAnnotableBatches < batches.length && (
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5 w-fit">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Vous pouvez travailler uniquement sur les groupes qui vous sont assignés.
            </p>
          </div>
        )}

        {/* Grid groupes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Groupes · {batches.length}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {batches.map(batch => (
              <GroupCard
                key={batch.id}
                batch={batch}
                canAnnotate={canAccessBatch(batch, CURRENT_USER.id)}
                job={job}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}