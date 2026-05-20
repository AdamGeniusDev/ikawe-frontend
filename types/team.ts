
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

// Collaborator supprimé → utiliser User directement
// Role supprimé → utiliser TeamRole + TEAM_ROLE_PERMISSIONS
// COLOR_OPTIONS reste si tu en as besoin pour l'UI des badges
export const COLOR_OPTIONS: { label: string; value: string }[] = [
  { label: 'Violet', value: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { label: 'Bleu',   value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'         },
  { label: 'Vert',   value: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Rose',   value: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'         },
  { label: 'Ambre',  value: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'     },
  { label: 'Rouge',  value: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'             },
]

// MOCK_TEAMS corrigé — TeamMember référence userId, pas un objet Collaborator

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Équipe NLP Francophone',
    description: 'Spécialisée dans le texte et les entités nommées',
    ownerId: 'user-owner',     // ← Jean Dupont depuis MOCK_USERS de user.ts
    createdAt: '2026-01-10',
    datasetIds: ['d1', 'd3', 'd4'],
    members: [
      { userId: 'user-kofi',    role: 'annotator', joinedAt: '2026-01-15', annotations: 2840, lastActive: 'Il y a 5 min' },
      { userId: 'user-aminata', role: 'annotator', joinedAt: '2026-01-20', annotations: 1120, lastActive: 'Il y a 2h'    },
      { userId: 'user-marie',   role: 'reviewer',  joinedAt: '2026-01-12', annotations: 560,  lastActive: 'Hier'         },
    ],
  },
  {
    id: 'team-2',
    name: 'Équipe Vision & Audio',
    description: 'Images, bounding boxes et transcriptions audio',
    ownerId: 'user-owner',
    createdAt: '2026-02-05',
    datasetIds: ['d2', 'd5'],
    members: [
      { userId: 'user-marie', role: 'team_admin', joinedAt: '2026-02-10', annotations: 980,  lastActive: 'Il y a 1j' },
      { userId: 'user-theo',  role: 'reviewer',   joinedAt: '2026-02-15', annotations: 560,  lastActive: 'Il y a 3j' },
    ],
  },
]

// ─── Datasets de référence ────────────────────────────────────────────────────

export const MOCK_DATASETS: DatasetRef[] = [
  { id: 'd1', name: 'smartphone_listings_v3.csv',  status: 'active'    },
  { id: 'd2', name: 'phones_images_batch2',         status: 'active'    },
  { id: 'd3', name: 'produits_telecom_dakar.json',  status: 'active'    },
  { id: 'd4', name: 'reviews_abidjan_corpus.txt',   status: 'completed' },
  { id: 'd5', name: 'audio_fon_yoruba_batch1',      status: 'active'    },
]

// ─── Invitations en attente ───────────────────────────────────────────────────

export const MOCK_PENDING: PendingInvite[] = [
  { id: 'p1', email: 'grace.kone@mail.com', sentAt: 'Il y a 2j' },
  { id: 'p2', email: 'serge.akpo@mail.com', sentAt: 'Il y a 5j' },
]

