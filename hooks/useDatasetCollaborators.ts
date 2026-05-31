// hooks/useDatasetCollaborators.ts
//
// Résout les collaborateurs d'un dataset avec déduplication et enrichissement.
// Remplace les appels directs à MOCK_USERS / MOCK_TEAMS dans le configurateur.
//
// Usage :
//   const { users, teams, isLoading } = useDatasetCollaborators(dataset, currentUserId)
//   <JobAssignmentConfigurator allUsers={users} allTeams={teams} ... />

import { useMemo } from "react"
import type { Dataset, DatasetRole } from "@/types/datasets"
import type { User } from "@/types/user"
import type { Team } from "@/types/team"
import type { UserWithSource } from "@/components/datasets/jobAssignmentConfigurator"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatasetCollaboratorsResult {
  /** Users avec source d'accès enrichie — prêts pour allUsers du configurateur */
  users:     UserWithSource[]
  /** Équipes assignées au dataset */
  teams:     Team[]
  isLoading: boolean
  error:     Error | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
//  En prod, remplacer le corps par un vrai appel SWR / React Query :
//
//    const { data, isLoading, error } = useSWR(
//      `/api/datasets/${dataset.id}/collaborators`,
//      fetcher
//    )
//
//  Le fetcher retourne { members: DatasetMember[], teams: Team[] }
//  et ce hook se charge de la déduplication.
//
//  En attendant, on résout depuis dataset.members et dataset.teamAssignments
//  avec les stores locaux injectés en paramètre.

export function useDatasetCollaborators(
  dataset:       Dataset | null,   // null → retourne des tableaux vides
  currentUserId: string,
  // En prod ces deux paramètres disparaissent — remplacés par l'appel API
  allUsersStore: User[],
  allTeamsStore: Team[],
): DatasetCollaboratorsResult {
  const teams = useMemo<Team[]>(() => {
    if (!dataset) return []
    return allTeamsStore.filter(t => dataset.teamAssignments.some(ta => ta.teamId === t.id))
  }, [allTeamsStore, dataset])

  const users = useMemo<UserWithSource[]>(() => {
    if (!dataset) return []
    const seen = new Map<string, UserWithSource>()

    // 1. Owner en premier
    const ownerUser = allUsersStore.find(u => u.id === currentUserId)
    if (ownerUser) {
      seen.set(ownerUser.id, { user: ownerUser, isDirect: true })
    }

    // 2. Membres directs du dataset
    for (const member of dataset.members) {
      const u = allUsersStore.find(x => x.id === member.userId)
      if (!u || u.id === currentUserId) continue

      if (!seen.has(u.id)) {
        seen.set(u.id, {
          user:        u,
          datasetRole: member.role as DatasetRole,
          isDirect:    true,
        })
      } else {
        // Déjà présent via équipe — enrichir avec accès direct
        const existing = seen.get(u.id)!
        seen.set(u.id, {
          ...existing,
          isDirect:    true,
          datasetRole: member.role as DatasetRole,
        })
      }
    }

    // 3. Membres d'équipes assignées
    for (const ta of dataset.teamAssignments) {
      const team = allTeamsStore.find(t => t.id === ta.teamId)
      if (!team) continue

      for (const tm of (team.members ?? [])) {
        const u = allUsersStore.find(x => x.id === tm.userId)
        if (!u || u.id === currentUserId) continue

        if (!seen.has(u.id)) {
          seen.set(u.id, {
            user:        u,
            viaTeamName: team.name,
            isDirect:    false,
          })
        } else {
          // Déjà présent en direct — ajouter mention équipe
          const existing = seen.get(u.id)!
          if (!existing.viaTeamName) {
            seen.set(u.id, { ...existing, viaTeamName: team.name })
          }
        }
      }
    }

    return Array.from(seen.values())
  }, [dataset, currentUserId, allUsersStore, allTeamsStore])

  return { users, teams, isLoading: false, error: null }
}

// ─── Exemple d'utilisation ────────────────────────────────────────────────────
//
//  // Dans la page de création de job :
//  const { users, teams } = useDatasetCollaborators(
//    dataset,
//    currentUser.id,
//    MOCK_USERS,   // ← remplacer par le store Zustand / cache SWR en prod
//    MOCK_TEAMS,
//  )
//
//  <JobAssignmentConfigurator
//    dataset={dataset}
//    elementConfigs={elementConfigs}
//    currentUserId={currentUser.id}
//    allUsers={users}           // UserWithSource[] enrichis
//    allTeams={teams}           // équipes filtrées
//    batchSize={200}            // configurable
//    persistKey={`job-overrides-${dataset.id}`}  // overrides persistés
//    onConfigChange={handleConfigChange}
//    onManageAccess={() => setAccessPanelOpen(true)}
//  />
//
//  // Le bouton de soumission utilise isSubmittable de la config :
//  const [config, setConfig] = useState<JobAssignmentConfig | null>(null)
//
//  <button
//    disabled={!config?.isSubmittable}
//    onClick={handleSubmit}
//  >
//    Créer le job
//  </button>
//
//  // Validation API côté serveur (endpoint POST /api/jobs) :
//  // Vérifier que tous les annotatorIds / teamIds du pool
//  // ont bien accès au dataset au moment de la création.
//  // Ne pas faire confiance à isSubmittable côté client seul.