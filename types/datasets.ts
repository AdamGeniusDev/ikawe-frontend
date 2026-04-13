// types/dataset.ts

export type DataType =
  | 'image'
  | 'text'
  | 'audio'
  | 'video'
  | 'csv'
  | 'json'

export type TaskType =
  | 'classification'
  | 'object_detection'
  | 'segmentation'
  | 'ner'
  | 'transcription'
  | 'sentiment'

export type DatasetStatus =
  | 'draft'        // créé mais pas encore prêt
  | 'active'       // annotation en cours
  | 'in_review'    // soumis pour révision
  | 'completed'    // 100% annoté et validé
  | 'archived'     // désactivé

export type DatasetVisibility = 'private' | 'team' | 'public'

export type DatasetRole =
  | 'viewer'      // peut voir, télécharger
  | 'annotator'   // peut annoter
  | 'reviewer'    // peut valider/rejeter les annotations
  | 'admin'       // peut tout faire sur ce dataset

export interface DatasetMember {
  userId: string
  role: DatasetRole
  grantedAt: Date
  grantedBy: string    // userId de celui qui a octroyé l'accès
  expiresAt?: Date     // accès temporaire possible
}

export interface LabelDefinition {
  id: string
  name: string
  color: string        // hex, pour l'éditeur
  description?: string
  shortcut?: string    // raccourci clavier, ex: "E" pour Écran
}

export interface Dataset {
  // ── Identité ──────────────────────────────
  id: string
  title: string
  description: string
  tags: string[]
  language?: string          // ex: "fr", "fon", "yo", "wo"
  version: string            // convention : "1.0.0"

  // ── Propriété & accès ─────────────────────
  ownerId: string            // userId du créateur
  visibility: DatasetVisibility
  price: number              // 0 = gratuit, >0 = payant (en FCFA)

  // ── Type & tâche ──────────────────────────
  dataType: DataType
  taskType: TaskType

  // ── Fichiers & taille ─────────────────────
  totalFiles: number
  annotatedFiles: number     // pour calculer la progression
  sizeMb: number

  // ── Labels ────────────────────────────────
  labelSchema: LabelDefinition[]

  // ── Statistiques d'annotation ─────────────
  taskCount: number          // nb de tâches liées
  /** Calculé : annotatedFiles / totalFiles * 100 — utile en cache */
  annotationProgress: number

  //Liste des acces explicite

  members: DatasetMember[]

  // ── Statut & dates ────────────────────────
  status: DatasetStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date         // null tant que pas terminé
}