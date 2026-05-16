// ─── Permissions ─────────────────────────────────────────────────────────────

import { DatasetStatus } from "./datasets";

export type Permission =
  | "annotate"
  | "review"
  | "manage_datasets"
  | "manage_team"
  | "view_stats"

export const PERMISSION_LABELS: Record<Permission, string> = {
  annotate:        "Annoter les datasets",
  review:          "Réviser les annotations",
  manage_datasets: "Gérer les datasets",
  manage_team:     "Gérer l'équipe",
  view_stats:      "Voir les statistiques",
}

export const COLOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Violet", value: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"     },
  { label: "Bleu",   value: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"             },
  { label: "Vert",   value: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { label: "Rose",   value: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"             },
  { label: "Ambre",  value: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
  { label: "Rouge",  value: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"                 },
]


export interface Role {
  id:          string
  name:        string
  color:       string
  permissions: Permission[]
}


export interface Collaborator {
  id:          string
  name:        string
  email:       string
  initials:    string
  avatarColor: string
}



export interface TeamMember {
  collaborator: Collaborator
  role:         Role
  joinedAt:     string      // ISO date
  annotations:  number      // ce mois
  lastActive:   string      // texte relatif
}



export interface DatasetRef {
  id:     string
  name:   string
  status: DatasetStatus
}



export interface Team {
  id:          string
  name:        string
  description?: string
  createdAt:   string
  datasetIds:  string[]     
  members:     TeamMember[]
}

// ─── Invitation en attente ────────────────────────────────────────────────────

export interface PendingInvite {
  id:     string
  email:  string
  sentAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ROLES: Role[] = [
  {
    id: "r1", name: "Annotateur", color: COLOR_OPTIONS[0].value,
    permissions: ["annotate", "view_stats"],
  },
  {
    id: "r2", name: "Réviseur", color: COLOR_OPTIONS[1].value,
    permissions: ["annotate", "review", "view_stats"],
  },
  {
    id: "r3", name: "Admin", color: COLOR_OPTIONS[2].value,
    permissions: ["annotate", "review", "manage_datasets", "manage_team", "view_stats"],
  },
]

export const MOCK_DATASETS: DatasetRef[] = [
  { id: "d1", name: "smartphone_listings_v3.csv",   status: "active"    },
  { id: "d2", name: "phones_images_batch2",          status: "active"    },
  { id: "d3", name: "produits_telecom_dakar.json",   status: "active"    },
  { id: "d4", name: "reviews_abidjan_corpus.txt",    status: "completed" },
  { id: "d5", name: "audio_fon_yoruba_batch1",       status: "active"    },
]

export const MOCK_ALL_COLLABORATORS: Collaborator[] = [
  { id: "c1", name: "Kofi Boateng",   email: "kofi@example.com",    initials: "KB", avatarColor: "bg-violet-100 text-violet-700"   },
  { id: "c2", name: "Aminata Diallo", email: "aminata@example.com", initials: "AD", avatarColor: "bg-blue-100 text-blue-700"       },
  { id: "c3", name: "Théo Comlan",    email: "theo@example.com",    initials: "TC", avatarColor: "bg-emerald-100 text-emerald-700" },
  { id: "c4", name: "Fatou Mbaye",    email: "fatou@example.com",   initials: "FM", avatarColor: "bg-pink-100 text-pink-700"       },
  { id: "c5", name: "Omar Lassana",   email: "omar@example.com",    initials: "OL", avatarColor: "bg-amber-100 text-amber-700"     },
]

export const MOCK_TEAMS: Team[] = [
  {
    id: "team-1",
    name: "Équipe NLP Francophone",
    description: "Spécialisée dans le texte et les entités nommées",
    createdAt: "2026-01-10",
    datasetIds: ["d1", "d3", "d4"],
    members: [
      { collaborator: MOCK_ALL_COLLABORATORS[0], role: MOCK_ROLES[0], joinedAt: "2026-01-10", annotations: 2840, lastActive: "Il y a 5 min" },
      { collaborator: MOCK_ALL_COLLABORATORS[1], role: MOCK_ROLES[1], joinedAt: "2026-01-15", annotations: 1120, lastActive: "Il y a 2h"    },
      { collaborator: MOCK_ALL_COLLABORATORS[2], role: MOCK_ROLES[0], joinedAt: "2026-02-01", annotations: 3200, lastActive: "Hier"         },
    ],
  },
  {
    id: "team-2",
    name: "Équipe Vision & Audio",
    description: "Images, bounding boxes et transcriptions audio",
    createdAt: "2026-02-05",
    datasetIds: ["d2", "d5"],
    members: [
      { collaborator: MOCK_ALL_COLLABORATORS[3], role: MOCK_ROLES[1], joinedAt: "2026-02-10", annotations: 980,  lastActive: "Il y a 1j" },
      { collaborator: MOCK_ALL_COLLABORATORS[4], role: MOCK_ROLES[0], joinedAt: "2026-02-15", annotations: 560,  lastActive: "Il y a 3j" },
    ],
  },
]

export const MOCK_PENDING: PendingInvite[] = [
  { id: "p1", email: "grace.kone@mail.com",  sentAt: "Il y a 2j" },
  { id: "p2", email: "serge.akpo@mail.com",  sentAt: "Il y a 5j" },
]