// types/annotation.ts
import type { DataType, TaskType } from './datasets'

// Labels définis PAR JOB — chaque job a ses propres labels

export interface SessionLabel {
  id:           string
  name:         string
  color:        string
  shortcut?:    string
  description?: string
}

export interface DatasetElement {
  id:       string
  src:      string        // URL du fichier (image, audio, texte...)
  filename: string
  meta?:    Record<string, string>
}

export interface AppliedLabel {
  labelId:        string
  bbox?:          { x: number; y: number; w: number; h: number }
  span?:          { start: number; end: number; text: string }
  transcription?: string
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

// ─────────────────────────────────────────────────────────────────────────────
// STATUTS
// ─────────────────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export const JOB_STATUS_META: Record<JobStatus, { label: string; className: string }> = {
  pending:     { label: 'En attente', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:   { label: 'Terminé',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled:   { label: 'Annulé',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export type BatchStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'

export const BATCH_STATUS_META: Record<BatchStatus, { label: string; className: string }> = {
  pending:     { label: 'En attente', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paused:      { label: 'En pause',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed:   { label: 'Terminé',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled:   { label: 'Annulé',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export type DistributionMode = 'sequential' | 'random'

// ─────────────────────────────────────────────────────────────────────────────
// BATCH ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────
// Stocké sur le Job (pas sur chaque Batch) car c'est l'admin qui définit
// les règles d'assignation une seule fois à la création du job.
// Le système applique ensuite ces règles sur chaque batch via resolveAssignedUsers().
//
// scope: 'job'   → s'applique à TOUS les batches du job (batchIndex doit être 0)
// scope: 'batch' → s'applique uniquement au batch N (batchIndex = N)
//


export type AssignmentScope = 'job' | 'batch'

export interface BatchAssignment {
  batchIndex:     number                   // 0 = tout le job, 1..N = batch spécifique
  scope:          AssignmentScope
  teamId?:        string                   // assigner une équipe entière
  userIds:        string[]                 // assigner des individus
  roleOverrides?: Record<string, 'annotator' | 'reviewer'>  // userId → rôle sur ce batch
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB D'ANNOTATION
// ─────────────────────────────────────────────────────────────────────────────
// Le Job est créé par un admin sur un Dataset existant.
// Un même Dataset peut avoir plusieurs Jobs avec des taskTypes et labels différents.

export interface AnnotationJob {
  id:          string
  datasetId:   string      // référence au Dataset
  datasetName: string      // copié pour affichage sans re-fetch

  // Hérité du Dataset à la création du Job (lecture seule ensuite)
  dataType: DataType

  // Définis par l'admin au moment de créer le Job (pas sur le Dataset)
  taskType: TaskType
  labels:   SessionLabel[]

  // Options de la tâche (dépendent du taskType choisi)
  allowSkip:               boolean
  allowMultiple?:          boolean          // utile pour classification multi-labels
  transcriptionLanguage?:  string           // si taskType === 'transcription'
  transcriptionMinLength?: number           // si taskType === 'transcription'
  targetField?:            string           // si taskType === 'sequence'

  // Découpage en batches
  totalElements:    number
  batchSize:        number
  batchCount:       number                  // calculé : Math.ceil(totalElements / batchSize)
  distributionMode: DistributionMode

  // Règles d'assignation (définies une fois, appliquées à tous les batches)
  // Le résultat par batch est dans AnnotationBatch.assignedTo[]
  batchAssignments: BatchAssignment[]

  // Suivi de progression (mis à jour quand les batches passent en 'completed')
  annotatedCount: number
  skippedCount:   number
  status:         JobStatus

  createdBy: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH D'ANNOTATION
// ─────────────────────────────────────────────────────────────────────────────
// Un batch = un paquet de N éléments à annoter, extrait du dataset.
// Créé automatiquement par le système quand un Job est validé.
//
// Il hérite des paramètres du Job (labels, taskType, options)
// et porte le résultat de la résolution des assignations (assignedTo[]).

export interface AnnotationBatch {
  id:          string
  jobId:       string      // référence au Job parent
  datasetId:   string
  datasetName: string

  // Hérités du Job
  dataType: DataType
  taskType: TaskType
  labels:   SessionLabel[]
  allowSkip:               boolean
  allowMultiple?:          boolean
  transcriptionLanguage?:  string
  transcriptionMinLength?: number
  targetField?:            string

  // Position dans le job
  batchIndex: number       // ex: 2 (ce batch est le 2ème)
  batchTotal: number       // ex: 3 (il y a 3 batches au total dans ce job)

  // Les fichiers à annoter dans CE batch
  elements: DatasetElement[]

  // Résultat de resolveAssignedUsers() — qui travaille sur ce batch
  assignedTo: string[]     // userIds effectifs (job-level + batch-level fusionnés)
  teamId?:    string       // si assigné via une équipe

  // État
  status:    BatchStatus
  pausedAt?: string
  progress?: SessionProgress
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOTATION SESSION — état actif dans le store Zustand pendant le travail
// ─────────────────────────────────────────────────────────────────────────────
// Produite par batchToSession() à partir d'un AnnotationBatch.
// C'est ce que l'annotateur voit : ses éléments, ses labels, sa progression.
// Il ne voit pas le Job, les assignations, les autres batches — juste son travail.

export interface AnnotationSession {
  id:          string
  datasetId:   string
  datasetName: string
  dataType:    DataType
  taskType:    TaskType

  // Contexte dans le job
  jobId?:      string
  batchIndex?: number
  batchTotal?: number
  status?:     BatchStatus

  // Contenu du travail
  labels:   SessionLabel[]
  elements: DatasetElement[]

  // Options
  allowSkip:               boolean
  allowMultiple?:          boolean
  transcriptionLanguage?:  string
  transcriptionMinLength?: number
  targetField?:            string

  // Qui est assigné
  assignedTo: string[]
  teamId?:    string

  // Méta
  createdAt: string
  pausedAt?: string
  progress?: SessionProgress
}


// Utilisé pour afficher la liste des tâches d'un annotateur groupées par Job.

export interface JobGroup {
  job:         AnnotationJob
  myBatches:   AnnotationBatch[]
  activeBatch: AnnotationBatch | null
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convertit un AnnotationBatch en AnnotationSession pour le store Zustand.
 * C'est la porte d'entrée : l'annotateur clique sur "Commencer" → batchToSession().
 */
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
    allowSkip:              batch.allowSkip,
    allowMultiple:          batch.allowMultiple,
    transcriptionLanguage:  batch.transcriptionLanguage,
    transcriptionMinLength: batch.transcriptionMinLength,
    targetField:            batch.targetField,
    assignedTo:  batch.assignedTo,
    teamId:      batch.teamId,
    createdAt:   new Date().toISOString(),
    pausedAt:    batch.pausedAt,
    progress:    batch.progress,
  }
}

/**
 Initialise toutes les annotations (elements a annote) d'un batch à 'pending'.
 Appelé quand l'annotateur ouvre un batch pour la première fois.
 */
export function generateInitialAnnotations(
  elements: DatasetElement[]
): Record<string, ElementAnnotation> {
  return Object.fromEntries(
    elements.map(el => [
      el.id,
      { elementId: el.id, status: 'pending' as AnnotationStatus, appliedLabels: [] },
    ])
  )
}

/**
  Trouve le batch le plus prioritaire à ouvrir pour un annotateur.
  Priorité : in_progress > paused > pending
  (On reprend d'abord ce qui est en cours, puis ce qui est en pause, puis le nouveau)
 */
export function findActiveBatch(batches: AnnotationBatch[]): AnnotationBatch | null {
  return (
    batches.find(b => b.status === 'in_progress') ??
    batches.find(b => b.status === 'paused')      ??
    batches.find(b => b.status === 'pending')     ??
    null
  )
}

/**
  Groupe les batches par job pour la vue /annotate.
  Filtre uniquement les batches assignés à l'utilisateur courant.
 */
export function groupBatchesByJob(
  jobs:    AnnotationJob[],
  batches: AnnotationBatch[],
  userId:  string,
): JobGroup[] {
  return jobs
    .map(job => {
      const myBatches = batches.filter(
        b => b.jobId === job.id && b.assignedTo.includes(userId)
      )
      if (myBatches.length === 0) return null
      return { job, myBatches, activeBatch: findActiveBatch(myBatches) }
    })
    .filter(Boolean) as JobGroup[]
}

/**
  Calcule la liste finale des userIds assignés à un batch donné.
 
 Fusionne deux niveaux de règles depuis job.batchAssignments :
   1. scope='job'   → s'applique à tous les batches (héritage global)
   2. scope='batch' → s'applique uniquement au batchIndex ciblé

  **/

export function resolveAssignedUsers(
  job:        AnnotationJob,
  batchIndex: number,
): string[] {
  const jobLevel   = job.batchAssignments.filter(a => a.scope === 'job')
  const batchLevel = job.batchAssignments.filter(
    a => a.scope === 'batch' && a.batchIndex === batchIndex
  )
  const allUserIds = [
    ...jobLevel.flatMap(a => a.userIds),
    ...batchLevel.flatMap(a => a.userIds),
  ]
  return [...new Set(allUserIds)] 
}

/**
  Vérifie si un dataset est prêt à recevoir un job d'annotation.
  À appeler avant d'afficher le formulaire de création de job.
 
  Un dataset 'draft' = uploadé mais pas encore configuré (titre, description manquants).
  On ne peut pas créer un job dessus car ses métadonnées sont incomplètes.
 **/
export function isDatasetReadyForJob(datasetStatus: string): boolean {
  return datasetStatus === 'active' || datasetStatus === 'in_review'
}