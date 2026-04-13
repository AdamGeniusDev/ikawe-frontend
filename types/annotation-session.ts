// ─────────────────────────────────────────────
// types/annotation-session.ts
// ─────────────────────────────────────────────

export type AnnotationSessionStatus =
  | "pending"      // créée, pas encore commencée
  | "in_progress"  // en cours d'annotation
  | "completed"    // tous les éléments annotés
  | "paused"       // mise en pause par l'owner

export type AnnotationTaskType =
  | "classification"
  | "bounding_box"
  | "segmentation"
  | "ner"
  | "sentiment"
  | "transcription"
  | "captioning"

export interface SessionLabel {
  id: string
  name: string
  color: string
}

export interface AnnotationSession {
  id: string
  datasetId: string
  datasetTitle: string
  datasetType: string        // "image" | "audio" | "text" | "csv" | "json"
  taskType: AnnotationTaskType
  taskName: string
  labels: SessionLabel[]
  status: AnnotationSessionStatus
  allowMultiple: boolean
  allowSkip: boolean

  // Qui a créé la session
  createdBy: string          // userId
  createdAt: Date

  // Assignation
  assignedTo: string[]       // userIds (vide = solo/self)

  // Progression
  totalElements: number
  completedElements: number

  // Deadline optionnelle
  dueAt?: Date
}