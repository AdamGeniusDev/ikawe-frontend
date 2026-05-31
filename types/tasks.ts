// types/tasks.ts

export type { DataType } from './datasets'
import type { DataType } from './datasets'
import type { Label } from './annotation'

// ─── Statut ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'paused'

// ─── Labels ───────────────────────────────────────────────────────────────────


export type TaskLabel = Label


export interface RevisionEvent {
  id:           string
  actorId:      string    // userId de qui a fait l'action
  actorName:    string    // nom affiché
  actorAvatarUrl?: string // URL photo de profil (optionnel — fallback vers initiales)
  action:       'started' | 'validated' | 'rejected'
  count?:       number    // nb d'éléments concernés
  comment?:     string    // message du réviseur (rejet uniquement)
  elementIds?:  string[]  // IDs des éléments rejetés (pour "Voir et corriger")
  createdAt:    string    // ISO date
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id:                string
  jobId:             string
  ownerId:           string
  title:             string
  datasetSource:     string
  dataType:          DataType
  totalElements:     number
  completedElements: number
  deadline:          string
  status:            TaskStatus
  labels:            TaskLabel[]

  // Champs pour la page détail
  instructions?:    string
  acceptanceRate?:  number
  reviewedCount?:   number
  assignedByName?:  string

  // Historique des révisions — affiché en bas de la page détail
  revisionHistory?: RevisionEvent[]
}

// ─── Metadata d'affichage ─────────────────────────────────────────────────────

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: 'En attente', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:   { label: 'Terminée',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  paused:      { label: 'En pause',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}



