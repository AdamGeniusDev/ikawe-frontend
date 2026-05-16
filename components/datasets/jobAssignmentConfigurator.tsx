"use client"

// components/datasets/jobAssignmentConfigurator.tsx
// Sources : MOCK_USERS + MOCK_TEAMS depuis @/constants/mock-data (IDs "usr_xxx")
// PAS d'import depuis @/types/team (IDs incompatibles "c1, c2...")

import { useState, useEffect, useCallback } from "react"
import {
  Users, ChevronDown, ChevronUp,
  Info, Check, AlertCircle, Layers,
  Shuffle, ListOrdered,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dataset } from "@/types/datasets"
import { ElementConfig } from "@/components/datasets/elementConfigurator"
import { BatchAssignment } from "@/types/annotation"
import {
  MOCK_USERS, MOCK_TEAMS,
  MockUser, MockTeam,
  getUserById,
} from "@/constants/mock-data"

export const BATCH_SIZE = 200

export type DistributionMode = 'sequential' | 'random'

export interface JobAssignmentConfig {
  batchCount:       number
  batchSize:        number
  distributionMode: DistributionMode
  assignments:      BatchAssignment[]
}

export interface JobAssignmentConfiguratorProps {
  dataset:        Dataset
  elementConfigs: ElementConfig[]
  currentUserId:  string
  onConfigChange: (config: JobAssignmentConfig | null) => void
  className?:     string
}

interface BatchDraft {
  batchIndex:   number
  teamId:       string | null
  userIds:      string[]
  selfIncluded: boolean
}

function draftIsValid(d: BatchDraft): boolean {
  return d.selfIncluded || !!d.teamId || d.userIds.length > 0
}

// ─── DistributionToggle ───────────────────────

function DistributionToggle({ value, onChange }: {
  value: DistributionMode; onChange: (v: DistributionMode) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-muted/20 p-1 w-fit">
      {(["sequential", "random"] as DistributionMode[]).map(mode => (
        <button key={mode} type="button" onClick={() => onChange(mode)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            value === mode
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}>
          {mode === "sequential" ? <ListOrdered className="h-3.5 w-3.5" /> : <Shuffle className="h-3.5 w-3.5" />}
          {mode === "sequential" ? "Séquentiel" : "Aléatoire"}
        </button>
      ))}
    </div>
  )
}

// ─── BatchAssignCard ──────────────────────────

function BatchAssignCard({
  draft, batchCount, teams, collaborators, currentUser, onChange,
}: {
  draft: BatchDraft; batchCount: number; teams: MockTeam[]
  collaborators: MockUser[]; currentUser: MockUser
  onChange: (updated: BatchDraft) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const isValid      = draftIsValid(draft)
  const selectedTeam = teams.find(t => t.id === draft.teamId)

  const summaryParts = [
    draft.selfIncluded ? "Moi" : null,
    selectedTeam?.name ?? null,
    draft.userIds.length > 0 ? `${draft.userIds.length} individu${draft.userIds.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean)

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isValid ? "border-primary/30 bg-primary/2" : "border-border bg-background"
    )}>
      <button type="button" onClick={() => setExpanded(p => !p)}
        className="flex w-full items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
            isValid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {draft.batchIndex}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">
              Groupe {draft.batchIndex}
              {batchCount > 1 && <span className="text-muted-foreground font-normal ml-1">/ {batchCount}</span>}
            </p>
            <p className={cn("text-[11px] mt-0.5", isValid ? "text-primary/80" : "text-muted-foreground")}>
              {isValid ? summaryParts.join(" · ") : "Aucun annotateur assigné"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isValid && <Check className="h-4 w-4 text-primary" />}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border/50 px-4 pb-4 pt-3">

          {/* Moi-même */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Moi-même</p>
            <button type="button" onClick={() => onChange({ ...draft, selfIncluded: !draft.selfIncluded })}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                draft.selfIncluded ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20 hover:bg-muted/20"
              )}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: currentUser.avatarColor }}>
                {currentUser.avatarInitials}
              </div>
              <span className="flex-1 text-left text-sm font-medium">{currentUser.name}</span>
              <div className={cn(
                "relative h-4 w-4 shrink-0 rounded-full border-2 transition-all",
                draft.selfIncluded ? "border-primary bg-primary" : "border-muted-foreground/30"
              )}>
                {draft.selfIncluded && <div className="absolute inset-0.5 rounded-full bg-white" />}
              </div>
            </button>
          </div>

          {/* Équipes */}
          {teams.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Équipes</p>
              <div className="flex flex-col gap-2">
                {teams.map(team => {
                  const isSel = draft.teamId === team.id
                  return (
                    <button key={team.id} type="button"
                      onClick={() => onChange({ ...draft, teamId: isSel ? null : team.id })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                        isSel ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20 hover:bg-muted/20"
                      )}>
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        isSel ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{team.name}</p>
                        <p className="text-[11px] text-muted-foreground">{team.memberIds.length} membres</p>
                      </div>
                      <div className={cn(
                        "relative h-4 w-4 shrink-0 rounded-full border-2 transition-all",
                        isSel ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {isSel && <div className="absolute inset-0.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individus */}
          {collaborators.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Individus</p>
              <div className="flex flex-col gap-1.5">
                {collaborators.map(user => {
                  const isSel = draft.userIds.includes(user.id)
                  const next  = isSel
                    ? draft.userIds.filter(x => x !== user.id)
                    : [...draft.userIds, user.id]
                  return (
                    <button key={user.id} type="button"
                      onClick={() => onChange({ ...draft, userIds: next })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2 transition-all",
                        isSel ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20 hover:bg-muted/20"
                      )}>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: user.avatarColor }}>
                        {user.avatarInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[11px] capitalize text-muted-foreground">{user.role}</p>
                      </div>
                      <div className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                        isSel ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {isSel && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {teams.length === 0 && collaborators.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Aucun collaborateur sur ce dataset. Seul "Moi-même" est disponible.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────

export function JobAssignmentConfigurator({
  dataset, elementConfigs, currentUserId, onConfigChange, className,
}: JobAssignmentConfiguratorProps) {
  const includedCount = elementConfigs.filter(c => c.include).length
  const batchCount    = Math.max(1, Math.ceil(includedCount / BATCH_SIZE))
  const lastBatchSize = includedCount % BATCH_SIZE || BATCH_SIZE

  // Membres du dataset (IDs "usr_xxx") → résoudre depuis MOCK_USERS
  const datasetMemberIds = dataset.members.map(m => m.userId)
  const collaborators    = MOCK_USERS.filter(
    u => datasetMemberIds.includes(u.id) && u.id !== currentUserId
  )
  const availableTeams = MOCK_TEAMS.filter(
    t => t.memberIds.some(id => datasetMemberIds.includes(id))
  )
  const currentUser = getUserById(currentUserId) ?? MOCK_USERS[0]

  const [distributionMode, setDistributionMode] = useState<DistributionMode>("sequential")
  const [drafts, setDrafts] = useState<BatchDraft[]>(() =>
    Array.from({ length: batchCount }, (_, i) => ({
      batchIndex: i + 1, teamId: null, userIds: [], selfIncluded: true,
    }))
  )

  useEffect(() => {
    setDrafts(Array.from({ length: batchCount }, (_, i) => ({
      batchIndex: i + 1, teamId: null, userIds: [], selfIncluded: true,
    })))
  }, [batchCount])

  const updateDraft = useCallback((updated: BatchDraft) => {
    setDrafts(prev => prev.map(d => d.batchIndex === updated.batchIndex ? updated : d))
  }, [])

  useEffect(() => {
    if (!drafts.every(draftIsValid)) { onConfigChange(null); return }
    onConfigChange({
      batchCount,
      batchSize: BATCH_SIZE,
      distributionMode,
      assignments: drafts.map(d => ({
        batchIndex: d.batchIndex,
        scope:      'batch' as const,
        teamId:     d.teamId ?? undefined,
        userIds:    [...(d.selfIncluded ? [currentUserId] : []), ...d.userIds],
      })),
    })
  }, [drafts, distributionMode, batchCount, currentUserId, onConfigChange])

  const allValid = drafts.every(draftIsValid)

  return (
    <div className={cn("flex flex-col gap-6", className)}>

      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{includedCount} éléments</strong> répartis en{" "}
          <strong className="text-foreground">{batchCount} groupe{batchCount > 1 ? "s" : ""}</strong>
          {batchCount > 1 && (
            <> de {BATCH_SIZE} éléments max
              {lastBatchSize !== BATCH_SIZE && (
                <span className="text-muted-foreground/70"> (dernier : {lastBatchSize})</span>
              )}
            </>
          )}
          . Assignez chaque groupe à un ou plusieurs annotateurs.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Ordre de distribution</p>
        <DistributionToggle value={distributionMode} onChange={setDistributionMode} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Groupes à assigner
          </p>
          {allValid && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Check className="h-3 w-3" />Tous les groupes assignés
            </span>
          )}
        </div>

        {drafts.map(draft => (
          <BatchAssignCard
            key={draft.batchIndex}
            draft={draft}
            batchCount={batchCount}
            teams={availableTeams}
            collaborators={collaborators}
            currentUser={currentUser}
            onChange={updateDraft}
          />
        ))}
      </div>

      {!allValid && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Chaque groupe doit avoir au moins un annotateur assigné pour continuer
        </p>
      )}
    </div>
  )
}