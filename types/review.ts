// types/review.ts
// Types pour la page de révision /review/[batchId].
//
// Le réviseur parcourt les éléments annotés (status='annotated') et pour chacun :
//   - voit l'annotation soumise (labels, bbox, transcription, spans)
//   - valide → status passe à 'validated'
//   - rejette avec commentaire → status passe à 'rejected'
//
// L'annotateur voit ensuite ses rejets depuis /annotate/[batchId]?filter=rejected.

import type { TaskType, DataType } from './datasets'
import type { DatasetElement, AppliedLabel, SessionLabel } from './annotation'

// ─── Statut de révision ───────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'validated' | 'rejected'

// ─── Élément à réviser ────────────────────────────────────────────────────────

export interface ReviewItem {
  elementId:      string
  element:        DatasetElement
  appliedLabels:  AppliedLabel[]
  annotatedBy:    string
  annotatedAt:    string
  comment?:       string

  reviewStatus:   ReviewStatus
  reviewComment?: string
  reviewedAt?:    string
}

// ─── Session de révision ──────────────────────────────────────────────────────

export interface ReviewSession {
  batchId:       string
  jobId:         string
  datasetName:   string
  dataType:      DataType
  taskType:      TaskType    // classification | bounding_box | transcription | sequence | captioning
  labels:        SessionLabel[]
  items:         ReviewItem[]
  instructions?: string
  reviewerId:    string
  totalItems:    number
}

// ─── Décision locale du réviseur (état UI) ────────────────────────────────────

export interface ReviewDecision {
  status:  'validated' | 'rejected' | null
  comment: string
}

// ─── Progression de la révision ───────────────────────────────────────────────

export interface ReviewProgress {
  total:     number
  validated: number
  rejected:  number
  pending:   number
}

export function computeReviewProgress(items: ReviewItem[]): ReviewProgress {
  return {
    total:     items.length,
    validated: items.filter(i => i.reviewStatus === 'validated').length,
    rejected:  items.filter(i => i.reviewStatus === 'rejected').length,
    pending:   items.filter(i => i.reviewStatus === 'pending').length,
  }
}


