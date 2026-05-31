'use client'

// app/(root)/reviews/page.tsx
//
// Queue de révision du réviseur — liste tous les batches qu'il doit réviser.
// Accessible depuis la navigation principale (séparé de /tasks qui est pour les annotateurs).
//
// Statuts visibles ici :
//   submitted          → à commencer (priorité haute)
//   in_review          → en cours (le réviseur a déjà commencé)
//   partially_rejected → l'annotateur a corrigé, à re-réviser
//
// Statuts exclus :
//   completed / rejected / cancelled → archivés, pas dans la queue active

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
   Clock, AlertCircle, CheckCircle2,
  ChevronRight, Search, RotateCcw,
  ImageIcon, Music, FileText, Table2, Braces,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AnnotationBatch, BatchStatus,
  BATCH_STATUS_META,
} from '@/types/annotation'
import type { DataType } from '@/types/datasets'
import { getUserById } from '@/types/user'

// ─── Mock batches à réviser ───────────────────────────────────────────────────
// En production : GET /api/me/review-queue


const MOCK_REVIEW_QUEUE: AnnotationBatch[] = [
  {
    id: 'batch-001-1', jobId: 'job-001',
    datasetId: 'ds-001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    labels: [], elements: [],
    batchIndex: 1, batchTotal: 3,
    assignedTo: 'user-kofi',
    reviewerId: 'user-marie',
    reviewMode: 'all',
    isOverride: false,
    allowSkip: true,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    progress: { total: 25, annotated: 25, skipped: 0, remaining: 0 },
  },
  {
    id: 'batch-002-1', jobId: 'job-002',
    datasetId: 'ds-002', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    labels: [], elements: [],
    batchIndex: 1, batchTotal: 2,
    assignedTo: 'user-aminata',
    reviewerId: 'user-marie',
    reviewMode: 'all',
    isOverride: false,
    allowSkip: false,
    status: 'in_review',
    submittedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    progress: { total: 30, annotated: 30, skipped: 0, remaining: 0 },
    acceptedCount: 18,
    rejectedCount: 4,
  },
  {
    id: 'batch-003-1', jobId: 'job-003',
    datasetId: 'ds-003', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    labels: [], elements: [],
    batchIndex: 1, batchTotal: 1,
    assignedTo: 'user-kofi',
    reviewerId: 'user-marie',
    reviewMode: 'all',
    isOverride: false,
    allowSkip: false,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    progress: { total: 15, annotated: 14, skipped: 1, remaining: 0 },
  },
  {
    id: 'batch-004-2', jobId: 'job-004',
    datasetId: 'ds-004', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    labels: [], elements: [],
    batchIndex: 2, batchTotal: 4,
    assignedTo: 'user-kofi',
    reviewerId: 'user-marie',
    reviewMode: 'all',
    isOverride: false,
    allowSkip: true,
    status: 'partially_rejected',
    submittedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    progress: { total: 20, annotated: 20, skipped: 0, remaining: 0 },
    acceptedCount: 14,
    rejectedCount: 6,
  },
  {
    id: 'batch-005-1', jobId: 'job-005',
    datasetId: 'ds-005', datasetName: 'SafeDeal — Descriptions produits',
    dataType: 'image', taskType: 'captioning',
    labels: [], elements: [],
    batchIndex: 1, batchTotal: 2,
    assignedTo: 'user-aminata',
    reviewerId: 'user-marie',
    reviewMode: 'all',
    isOverride: false,
    allowSkip: false,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    progress: { total: 40, annotated: 40, skipped: 0, remaining: 0 },
  },
]

// ─── Helpers visuels ──────────────────────────────────────────────────────────

const DATA_TYPE_ICON: Record<DataType, LucideIcon> = {
  image: ImageIcon,
  audio: Music,
  text:  FileText,
  csv:   Table2,
  json:  Braces,
}

const DATA_TYPE_COLOR: Record<DataType, string> = {
  image: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  audio: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
  text:  'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  csv:   'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  json:  'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
}

const REVIEW_STATUS_PRIORITY: Record<string, number> = {
  partially_rejected: 0,  // priorité max — l'annotateur attend
  submitted:          1,  // nouveau à traiter
  in_review:          2,  // déjà commencé
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${days}j`
}

// ─── Badge de statut ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BatchStatus }) {
  const meta = BATCH_STATUS_META[status]
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', meta.className)}>
      {meta.label}
    </span>
  )
}

// ─── Carte d'un batch à réviser ───────────────────────────────────────────────

function ReviewCard({ batch, onStart }: { batch: AnnotationBatch; onStart: () => void }) {
  const Icon       = DATA_TYPE_ICON[batch.dataType]
  const iconColor  = DATA_TYPE_COLOR[batch.dataType]
  const annotator  = batch.assignedTo ? getUserById(batch.assignedTo) : null
  const isNew      = batch.status === 'submitted'
  const isOngoing  = batch.status === 'in_review'
  const isRevisit  = batch.status === 'partially_rejected'

  // Progression de révision si déjà commencée
  const reviewed   = (batch.acceptedCount ?? 0) + (batch.rejectedCount ?? 0)
  const total      = batch.progress?.total ?? 0
  const reviewPct  = total > 0 ? Math.round((reviewed / total) * 100) : 0

  return (
    <div
      className={cn(
        'group rounded-2xl border bg-background hover:shadow-sm transition-all duration-150 overflow-hidden cursor-pointer',
        isRevisit && 'border-orange-200 dark:border-orange-800/40',
        isNew     && 'border-violet-200 dark:border-violet-800/30',
      )}
      onClick={onStart}
    >
      {/* Bandeau priorité pour les corrections en attente */}
      {isRevisit && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800/30">
          <RotateCcw className="h-3 w-3 text-orange-500" />
          <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
            L'annotateur a soumis ses corrections — à re-réviser
          </span>
        </div>
      )}

      <div className="flex items-start gap-4 px-5 py-4">

        {/* Icône type de données */}
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{batch.datasetName}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Batch {batch.batchIndex}/{batch.batchTotal}
                {annotator && <> · annoté par <span className="font-medium">{annotator.name}</span></>}
              </p>
            </div>
            <StatusBadge status={batch.status} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{total} éléments</span>
            </div>

            {isOngoing && reviewed > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${reviewPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {reviewed}/{total} révisés
                </span>
              </div>
            )}

            {isRevisit && batch.rejectedCount && (
              <div className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-3 w-3" />
                <span>{batch.rejectedCount} éléments corrigés à vérifier</span>
              </div>
            )}

            {batch.submittedAt && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" />
                <span>Soumis {formatRelativeTime(batch.submittedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onStart() }}
          className={cn(
            'flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors mt-0.5',
            isNew || isRevisit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-border hover:bg-muted text-foreground',
          )}
        >
          {isNew     && 'Commencer'}
          {isOngoing && 'Continuer'}
          {isRevisit && 'Vérifier'}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'submitted' | 'in_review' | 'partially_rejected'

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all',                label: 'Tout' },
  { id: 'submitted',          label: 'À commencer' },
  { id: 'in_review',          label: 'En cours' },
  { id: 'partially_rejected', label: 'Corrections' },
]

export default function ReviewsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  // Filtre + tri par priorité
  const queue = useMemo(() => {
    return MOCK_REVIEW_QUEUE
      .filter(b => {
        if (filter !== 'all' && b.status !== filter) return false
        if (search && !b.datasetName.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) =>
        (REVIEW_STATUS_PRIORITY[a.status] ?? 99) -
        (REVIEW_STATUS_PRIORITY[b.status] ?? 99)
      )
  }, [filter, search])

  // Stats de la queue
  const stats = useMemo(() => ({
    submitted:          MOCK_REVIEW_QUEUE.filter(b => b.status === 'submitted').length,
    in_review:          MOCK_REVIEW_QUEUE.filter(b => b.status === 'in_review').length,
    partially_rejected: MOCK_REVIEW_QUEUE.filter(b => b.status === 'partially_rejected').length,
  }), [])

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px] text-secondary">Révisions</h1>
          <p className="text-[14px] text-muted-foreground">
            {MOCK_REVIEW_QUEUE.length} batch{MOCK_REVIEW_QUEUE.length > 1 ? 'es' : ''} à réviser
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 rounded-2xl border bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">À commencer</span>
              <div className="h-2 w-2 rounded-full bg-violet-500" />
            </div>
            <p className="text-2xl font-bold">{stats.submitted}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">En cours</span>
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-bold">{stats.in_review}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Corrections</span>
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </div>
            <p className="text-2xl font-bold">{stats.partially_rejected}</p>
          </div>
        </div>

        {/* ── Filtres + recherche ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtres rapides */}
          <div className="flex items-center gap-1 rounded-xl border bg-muted/30 p-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filter === f.id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                {f.id !== 'all' && stats[f.id as keyof typeof stats] > 0 && (
                  <span className="ml-1.5 text-[9px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                    {stats[f.id as keyof typeof stats]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl border bg-background px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un dataset…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* ── Queue ── */}
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {search || filter !== 'all'
                ? 'Aucun batch ne correspond aux filtres'
                : 'Aucun batch à réviser pour le moment'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map(batch => (
              <ReviewCard
                key={batch.id}
                batch={batch}
                onStart={() => router.push(`/review/${batch.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}