// types/annotation.ts

import { AlertCircle, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DataType, TaskType } from './datasets'

// ─── Labels & éléments ───────────────────────────────────────────────────────

// Label de base — SOURCE DE VÉRITÉ pour { id, name, color }.
export interface Label {
  id:    string
  name:  string
  color: string
}

// Label enrichi pour une session d'annotation (raccourci clavier + description).
export interface SessionLabel extends Label {
  shortcut?:    string
  description?: string
}

export interface DatasetElement {
  id:       string
  src:      string
  filename: string
  meta?:    Record<string, string>
}

// ─── Primitives géométriques — SOURCE DE VÉRITÉ ──────────────────────────────

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export interface TextSpan {
  start: number
  end:   number
  text:  string
}

export interface AppliedLabel {
  labelId:        string
  bbox?:          BBox
  span?:          TextSpan
  transcription?: string
}

// ─── Représentations d'édition (état UI d'annotation) ────────────────────────


export interface BoundingBox extends BBox {
  id:      string
  labelId: string
}

export interface SpanAnnotation extends TextSpan {
  id:      string
  labelId: string
}

export type AnnotationStatus = 'pending' | 'annotated' | 'skipped' | 'uncertain'

export interface ElementAnnotation {
  elementId:     string
  status:        AnnotationStatus
  appliedLabels: AppliedLabel[]
  comment?:      string
  updatedAt?:    string
}

export interface SessionProgress {
  total:     number
  annotated: number
  skipped:   number
  remaining: number
}

// ─── Statuts job ─────────────────────────────────────────────────────────────

export type JobStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

export const JOB_STATUS_META: Record<JobStatus, { label: string; className: string }> = {
  draft:       { label: 'Brouillon',  className: 'bg-muted text-muted-foreground' },
  pending:     { label: 'En attente', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:   { label: 'Terminé',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled:   { label: 'Annulé',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

// ─── ReviewMode ───────────────────────────────────────────────────────────────

export type ReviewMode = 'all' | 'none'

// ─── AssignmentMode — le choix central ───────────────────────────────────────
//
//  INDIVIDUS :
//    - Pool = liste d'individus annotateurs
//    - Un réviseur global optionnel (différent des annotateurs)
//    - Chaque batch → 1 annotateur + réviseur global (ou aucun)
//    - Le owner contrôle tout
//
//  EQUIPES :
//    - Pool = liste d'équipes
//    - Chaque batch → 1 équipe (boîte noire, gère son workflow interne)
//    - Pas de réviseur global : l'équipe s'en charge
//    - Le owner ne choisit PAS de réviseur

export type AssignmentMode = 'individuals' | 'teams'

// ─── JobPool ─────────────────────────────────────────────────────────────────
//
//  Selon le mode :
//    MODE individus → annotatorIds rempli, teamIds vide
//    MODE équipes   → teamIds rempli, annotatorIds vide
//
//  reviewerId n'est pertinent qu'en mode individus.

export interface JobPool {
  mode:         AssignmentMode
  annotatorIds: string[]   // mode individus uniquement
  teamIds:      string[]   // mode équipes uniquement
  reviewerId?:  string     // mode individus uniquement, optionnel
  reviewMode:   ReviewMode
}

export function poolIsValid(pool: JobPool): boolean {
  if (pool.mode === 'individuals') return pool.annotatorIds.length > 0
  return pool.teamIds.length > 0
}

// ─── ResolvedBatchAssignment ─────────────────────────────────────────────────
//
//  Résultat de distributePool() pour un batch.
//  Soit annotatorId (mode individus), soit teamId (mode équipes).

export interface ResolvedBatchAssignment {
  batchIndex:  number
  annotatorId?: string
  teamId?:      string
  reviewerId?:  string
  reviewMode:   ReviewMode
  isOverride:   boolean
}

// ─── BatchAssignmentOverride ─────────────────────────────────────────────────

export interface BatchAssignmentOverride {
  batchIndex:   number
  annotatorId?: string
  teamId?:      string
  reviewerId?:  string
  reviewMode:   ReviewMode
}

// ─── distributePool ──────────────────────────────────────────────────────────
//
//  Répartit le pool en round-robin sur batchCount batches.
//  Les overrides remplacent l'assignation calculée pour un batch donné.

export function distributePool(
  pool:       JobPool,
  batchCount: number,
  overrides:  BatchAssignmentOverride[],
): ResolvedBatchAssignment[] {
  const slots: Omit<ResolvedBatchAssignment, 'batchIndex' | 'isOverride'>[] =
    pool.mode === 'individuals'
      ? pool.annotatorIds.map(id => ({
          annotatorId: id,
          reviewerId:  pool.reviewerId,
          reviewMode:  pool.reviewMode,
        }))
      : pool.teamIds.map(teamId => ({
          teamId,
          reviewMode: 'none' as ReviewMode, // les équipes gèrent leur révision
        }))

  if (slots.length === 0) return []

  return Array.from({ length: batchCount }, (_, i) => {
    const batchIndex = i + 1
    const override   = overrides.find(o => o.batchIndex === batchIndex)

    if (override) {
      return {
        batchIndex,
        annotatorId: override.annotatorId,
        teamId:      override.teamId,
        reviewerId:  override.reviewerId,
        reviewMode:  override.reviewMode,
        isOverride:  true,
      }
    }

    return {
      batchIndex,
      ...slots[i % slots.length],
      isOverride: false,
    }
  })
}

// ─── Statuts batch ────────────────────────────────────────────────────────────

export type BatchStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'in_review'
  | 'partially_rejected'
  | 'rejected'
  | 'completed'
  | 'blocked'
  | 'cancelled'

export const BATCH_STATUS_META: Record<
  BatchStatus,
  { label: string; className: string; barColor: string; icon: LucideIcon }
> = {
  pending:            { label: 'En attente',           className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',            barColor: 'bg-zinc-300 dark:bg-zinc-600', icon: Circle        },
  in_progress:        { label: 'En cours',             className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         barColor: 'bg-primary',                   icon: Clock         },
  paused:             { label: 'En pause',             className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',     barColor: 'bg-amber-500',                 icon: Clock         },
  submitted:          { label: 'Soumis',               className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', barColor: 'bg-violet-500',                icon: CheckCircle2  },
  in_review:          { label: 'En révision',          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         barColor: 'bg-blue-500',                  icon: Clock         },
  partially_rejected: { label: 'Corrections requises', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', barColor: 'bg-orange-500',                icon: AlertCircle   },
  rejected:           { label: 'Rejeté',               className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             barColor: 'bg-red-500',                   icon: XCircle       },
  completed:          { label: 'Terminé',              className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', barColor: 'bg-emerald-500',            icon: CheckCircle2  },
  blocked:            { label: 'Bloqué',               className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',         barColor: 'bg-rose-500',                  icon: AlertCircle   },
  cancelled:          { label: 'Annulé',               className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',            barColor: 'bg-zinc-500',                  icon: Circle        },
}

export function resolveBatchStatusAfterReview(
  validatedCount: number,
  rejectedCount:  number,
): BatchStatus {
  if (rejectedCount === 0)  return 'completed'
  if (validatedCount === 0) return 'rejected'
  return 'partially_rejected'
}

export type BatchUserRole = 'annotator' | 'reviewer' | 'owner' | 'none'

export function resolveBatchUserRole(
  batch:   AnnotationBatch,
  userId:  string,
  ownerId: string,
): BatchUserRole {
  if (userId === ownerId)          return 'owner'
  if (batch.reviewerId === userId) return 'reviewer'
  if (batch.assignedTo === userId) return 'annotator'
  return 'none'
}

export type DistributionMode = 'sequential' | 'random'

// ─── AnnotationJob ────────────────────────────────────────────────────────────

export interface AnnotationJob {
  id:          string
  datasetId:   string
  datasetName: string
  dataType:    DataType
  taskType:    TaskType
  labels:      SessionLabel[]
  instructions?: string

  allowSkip:               boolean
  allowMultiple?:          boolean
  transcriptionLanguage?:  string
  transcriptionMinLength?: number
  targetField?:            string

  totalElements:    number
  batchSize:        number
  batchCount:       number
  distributionMode: DistributionMode

  pool:           JobPool
  batchOverrides: BatchAssignmentOverride[]

  annotatedCount: number
  skippedCount:   number
  status:         JobStatus
  createdBy:      string
  createdAt:      string
}

// ─── AnnotationBatch ──────────────────────────────────────────────────────────
//
//  Dénormalisation intentionnelle :
//  Les champs datasetId, datasetName, dataType, taskType, labels, instructions
//  sont copiés depuis AnnotationJob à la création du batch.
//  Raison : le batch doit être autonome — un annotateur peut travailler sur son
//  batch même si le job parent est modifié ou archivé entre-temps.
//  Le batch est la source de vérité pour sa propre session d'annotation.

export interface AnnotationBatch {
  id:          string
  jobId:       string
  datasetId:   string
  datasetName: string
  dataType:    DataType
  taskType:    TaskType
  labels:      SessionLabel[]

  instructions?:           string
  allowSkip:               boolean
  allowMultiple?:          boolean
  transcriptionLanguage?:  string
  transcriptionMinLength?: number
  targetField?:            string

  batchIndex: number
  batchTotal: number
  elements:   DatasetElement[]

  assignedTo:  string   // userId ou "team:<teamId>"
  reviewerId?: string
  reviewMode:  ReviewMode
  teamId?:     string
  isOverride:  boolean

  status:       BatchStatus
  pausedAt?:    string
  submittedAt?: string
  progress?:    SessionProgress

  acceptedCount?: number
  rejectedCount?: number
}

// ─── AnnotationSession ────────────────────────────────────────────────────────
//
//  Dénormalisation intentionnelle (suite de AnnotationBatch) :
//  batchToSession() copie tous les champs de configuration pour que la session
//  soit complètement autonome pendant l'annotation, sans re-fetch.

export interface AnnotationSession {
  id:          string
  datasetId:   string
  datasetName: string
  dataType:    DataType
  taskType:    TaskType
  jobId?:      string
  batchIndex?: number
  batchTotal?: number
  status?:     BatchStatus

  labels:   SessionLabel[]
  elements: DatasetElement[]

  instructions?:           string
  allowSkip:               boolean
  allowMultiple?:          boolean
  transcriptionLanguage?:  string
  transcriptionMinLength?: number
  targetField?:            string

  assignedTo:  string
  reviewerId?: string
  reviewMode:  ReviewMode
  teamId?:     string
  createdAt:   string
  pausedAt?:   string
  progress?:   SessionProgress
}

export interface JobGroup {
  job:         AnnotationJob
  myBatches:   AnnotationBatch[]
  activeBatch: AnnotationBatch | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function batchToSession(batch: AnnotationBatch): AnnotationSession {
  return {
    id:          batch.id,
    datasetId:   batch.datasetId,
    datasetName: batch.datasetName,
    dataType:    batch.dataType,
    taskType:    batch.taskType,
    jobId:       batch.jobId,
    batchIndex:  batch.batchIndex,
    batchTotal:  batch.batchTotal,
    status:      batch.status,
    labels:      batch.labels,
    elements:    batch.elements,
    instructions:           batch.instructions,
    allowSkip:              batch.allowSkip,
    allowMultiple:          batch.allowMultiple,
    transcriptionLanguage:  batch.transcriptionLanguage,
    transcriptionMinLength: batch.transcriptionMinLength,
    targetField:            batch.targetField,
    assignedTo:  batch.assignedTo,
    reviewerId:  batch.reviewerId,
    reviewMode:  batch.reviewMode,
    teamId:      batch.teamId,
    createdAt:   new Date().toISOString(),
    pausedAt:    batch.pausedAt,
    progress:    batch.progress,
  }
}

export function generateInitialAnnotations(
  elements: DatasetElement[],
): Record<string, ElementAnnotation> {
  return Object.fromEntries(
    elements.map(el => [
      el.id,
      { elementId: el.id, status: 'pending' as AnnotationStatus, appliedLabels: [] },
    ])
  )
}

export function findActiveBatch(batches: AnnotationBatch[]): AnnotationBatch | null {
  return (
    batches.find(b => b.status === 'in_progress') ??
    batches.find(b => b.status === 'paused')      ??
    batches.find(b => b.status === 'pending')     ??
    null
  )
}

export function groupBatchesByJob(
  jobs:    AnnotationJob[],
  batches: AnnotationBatch[],
  userId:  string,
  // Prédicat d'accès injectable : par défaut assignation individuelle directe.
  // mock-data y injecte une version qui gère aussi les batches d'équipe.
  canAccess: (batch: AnnotationBatch, userId: string) => boolean =
    (b, u) => b.assignedTo === u,
): JobGroup[] {
  return jobs
    .map(job => {
      const myBatches = batches.filter(b => b.jobId === job.id && canAccess(b, userId))
      if (myBatches.length === 0) return null
      return { job, myBatches, activeBatch: findActiveBatch(myBatches) }
    })
    .filter(Boolean) as JobGroup[]
}

// Nombre d'assignés d'un job, calculé depuis le pool (source de vérité).
// teamSize() permet de résoudre la taille réelle des équipes (optionnel).
export function countJobAssignees(
  job:      AnnotationJob,
  teamSize: (teamId: string) => number = () => 0,
): number {
  const p = job.pool
  if (p.mode === 'individuals') return p.annotatorIds.length
  return p.teamIds.reduce((n, tid) => n + teamSize(tid), 0)
}

export function isDatasetReadyForJob(datasetStatus: string): boolean {
  return datasetStatus === 'active' || datasetStatus === 'in_review'
}