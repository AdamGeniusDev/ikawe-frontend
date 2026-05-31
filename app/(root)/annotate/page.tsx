'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ArrowRight, CheckCircle2, Layers,
  ImageIcon, Music, FileText, Table2, Braces,
  Zap, PlayCircle, BarChart3,
  Users, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getJobGroupsForUser, MOCK_JOBS, MOCK_BATCHES, getTeamById } from '@/constants/mock-data'
import { MOCK_USERS } from '@/types/user'
import type { DataType, TaskType } from '@/types/datasets'
import { type JobGroup, type AnnotationBatch, type AnnotationJob, BATCH_STATUS_META, resolveBatchUserRole, countJobAssignees } from '@/types/annotation'
import { resolveBatchCTA } from '@/lib/batch-cta'

const CURRENT_USER = MOCK_USERS[0]  

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jobProgressPct(group: JobGroup): number {
  const total     = group.myBatches.reduce((a, b) => a + (b.progress?.total     ?? 0), 0)
  const annotated = group.myBatches.reduce((a, b) => a + (b.progress?.annotated ?? 0) + (b.progress?.skipped ?? 0), 0)
  return total === 0 ? 0 : Math.round((annotated / total) * 100)
}

function jobGlobalPct(job: AnnotationJob): number {
  const batches = MOCK_BATCHES.filter(b => b.jobId === job.id)
  const total   = batches.reduce((a, b) => a + (b.progress?.total ?? 0), 0)
  const done    = batches.reduce((a, b) => a + (b.progress?.annotated ?? 0) + (b.progress?.skipped ?? 0), 0)
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

function jobIsCompleted(group: JobGroup): boolean {
  return group.myBatches.every(b => b.status === 'completed')
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DataTypeIcon({ type, className }: { type: DataType; className?: string }) {
  if (type === 'image') return <ImageIcon className={cn('shrink-0 text-blue-500',    className)} />
  if (type === 'audio') return <Music     className={cn('shrink-0 text-violet-500',  className)} />
  if (type === 'csv')   return <Table2    className={cn('shrink-0 text-emerald-500', className)} />
  if (type === 'json')  return <Braces    className={cn('shrink-0 text-amber-500',   className)} />
  return                        <FileText  className={cn('shrink-0 text-amber-500',   className)} />
}

const TASK_LABEL: Partial<Record<TaskType, string>> = {
  classification: 'Classification',
  bounding_box:   'Bounding Box',
  transcription:  'Transcription',
  sequence:       'NER / Séquence',
}



// ─── BatchMiniRow ─────────────────────────────────────────────────────────────

function BatchMiniRow({ batch }: { batch: AnnotationBatch }) {
  const pct    = batch.progress && batch.progress.total > 0
    ? Math.round(((batch.progress.annotated + batch.progress.skipped) / batch.progress.total) * 100)
    : 0
  const isDone = batch.status === 'completed'
  const meta = BATCH_STATUS_META[batch.status]
  return (
    <div className="flex items-center gap-2 py-1">
      {meta?.icon && <meta.icon className="h-3 w-3" />}
      <span className="text-[10px] text-muted-foreground shrink-0 w-16">
        Groupe {batch.batchIndex}/{batch.batchTotal}
      </span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', isDone ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{pct}%</span>
    </div>
  )
}

// ─── JobCard (vue annotateur) ──────────────────────────────────────────────────

function JobCard({
  group, onGoDirectly, onViewJob,
}: {
  group:        JobGroup
  onGoDirectly: (batchId: string) => void
  onViewJob:    (jobId:   string) => void
}) {
  const { job, myBatches, activeBatch } = group
  const activeCta = activeBatch
    ? resolveBatchCTA(
        activeBatch.id,
        activeBatch.status,
        resolveBatchUserRole(
          activeBatch,
          CURRENT_USER.id,
          job.createdBy,
        ),
      )
    : null
  const pct         = jobProgressPct(group)
  const isCompleted = jobIsCompleted(group)
  const isMulti     = myBatches.length > 1
  const totalEl     = myBatches.reduce((a, b) => a + (b.progress?.total     ?? 0), 0)
  const doneEl      = myBatches.reduce((a, b) => a + (b.progress?.annotated ?? 0) + (b.progress?.skipped ?? 0), 0)
  const router = useRouter()

  function handleCta() {

    if (!activeBatch || !activeCta?.href) return

    if (isMulti) {
      onViewJob(job.id)
    } else {
      router.push(activeCta.href)
    }
  }


  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-2xl border bg-background px-4 pt-4 pb-3 transition-all duration-150',
      isCompleted ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-sm cursor-pointer',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <DataTypeIcon type={job.dataType} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{job.datasetName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {TASK_LABEL[job.taskType] ?? job.taskType}
              </span>
              {isMulti && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{myBatches.length} groupes</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{doneEl} / {totalEl} éléments</span>
          <span className="text-[11px] font-semibold">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-500',
            isCompleted ? 'bg-emerald-500' : 'bg-primary')}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {isMulti && (
        <div className="flex flex-col divide-y divide-border/30">
          {myBatches.map(b => <BatchMiniRow key={b.id} batch={b} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-1 min-h-5">
        {job.labels.slice(0, 4).map(l => (
          <span key={l.id} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: l.color }}>
            {l.name}
          </span>
        ))}
        {job.labels.length > 4 && (
          <span className="text-[10px] text-muted-foreground self-center">+{job.labels.length - 4}</span>
        )}
      </div>

       <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {isMulti ? (
            <button type="button" onClick={() => onViewJob(job.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Voir tous les groupes →
            </button>
          ) : <span />}

          {isCompleted ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Terminé
            </span>
          ) : activeCta?.href ? (
            <button
              type="button"
              onClick={handleCta}
              title={activeCta.tooltip}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                activeCta.variant === 'primary'   && 'bg-primary/10 text-primary hover:bg-primary/20',
                activeCta.variant === 'warning'   && 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
                activeCta.variant === 'secondary' && 'border border-border hover:bg-muted text-foreground',
              )}
            >
              {activeCta.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : activeCta ? (
            <span
              title={activeCta.tooltip}
              className="text-[11px] text-muted-foreground cursor-default"
            >
              {activeCta.label}
            </span>
          ) : null}
        </div>
    </div>
  )
}

// ─── ManagerJobCard (vue owner — jobs qu'il a créés) ──────────────────────────

function ManagerJobCard({
  job, onView,
}: {
  job:    AnnotationJob
  onView: (jobId: string) => void
}) {
  const pct          = jobGlobalPct(job)
  const isCompleted  = job.status === 'completed'
  const assigneeCount = countJobAssignees(job, tid => getTeamById(tid)?.members.length ?? 0)

  const STATUS_COLOR: Record<string, string> = {
    pending:     'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled:   'bg-red-100 text-red-700',
  }
  const STATUS_LABEL: Record<string, string> = {
    pending: 'En attente', in_progress: 'En cours',
    completed: 'Terminé', cancelled: 'Annulé',
  }

  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-2xl border bg-background px-4 pt-4 pb-3 transition-all duration-150',
      isCompleted ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-sm'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <DataTypeIcon type={job.dataType} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{job.datasetName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {TASK_LABEL[job.taskType] ?? job.taskType}
              </span>
            </div>
          </div>
        </div>
        <span className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          STATUS_COLOR[job.status]
        )}>
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {job.batchCount} groupe{job.batchCount > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {assigneeCount} annotateur{assigneeCount > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {pct}%
        </span>
      </div>

      {/* Barre globale */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500',
          isCompleted ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${pct}%` }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-1 border-t border-border/50">
        <button
          type="button"
          onClick={() => onView(job.id)}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/40 transition-colors"
        >
          <Eye className="h-3 w-3" />
          Voir le détail
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <PlayCircle className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-base font-semibold mb-1">Aucun job d'annotation</p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Créez votre premier job pour commencer à annoter vos datasets.
        </p>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Créer un job
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnnotateHub() {
  const router = useRouter()

  // Batches assignés à moi (vue annotateur)
  const allGroups = useMemo(
    () => getJobGroupsForUser(CURRENT_USER.id),
    []
  )
  const activeGroups    = allGroups.filter(g => !jobIsCompleted(g))
  const completedGroups = allGroups.filter(g =>  jobIsCompleted(g))

  // Jobs créés par moi (vue manager/owner)
  const myCreatedJobs = useMemo(
    () => MOCK_JOBS.filter(j => j.createdBy === CURRENT_USER.id),
    []
  )

  const hasAnything  = allGroups.length > 0 || myCreatedJobs.length > 0
  const isOwner      = myCreatedJobs.length > 0

  const goDirect = (batchId: string) => router.push(`/annotate/${batchId}`)
  const goJob    = (jobId:   string) => router.push(`/annotate/job/${jobId}`)

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px]">
            <span className="text-secondary">Annoter</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Vos sessions d'annotation actives
          </p>
        </div>
        {hasAnything && (
          <button
            type="button"
            onClick={() => router.push('/annotate/new')}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle session
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8 px-6 py-6">

        {!hasAnything && (
          <EmptyState onNew={() => router.push('/annotate/new')} />
        )}

        {/* ── Section "À annoter" (vue annotateur) ── */}
        {activeGroups.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">À annoter</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {activeGroups.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeGroups.map(g => (
                <JobCard key={g.job.id} group={g} onGoDirectly={goDirect} onViewJob={goJob} />
              ))}
            </div>
          </section>
        )}

        {completedGroups.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Terminées</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {completedGroups.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedGroups.map(g => (
                <JobCard key={g.job.id} group={g} onGoDirectly={goDirect} onViewJob={goJob} />
              ))}
            </div>
          </section>
        )}

        {/* ── Section "Jobs créés" (vue owner uniquement) ── */}
        {isOwner && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Sessions que j'ai créés</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {myCreatedJobs.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myCreatedJobs.map(job => (
                <ManagerJobCard key={job.id} job={job} onView={goJob} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}