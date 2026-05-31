// types/datasets.ts
// SOURCE DE VÉRITÉ — DataType, Dataset et tout ce qui concerne les datasets.

import { Team } from "./team"
import { User } from "./user"


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



export const VALID_TASK_TYPES_BY_DATA: Record<DataType, TaskType[]> = {
  image: ['classification', 'bounding_box', 'captioning'],
  text:  ['classification', 'sequence'],
  audio: ['classification', 'transcription'],
  csv:   ['classification'],
  json:  ['classification'],
}

export function getValidTaskTypes(dataType: DataType): TaskType[] {
  return VALID_TASK_TYPES_BY_DATA[dataType]
}

export function isValidTaskCombination(dataType: DataType, taskType: TaskType): boolean {
  return VALID_TASK_TYPES_BY_DATA[dataType].includes(taskType)
}



export type DatasetElementStatus = 'unannotated' | 'in_review' | 'rejected' | 'annotated'

export interface DatasetElementUI {
  id:               string
  name:             string              // nom de fichier affiché
  type:             DataType
  previewUrl?:      string              // URL de prévisualisation (image) ou placeholder
  sizeBytes?:       number              // pour les images
  durationSeconds?: number              // pour les audios
  wordCount?:       number              // pour text / json / csv
  status?:          DatasetElementStatus
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
  createdAt:    Date
  updatedAt:    Date
  completedAt?: Date   // optionnel : rempli quand status passe à 'completed'
}

export function resolveDatasetAccess(
  dataset:       Dataset,
  allTeams:      Team[],
  allUsers:      User[],
  currentUserId: string,
): User[] {
  // Membres individuels explicites
  const individualIds = new Set(dataset.members.map(m => m.userId))

  // Membres via équipes assignées
  const teamMemberIds = new Set(
    dataset.teamAssignments.flatMap(ta => {
      const team = allTeams.find(t => t.id === ta.teamId)
      return team ? team.members.map(m => m.userId) : []
    })
  )

  const allIds = new Set([...individualIds, ...teamMemberIds])
  allIds.delete(currentUserId)

  return allUsers.filter(u => allIds.has(u.id))
}


export function resolveUserDatasetRole(
  dataset:  Dataset,
  userId:   string,
  allTeams: Team[],
): DatasetRole | undefined {
  // Rôle individuel explicite — priorité max
  const directMember = dataset.members.find(m => m.userId === userId)
  if (directMember) return directMember.role

  // Rôle via équipe + éventuel override
  for (const ta of dataset.teamAssignments) {
    const team = allTeams.find(t => t.id === ta.teamId)
    if (!team) continue
    const inTeam = team.members.some(m => m.userId === userId)
    if (!inTeam) continue
    // Override individuel dans cette assignment d'équipe
    const override = ta.memberRoleOverrides?.[userId]
    if (override) return override
    // Rôle par défaut de l'équipe = annotator (tu peux le configurer)
    return 'annotator'
  }

  return undefined
}

//verifie si un user a accès à un dataset (en tant que owner, membre individuel ou via équipe assignée)

export function hasDatasetAccess(
  dataset:  Dataset,
  userId:   string,
  allTeams: Team[],
): boolean {
  if (dataset.ownerId === userId) return true
  if (dataset.members.some(m => m.userId === userId)) return true
  return dataset.teamAssignments.some(ta => {
    const team = allTeams.find(t => t.id === ta.teamId)
    return team?.members.some(m => m.userId === userId) ?? false
  })
}