"use client"

// app/(root)/annotate/new/page.tsx

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CircleCheck, ArrowLeft, Layers } from "lucide-react"

import { DatasetWorkspace }         from "@/components/datasets/dataset-workspace"
import { ElementConfigurator }      from "@/components/datasets/elementConfigurator"
import type { ElementConfig }        from "@/components/datasets/elementConfigurator"
import { AnnotationConfigurator }   from "@/components/datasets/annotationConfigurator"
import type { AnnotationConfig }     from "@/components/datasets/annotationConfigurator"
import {
  JobAssignmentConfigurator,
  DEFAULT_BATCH_SIZE,
} from "@/components/datasets/jobAssignmentConfigurator"
import type { JobAssignmentConfig }  from "@/components/datasets/jobAssignmentConfigurator"
import { DatasetAccessPanel }        from "@/components/datasets/DatasetAccessPanel"
import { useDatasetCollaborators }   from "@/hooks/useDatasetCollaborators"
import {
  Stepper, StepperFooter, StepperIndicator, StepperItem, StepperList,
  StepperNext, StepperPanel, StepperPrevious, StepperSeparator,
  StepperTitle, StepperTrigger,
} from "@/components/ui/stepper"

import { CURRENT_USER, getAccessibleDatasets, MOCK_TEAMS, MOCK_USERS } from "@/constants/mock-data"
import type { Dataset, DatasetRole } from "@/types/datasets"
import type { Team } from "@/types/team"
import type { User } from "@/types/user"

export default function AnnotateNew() {
  const router = useRouter()

  const [step,             setStep]             = useState(0)
  const [selected,         setSelected]         = useState<Dataset | null>(null)
  const [elementConfigs,   setElementConfigs]   = useState<ElementConfig[]>([])
  const [annotationConfig, setAnnotationConfig] = useState<AnnotationConfig | null>(null)
  const [assignmentConfig, setAssignmentConfig] = useState<JobAssignmentConfig | null>(null)
  const [accessSheetOpen,  setAccessSheetOpen]  = useState(false)

  const accessibleDatasets = getAccessibleDatasets(CURRENT_USER.id)
  const includedCount      = elementConfigs.filter(c => c.include).length
  const annotationReady    = annotationConfig !== null
  const assignmentReady    = assignmentConfig?.isSubmittable === true
  const batchCount         = Math.max(1, Math.ceil(includedCount / DEFAULT_BATCH_SIZE))

  const { users: collaborators, teams: assignedTeams } = useDatasetCollaborators(
    selected,
    CURRENT_USER.id,
    MOCK_USERS,
    MOCK_TEAMS,
  )

  // ── Sélection dataset ────────────────────────────────────────────────────────
  const handleSelectDataset = useCallback((d: Dataset) => {
    setSelected(prev => prev?.id === d.id ? null : d)
    setElementConfigs([])
    setAnnotationConfig(null)
    setAssignmentConfig(null)
  }, [])

  // ── Mutations membres ────────────────────────────────────────────────────────

  const handleAddMembers = useCallback((users: { user: User; role: DatasetRole }[]) => {
    setSelected(prev => {
      if (!prev) return prev
      const newMembers = users
        .filter(({ user }) => !prev.members.some(m => m.userId === user.id))
        .map(({ user, role }) => ({
          userId:    user.id,
          name:      user.name,
          role,
          grantedAt: new Date().toISOString(),
          grantedBy: CURRENT_USER.id,
        }))
      return { ...prev, members: [...prev.members, ...newMembers] }
    })
  }, [])

  const handleAddMember = useCallback((user: User, role: DatasetRole) => {
    handleAddMembers([{ user, role }])
  }, [handleAddMembers])

  const handleAddTeam = useCallback((team: Team) => {
    setSelected(prev => {
      if (!prev) return prev
      if (prev.teamAssignments.some(ta => ta.teamId === team.id)) return prev
      return {
        ...prev,
        teamAssignments: [
          ...prev.teamAssignments,
          {
            teamId:     team.id,
            teamName:   team.name,
            assignedAt: new Date().toISOString(),
            assignedBy: CURRENT_USER.id,
          },
        ],
      }
    })
  }, [])

  const handleRemoveMember = useCallback((userId: string) => {
    setSelected(prev => prev
      ? { ...prev, members: prev.members.filter(m => m.userId !== userId) }
      : prev
    )
  }, [])

  const handleRemoveTeam = useCallback((teamId: string) => {
    setSelected(prev => prev
      ? { ...prev, teamAssignments: prev.teamAssignments.filter(ta => ta.teamId !== teamId) }
      : prev
    )
  }, [])

  // ── Résumé footer étape 4 ────────────────────────────────────────────────────
  const assignmentSummary = (() => {
    if (!assignmentConfig) return null
    const { pool, batchOverrides, batchCount: bc } = assignmentConfig
    const slotCount     = pool.mode === 'teams' ? pool.teamIds.length : pool.annotatorIds.length
    const overrideCount = batchOverrides.length
    const hasReviewer   = pool.reviewMode === 'all' && !!pool.reviewerId
    return { slotCount, overrideCount, batchCount: bc, hasReviewer, mode: pool.mode }
  })()

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="top-0 z-10 flex w-full px-6 items-center gap-3 py-3 border-b
        bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <button type="button" onClick={() => router.push("/annotate")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground
            hover:text-foreground hover:bg-muted/40 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="font-bold text-[25px]">
            Nouveau <span className="text-secondary">projet</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Configurez un projet d'annotation en 4 étapes
          </p>
        </div>
      </div>

      <Stepper value={step} onValueChange={setStep} className="w-full py-8 px-4">
        <StepperList>
          <StepperItem step={0} canContinue={!!selected}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Choisir le jeu de données</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={1} canContinue={includedCount > 0}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Sélectionner les éléments</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={2} canContinue={annotationReady}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Configurer les tâches</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={3} canContinue={assignmentReady}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Assigner les groupes</StepperTitle>
            </StepperTrigger>
          </StepperItem>
        </StepperList>

        {/* ── Étape 1 — Choisir le jeu de données ──────────────────────────── */}
        <StepperPanel step={0}>
          <DatasetWorkspace
            datasets={accessibleDatasets}
            onSelect={handleSelectDataset}
            selectedId={selected?.id}
          />
          <StepperFooter>
            <span className="max-w-[60%] block">
              {selected && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">Jeu de données sélectionné</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold truncate">
                    {selected.title}
                  </p>
                </div>
              )}
            </span>
            <StepperNext disabled={!selected}>Continuer</StepperNext>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 2 — Sélectionner les éléments ──────────────────────────── */}
        <StepperPanel step={1}>
          {selected && (
            <ElementConfigurator
              dataset={selected}
              onConfigChange={setElementConfigs}
            />
          )}
          <StepperFooter>
            <span className="max-w-[60%] block">
              {includedCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {includedCount} élément{includedCount > 1 ? "s" : ""} sélectionné{includedCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    → {batchCount} groupe{batchCount > 1 ? "s" : ""} de {DEFAULT_BATCH_SIZE} max
                  </p>
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={includedCount === 0}>Continuer</StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 3 — Configurer les tâches ──────────────────────────────── */}
        <StepperPanel step={2}>
          {selected && (
            <AnnotationConfigurator
              dataset={selected}
              elementConfigs={elementConfigs}
              onConfigChange={setAnnotationConfig}
            />
          )}
          <StepperFooter>
            <span className="max-w-[55%] block">
              {annotationConfig && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {annotationConfig.taskName}
                    </p>
                  </div>
                  {annotationConfig.labels.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {annotationConfig.labels.slice(0, 4).map(l => (
                        <span
                          key={l.id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: l.color }}
                        >
                          {l.name}
                        </span>
                      ))}
                      {annotationConfig.labels.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{annotationConfig.labels.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={!annotationReady}>Continuer</StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 4 — Assigner les groupes ───────────────────────────────── */}
        <StepperPanel step={3}>
          {selected && (
            <>
              <JobAssignmentConfigurator
                dataset={selected}
                elementConfigs={elementConfigs}
                currentUserId={CURRENT_USER.id}
                allUsers={collaborators}
                allTeams={assignedTeams}
                batchSize={DEFAULT_BATCH_SIZE}
                persistKey={`job-overrides-${selected.id}`}
                onConfigChange={setAssignmentConfig}
                onManageAccess={() => setAccessSheetOpen(true)}
              />

              <DatasetAccessPanel
                dataset={selected}
                allTeams={MOCK_TEAMS}
                allUsers={MOCK_USERS}
                currentUserId={CURRENT_USER.id}
                onAddMember={handleAddMember}
                onAddMembers={handleAddMembers}
                onAddTeam={handleAddTeam}
                onRemoveMember={handleRemoveMember}
                onRemoveTeam={handleRemoveTeam}
                externalOpen={accessSheetOpen}
                onExternalOpenChange={setAccessSheetOpen}
                headless
              />
            </>
          )}

          <StepperFooter>
            <span className="max-w-[55%] block">
              {assignmentSummary && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {assignmentSummary.batchCount} groupe{assignmentSummary.batchCount > 1 ? "s" : ""} assigné{assignmentSummary.batchCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {assignmentSummary.slotCount}{" "}
                    {assignmentSummary.mode === 'teams' ? "équipe" : "personne"}{assignmentSummary.slotCount > 1 ? "s" : ""}
                    {assignmentSummary.hasReviewer && " · avec relecture"}
                    {assignmentSummary.overrideCount > 0 && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        · {assignmentSummary.overrideCount} modification{assignmentSummary.overrideCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <button
                type="button"
                disabled={!assignmentReady}
                onClick={() => router.push("/annotate")}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold
                  text-primary-foreground hover:bg-primary/90 disabled:opacity-40
                  disabled:cursor-not-allowed transition-colors"
              >
                Lancer le projet
              </button>
            </div>
          </StepperFooter>
        </StepperPanel>

      </Stepper>
    </div>
  )
}