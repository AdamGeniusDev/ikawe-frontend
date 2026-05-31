
import type { TeamRole } from './user'
import type { DatasetStatus } from './datasets'

// ─── Permissions ─────────────────────────────────────────────────
export type Permission = 'annotate' | 'review' | 'manage_datasets' | 'manage_team' | 'view_stats'

export const PERMISSION_LABELS: Record<Permission, string> = {
  annotate:        'Annoter les datasets',
  review:          'Réviser les annotations',
  manage_datasets: 'Gérer les datasets',
  manage_team:     "Gérer l'équipe",
  view_stats:      'Voir les statistiques',
}

// ─── Permissions par TeamRole ─────────────────────────────────────────────────

export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  team_owner:  ['annotate', 'review', 'manage_datasets', 'manage_team', 'view_stats'],
  team_admin:  ['annotate', 'review', 'manage_datasets', 'view_stats'],
  reviewer:    ['annotate', 'review', 'view_stats'],
  annotator:   ['annotate', 'view_stats'],
  viewer:      ['view_stats'],
}

// ─── TeamMember ───────────────────────────────────────────────────────────────
// Vue depuis la Team : qui est dans cette équipe, avec quel rôle
// On référence User par son id — pas de duplication des champs
export interface TeamMember {
  userId:      string      // ← référence vers User.id
  role:        TeamRole    // ← même type que User.teamMemberships[].role
  joinedAt:    string
  annotations: number
  lastActive:  string
}

// ─── DatasetRef  ────────────────────────────────────────────────────
export interface DatasetRef {
  id:     string
  name:   string
  status: DatasetStatus
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export interface Team {
  id:           string
  name:         string
  description?: string
  ownerId:      string    // ← userId du team_owner
  createdAt:    string
  datasetIds:   string[]
  members:      TeamMember[]
}

// ─── PendingInvite  ─────────────────────────────────────────────────
export interface PendingInvite {
  id:     string
  email:  string
  sentAt: string
}


export const COLOR_OPTIONS: { label: string; value: string }[] = [
  { label: 'Violet', value: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { label: 'Bleu',   value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'         },
  { label: 'Vert',   value: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Rose',   value: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'         },
  { label: 'Ambre',  value: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'     },
  { label: 'Rouge',  value: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'             },
]


