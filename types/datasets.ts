// types/datasets.ts
// SOURCE DE VÉRITÉ — DataType, Dataset et tout ce qui concerne les datasets.


export type DataType =
  | 'image'
  | 'text'
  | 'audio'
  | 'csv'
  | 'json'

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  image: 'Image',
  text:  'Texte',
  audio: 'Audio',
  csv:   'CSV',
  json:  'JSON',
}



export type TaskType =
  | 'classification'
  | 'bounding_box'
  | 'transcription'
  | 'sequence'
  | 'captioning'

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  classification: 'Classification',
  bounding_box:   'Bounding Box',
  transcription:  'Transcription',
  sequence:       'NER / Séquence',
  captioning:     'Captioning',
}

// ─── Statuts ──────────────────────────────────────────────────────────────────
// draft      → dataset uploadé, pas encore configuré (titre, description manquants)
// active     → configuré, prêt à recevoir des jobs d'annotation
// in_review  → en cours de révision finale
// completed  → tous les jobs sont terminés
// archived   → plus utilisé, conservé pour référence

export type DatasetStatus =
  | 'draft'
  | 'active'
  | 'in_review'
  | 'completed'
  | 'archived'

export type DatasetVisibility = 'private' | 'team' | 'public'

// ─── Rôles dataset ────────────────────────────────────────────────────────────
// Droits d'un membre sur ce dataset spécifiquement.
// Distinct des Permission dans team.ts qui sont des droits globaux dans l'équipe.

export type DatasetRole =
  | 'viewer'
  | 'annotator'
  | 'reviewer'
  | 'admin'

// ─── Membres & accès ──────────────────────────────────────────────────────────

export interface DatasetMember {
  userId:     string
  name:       string
  avatarUrl?: string
  role:       DatasetRole
  grantedAt:  string
  grantedBy:  string
  expiresAt?: string
}

export interface TeamAssignment {
  teamId:     string
  teamName:   string
  assignedAt: string
  assignedBy: string
  memberRoleOverrides?: Record<string, DatasetRole>
}



export interface Dataset {
  // ── Identité ────────────────────────────────────────────────────────────────
  id:           string
  title:        string        // commence avec le nom du fichier uploadé, puis renommé
  description?: string        // optionnel : rempli à la configuration
  tags:         string[]
  language?:    string
  version:      string        // ex: "1.0", "2.3"

  // ── Propriété & accès ───────────────────────────────────────────────────────
  ownerId:    string
  visibility: DatasetVisibility   // défaut: 'private' à l'upload
  price:      number              // défaut: 0, rempli à la publication

  // ── Type de données (détecté automatiquement à l'upload) ────────────────────
  dataType: DataType

  // ── Fichiers (connus dès l'upload) ──────────────────────────────────────────
  totalFiles: number
  sizeMb:     number

  // ── Stats calculées depuis les jobs (optionnelles avant création d'un job) ──
  annotatedFiles?:    number   // somme des éléments annotés sur tous les jobs
  annotationProgress?: number  // pourcentage global, calculé côté backend
  taskCount?:         number   // nombre de jobs créés sur ce dataset
  downloadCount?:     number
  likeCount?:         number
  isLikedByCurrentUser?: boolean

  // ── Membres & équipes ───────────────────────────────────────────────────────
  members:         DatasetMember[]
  teamAssignments: TeamAssignment[]

  // ── Cycle de vie ────────────────────────────────────────────────────────────
  status:       DatasetStatus
  createdAt:    string
  updatedAt:    string
  completedAt?: string   // optionnel : rempli quand status passe à 'completed'
}