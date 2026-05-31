"use client"

// components/datasets/jobAssignmentConfigurator.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Info, Check, AlertCircle, Shuffle, ListOrdered,
  UserPlus, ShieldCheck, PenLine, Building2,
  RotateCcw, ChevronDown, Users, X, AlertTriangle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dataset } from "@/types/datasets"
import type { ElementConfig } from "@/components/datasets/elementConfigurator"
import type {
  AssignmentMode, DistributionMode,
  JobPool, BatchAssignmentOverride,
  ResolvedBatchAssignment, ReviewMode,
} from "@/types/annotation"
import { distributePool, poolIsValid } from "@/types/annotation"
import type { User } from "@/types/user"
import type { Team } from "@/types/team"
import type { DatasetRole } from "@/types/datasets"

export const DEFAULT_BATCH_SIZE = 200

export interface JobAssignmentConfig {
  batchCount:          number
  batchSize:           number
  distributionMode:    DistributionMode
  pool:                JobPool
  batchOverrides:      BatchAssignmentOverride[]
  resolvedAssignments: ResolvedBatchAssignment[]
  isSubmittable:       boolean
}

export interface JobAssignmentConfiguratorProps {
  dataset:         Dataset
  elementConfigs:  ElementConfig[]
  currentUserId:   string
  allUsers:        UserWithSource[]
  allTeams:        Team[]
  batchSize?:      number
  persistKey?:     string
  onConfigChange:  (config: JobAssignmentConfig | null) => void
  onManageAccess?: () => void
  className?:      string
}

export interface UserWithSource {
  user:          User
  datasetRole?:  DatasetRole
  viaTeamName?:  string
  isDirect:      boolean
}

interface PoolDraft {
  mode:         AssignmentMode
  annotatorIds: string[]
  teamIds:      string[]
  reviewerId:   string | null
  reviewMode:   ReviewMode
}

function poolDraftToJobPool(p: PoolDraft): JobPool {
  return {
    mode:         p.mode,
    annotatorIds: p.mode === 'individuals' ? p.annotatorIds : [],
    teamIds:      p.mode === 'teams'       ? p.teamIds      : [],
    reviewerId:   p.mode === 'individuals' ? (p.reviewerId ?? undefined) : undefined,
    reviewMode:   p.mode === 'individuals' ? p.reviewMode : 'none',
  }
}

function draftIsValid(p: PoolDraft): boolean {
  return poolIsValid(poolDraftToJobPool(p))
}

function makeDefaultDraft(currentUserId: string): PoolDraft {
  return {
    mode: 'individuals', annotatorIds: [currentUserId],
    teamIds: [], reviewerId: null, reviewMode: 'none',
  }
}

interface OverrideDraft {
  annotatorId: string | null
  teamId:      string | null
  reviewerId:  string | null
  reviewMode:  ReviewMode
}

function resolvedToOverrideDraft(r: ResolvedBatchAssignment): OverrideDraft {
  return {
    annotatorId: r.annotatorId ?? null,
    teamId:      r.teamId      ?? null,
    reviewerId:  r.reviewerId  ?? null,
    reviewMode:  r.reviewMode,
  }
}

function overrideDraftToBatchOverride(batchIndex: number, d: OverrideDraft): BatchAssignmentOverride {
  return {
    batchIndex,
    annotatorId: d.annotatorId ?? undefined,
    teamId:      d.teamId      ?? undefined,
    reviewerId:  d.reviewerId  ?? undefined,
    reviewMode:  d.reviewMode,
  }
}

function usePersistedOverrides(
  key: string | undefined,
  batchCount: number,
): [Record<number, OverrideDraft>, React.Dispatch<React.SetStateAction<Record<number, OverrideDraft>>>] {
  const [overrides, setOverrides] = useState<Record<number, OverrideDraft>>(() => {
    if (!key || typeof window === 'undefined') return {}
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<number, OverrideDraft>
      const cleaned: Record<number, OverrideDraft> = {}
      for (const [k, v] of Object.entries(parsed)) {
        if (Number(k) <= batchCount) cleaned[Number(k)] = v
      }
      return cleaned
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (!key || typeof window === 'undefined') return
    try {
      if (Object.keys(overrides).length === 0) {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, JSON.stringify(overrides))
      }
    } catch {}
  }, [key, overrides])

  return [overrides, setOverrides]
}

const SLOT_COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#f43f5e','#8b5cf6','#06b6d4','#84cc16']
function slotColor(index: number) { return SLOT_COLORS[index % SLOT_COLORS.length] }

function InitialAvatar({ name, color, size = 'sm' }: {
  name: string; color?: string; size?: 'xs' | 'sm' | 'md'
}) {
  const cls = size === 'xs' ? 'h-4 w-4 text-[8px]' : size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-xs'
  return (
    <div className={cn(cls, "shrink-0 rounded-full flex items-center justify-center font-bold text-white")}
      style={{ backgroundColor: color ?? '#6366f1' }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function TeamBadge({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const cls  = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  const icon = size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className={cn(cls, "shrink-0 rounded-full bg-primary/10 flex items-center justify-center")}>
      <Building2 className={cn(icon, "text-primary/60")} />
    </div>
  )
}

function AccessSourceBadge({ isDirect, viaTeamName, datasetRole }: {
  isDirect: boolean; viaTeamName?: string; datasetRole?: DatasetRole
}) {
  const parts: string[] = []
  if (viaTeamName) parts.push(`via ${viaTeamName}`)
  if (isDirect && datasetRole) {
    parts.push(
      datasetRole === 'reviewer' ? 'relecteur' :
      datasetRole === 'admin'    ? 'admin'      :
                                   'contributeur'
    )
  }
  if (parts.length === 0) return null
  return (
    <span className="text-[10px] text-muted-foreground/60 truncate">
      {parts.join(' · ')}
    </span>
  )
}

// ─── ModeSwitch ───────────────────────────────────────────────────────────────

function ModeSwitch({ value, onChange, hasTeams }: {
  value: AssignmentMode; onChange: (m: AssignmentMode) => void; hasTeams: boolean
}) {
  const opts: { id: AssignmentMode; label: string; icon: LucideIcon }[] = [
    { id: 'individuals', label: 'Personnes', icon: PenLine   },
    { id: 'teams',       label: 'Équipes',   icon: Building2 },
  ]
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-muted/20 p-1 w-fit">
      {opts.map(opt => {
        const Icon     = opt.icon
        const active   = value === opt.id
        const disabled = opt.id === 'teams' && !hasTeams
        return (
          <button key={opt.id} type="button" disabled={disabled}
            onClick={() => !disabled && onChange(opt.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              active   && "bg-background shadow-sm text-foreground",
              !active  && !disabled && "text-muted-foreground hover:text-foreground",
              disabled && "text-muted-foreground/30 cursor-not-allowed",
            )}>
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
            {disabled && <span className="text-[9px] ml-0.5 opacity-60">(aucune équipe)</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── IndividualsPoolSelector ──────────────────────────────────────────────────

function IndividualsPoolSelector({ pool, usersWithSource, currentUserId, onManageAccess, onChange }: {
  pool:            PoolDraft
  usersWithSource: UserWithSource[]
  currentUserId:   string
  onManageAccess?: () => void
  onChange:        (p: PoolDraft) => void
}) {
  const toggleAnnotator = (userId: string) => {
    const next       = pool.annotatorIds.includes(userId)
      ? pool.annotatorIds.filter(x => x !== userId)
      : [...pool.annotatorIds, userId]
    const reviewerId = pool.reviewerId === userId ? null : pool.reviewerId
    onChange({ ...pool, annotatorIds: next, reviewerId, reviewMode: reviewerId ? pool.reviewMode : 'none' })
  }

  const setReviewer = (userId: string | null) =>
    onChange({ ...pool, reviewerId: userId, reviewMode: userId ? 'all' : 'none' })

  const reviewerCandidates = usersWithSource.filter(
    ({ user }) => !pool.annotatorIds.includes(user.id) && user.id !== currentUserId
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Contributeurs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Contributeurs
          </p>
          {onManageAccess && (
            <button type="button" onClick={onManageAccess}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">
              <UserPlus className="h-3 w-3" />Gérer l'accès
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {usersWithSource.map(({ user, isDirect, viaTeamName, datasetRole }, i) => {
            const selected   = pool.annotatorIds.includes(user.id)
            const isReviewer = pool.reviewerId === user.id
            return (
              <button key={user.id} type="button" disabled={isReviewer}
                onClick={() => !isReviewer && toggleAnnotator(user.id)}
                title={isReviewer ? "Déjà assigné comme relecteur" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left",
                  selected  && !isReviewer && "border-primary/40 bg-primary/5",
                  !selected && !isReviewer && "hover:border-primary/20 hover:bg-muted/20",
                  isReviewer && "opacity-40 cursor-not-allowed",
                )}>
                <InitialAvatar name={user.name} color={slotColor(i)} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.id === currentUserId ? `${user.name} (vous)` : user.name}
                  </p>
                  <AccessSourceBadge isDirect={isDirect} viaTeamName={viaTeamName} datasetRole={datasetRole} />
                </div>
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  selected && !isReviewer ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {selected && !isReviewer && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Relecteur */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Relecteur <span className="text-muted-foreground/50 normal-case font-normal">— optionnel</span>
        </p>
        <p className="text-[11px] text-muted-foreground/60 mb-2 leading-relaxed">
          Relit tout le travail soumis. Ne peut pas faire partie des contributeurs, ni être vous-même.
        </p>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setReviewer(null)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left",
              pool.reviewMode === 'none' ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/20"
            )}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted-foreground/30" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Pas de relecture</p>
              <p className="text-[11px] text-muted-foreground/60">Le travail sera validé automatiquement à la soumission</p>
            </div>
            <div className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              pool.reviewMode === 'none' ? "border-primary" : "border-muted-foreground/30"
            )}>
              {pool.reviewMode === 'none' && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </button>

          {reviewerCandidates.map(({ user, isDirect, viaTeamName, datasetRole }, i) => (
            <button key={user.id} type="button"
              onClick={() => setReviewer(pool.reviewerId === user.id ? null : user.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left",
                pool.reviewerId === user.id ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/20"
              )}>
              <InitialAvatar name={user.name} color={slotColor(pool.annotatorIds.length + i)} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <AccessSourceBadge isDirect={isDirect} viaTeamName={viaTeamName} datasetRole={datasetRole} />
              </div>
              <div className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                pool.reviewerId === user.id ? "border-primary" : "border-muted-foreground/30"
              )}>
                {pool.reviewerId === user.id && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            </button>
          ))}

          {reviewerCandidates.length === 0 && pool.annotatorIds.length > 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-3 rounded-xl border border-dashed">
              Désélectionnez un contributeur pour le désigner relecteur.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TeamsPoolSelector ────────────────────────────────────────────────────────

function TeamsPoolSelector({ pool, availableTeams, onChange }: {
  pool:           PoolDraft
  availableTeams: Team[]
  onChange:       (p: PoolDraft) => void
}) {
  const toggleTeam = (teamId: string) => {
    const next = pool.teamIds.includes(teamId)
      ? pool.teamIds.filter(x => x !== teamId)
      : [...pool.teamIds, teamId]
    onChange({ ...pool, teamIds: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-xl bg-muted/30 border px-3 py-2.5">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          En mode équipes, chaque équipe gère son propre travail en interne — contributeurs, relecture, validation.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {availableTeams.map(team => {
          const selected     = pool.teamIds.includes(team.id)
          const memberCount  = team.members?.length ?? 0
          const hasNoMembers = memberCount === 0
          return (
            <button key={team.id} type="button" onClick={() => toggleTeam(team.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left",
                selected && !hasNoMembers && "border-primary/40 bg-primary/5",
                !selected && "hover:border-primary/20 hover:bg-muted/20",
                hasNoMembers && "opacity-60",
              )}>
              <div className={cn(
                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center",
                selected ? "bg-primary/10" : "bg-muted"
              )}>
                <Building2 className={cn("h-4 w-4", selected ? "text-primary/70" : "text-muted-foreground/50")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{team.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {memberCount} membre{memberCount !== 1 ? "s" : ""}
                  {hasNoMembers && (
                    <span className="ml-1.5 text-amber-600 dark:text-amber-400">— aucun membre</span>
                  )}
                </p>
              </div>
              {hasNoMembers ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              ) : (
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {selected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── RowAccordion ─────────────────────────────────────────────────────────────

interface RowAccordionProps {
  mode:           AssignmentMode
  draft:          OverrideDraft
  allUsers:       User[]
  availableTeams: Team[]
  currentUserId:  string
  isOverride:     boolean
  onChangeDraft:  (d: OverrideDraft) => void
  onReset:        () => void
  onClose:        () => void
}

function RowAccordion({
  mode, draft, allUsers, availableTeams, currentUserId,
  isOverride, onChangeDraft, onReset, onClose,
}: RowAccordionProps) {
  const colSpan       = mode === 'individuals' ? 5 : 4
  const reviewerCands = mode === 'individuals'
    ? allUsers.filter(u => u.id !== draft.annotatorId && u.id !== currentUserId)
    : []

  return (
    <tr className="bg-muted/5">
      <td colSpan={colSpan} className="px-4 pb-4 pt-2">
        <div className="rounded-xl border border-primary/20 bg-background p-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Changer l'assignation</p>
            <div className="flex items-center gap-2">
              {isOverride && (
                <button type="button" onClick={onReset}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-1">
                  <RotateCcw className="h-3 w-3" />Réinitialiser
                </button>
              )}
              <button type="button" onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={cn("grid gap-5", mode === 'individuals' ? "grid-cols-2" : "grid-cols-1")}>
            {/* Contributeur / Équipe */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {mode === 'individuals' ? 'Contributeur' : 'Équipe'}
              </p>
              <div className="flex flex-col gap-1.5">
                {mode === 'individuals'
                  ? allUsers.map((user, i) => {
                      const selected = draft.annotatorId === user.id
                      const disabled = draft.reviewerId === user.id
                      return (
                        <button key={user.id} type="button" disabled={disabled}
                          onClick={() => !disabled && onChangeDraft({ ...draft, annotatorId: user.id, teamId: null })}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all text-left",
                            selected  && !disabled && "border-primary/40 bg-primary/5",
                            !selected && !disabled && "hover:border-primary/20 hover:bg-muted/20",
                            disabled  && "opacity-40 cursor-not-allowed",
                          )}>
                          <InitialAvatar name={user.name} color={slotColor(i)} size="sm" />
                          <p className="flex-1 text-xs font-medium truncate">
                            {user.id === currentUserId ? `${user.name} (vous)` : user.name}
                          </p>
                          <div className={cn(
                            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            selected && !disabled ? "border-primary" : "border-muted-foreground/30"
                          )}>
                            {selected && !disabled && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </div>
                        </button>
                      )
                    })
                  : availableTeams.map(team => {
                      const selected = draft.teamId === team.id
                      return (
                        <button key={team.id} type="button"
                          onClick={() => onChangeDraft({ ...draft, teamId: team.id, annotatorId: null })}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all text-left",
                            selected ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/20"
                          )}>
                          <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="flex-1 text-xs font-medium truncate">{team.name}</p>
                          <div className={cn(
                            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            selected ? "border-primary" : "border-muted-foreground/30"
                          )}>
                            {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </div>
                        </button>
                      )
                    })
                }
              </div>
            </div>

            {/* Relecteur — mode individus uniquement */}
            {mode === 'individuals' && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Relecteur <span className="normal-case font-normal text-muted-foreground/50">— optionnel</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  <button type="button"
                    onClick={() => onChangeDraft({ ...draft, reviewerId: null, reviewMode: 'none' })}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all text-left",
                      draft.reviewMode === 'none' ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/20"
                    )}>
                    <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-muted-foreground/30" />
                    </div>
                    <p className="flex-1 text-xs font-medium text-muted-foreground">Pas de relecture</p>
                    <div className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      draft.reviewMode === 'none' ? "border-primary" : "border-muted-foreground/30"
                    )}>
                      {draft.reviewMode === 'none' && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  </button>

                  {reviewerCands.map((user, i) => (
                    <button key={user.id} type="button"
                      onClick={() => onChangeDraft({ ...draft, reviewerId: user.id, reviewMode: 'all' })}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all text-left",
                        draft.reviewerId === user.id ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/20"
                      )}>
                      <InitialAvatar name={user.name} color={slotColor(allUsers.length + i)} size="sm" />
                      <p className="flex-1 text-xs font-medium truncate">{user.name}</p>
                      <div className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        draft.reviewerId === user.id ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {draft.reviewerId === user.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  ))}

                  {reviewerCands.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60 text-center py-2">
                      Aucun relecteur disponible pour ce groupe.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── AssignmentTable ──────────────────────────────────────────────────────────

interface AssignmentTableProps {
  mode:           AssignmentMode
  assignments:    ResolvedBatchAssignment[]
  overrides:      Record<number, OverrideDraft>
  allUsers:       User[]
  availableTeams: Team[]
  currentUserId:  string
  pool:           PoolDraft
  batchSize:      number
  onSetOverride:  (batchIndex: number, d: OverrideDraft) => void
  onClearOverride:(batchIndex: number) => void
}

function AssignmentTable({
  mode, assignments, overrides, allUsers, availableTeams,
  currentUserId, pool, batchSize, onSetOverride, onClearOverride,
}: AssignmentTableProps) {
  const [openRow, setOpenRow] = useState<number | null>(null)

  const userColorMap = useMemo(() => {
    const m: Record<string, string> = {}
    allUsers.forEach((u, i) => { m[u.id] = slotColor(i) })
    return m
  }, [allUsers])

  const getRowDraft = (a: ResolvedBatchAssignment): OverrideDraft =>
    overrides[a.batchIndex] ?? resolvedToOverrideDraft(a)

  useEffect(() => { setOpenRow(null) }, [pool.mode, pool.annotatorIds.length, pool.teamIds.length])

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-12">#</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Éléments</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {mode === 'individuals' ? 'Contributeur' : 'Équipe'}
            </th>
            {mode === 'individuals' && (
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Relecteur</th>
            )}
            <th className="px-2 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, i) => {
            const isOpen     = openRow === a.batchIndex
            const draft      = getRowDraft(a)
            const isOverride = !!overrides[a.batchIndex]
            const user       = draft.annotatorId ? allUsers.find(u => u.id === draft.annotatorId) : null
            const reviewer   = draft.reviewerId  ? allUsers.find(u => u.id === draft.reviewerId)  : null
            const team       = draft.teamId      ? availableTeams.find(t => t.id === draft.teamId) : null
            const isOrphan   = isOverride && (
              (draft.annotatorId && !allUsers.find(u => u.id === draft.annotatorId)) ||
              (draft.teamId      && !availableTeams.find(t => t.id === draft.teamId))
            )

            const rangeStart = (i * batchSize + 1).toLocaleString("fr-FR")
            const rangeEnd   = Math.min((i + 1) * batchSize, assignments.length * batchSize).toLocaleString("fr-FR")

            return (
              <React.Fragment key={a.batchIndex}>
                <tr
                  onClick={() => setOpenRow(prev => prev === a.batchIndex ? null : a.batchIndex)}
                  className={cn(
                    "border-b cursor-pointer transition-colors",
                    isOpen     && "bg-primary/5",
                    isOverride && !isOpen && !isOrphan && "bg-amber-50/40 dark:bg-amber-900/5",
                    isOrphan   && "bg-red-50/40 dark:bg-red-900/5",
                    !isOpen    && !isOverride && "hover:bg-muted/20",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
                      isOrphan   ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      isOverride ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                   "bg-muted text-muted-foreground"
                    )}>
                      {a.batchIndex}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">{rangeStart} – {rangeEnd}</p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isOrphan ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />Assignation invalide
                        </span>
                      ) : team ? (
                        <><TeamBadge size="sm" /><span className="text-xs font-medium truncate max-w-30">{team.name}</span></>
                      ) : user ? (
                        <><InitialAvatar name={user.name} color={userColorMap[user.id]} size="sm" />
                          <span className="text-xs font-medium truncate max-w-30">
                            {user.id === currentUserId ? `${user.name.split(' ')[0]} (vous)` : user.name.split(' ')[0]}
                          </span></>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Non assigné</span>
                      )}
                      {isOverride && !isOrphan && (
                        <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">✎</span>
                      )}
                    </div>
                  </td>

                  {mode === 'individuals' && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {reviewer ? (
                          <><InitialAvatar name={reviewer.name} color={userColorMap[reviewer.id] ?? '#64748b'} size="sm" />
                            <span className="text-xs text-muted-foreground truncate max-w-20">{reviewer.name.split(' ')[0]}</span></>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40">Aucun</span>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="px-2 py-3">
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground/40 transition-transform",
                      isOpen && "rotate-180"
                    )} />
                  </td>
                </tr>

                {isOpen && (
                  <RowAccordion
                    mode={mode}
                    draft={draft}
                    allUsers={allUsers}
                    availableTeams={availableTeams}
                    currentUserId={currentUserId}
                    isOverride={isOverride}
                    onChangeDraft={d => onSetOverride(a.batchIndex, d)}
                    onReset={() => { onClearOverride(a.batchIndex); setOpenRow(null) }}
                    onClose={() => setOpenRow(null)}
                  />
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── DistributionToggle ───────────────────────────────────────────────────────

function DistributionToggle({ value, onChange }: {
  value: DistributionMode; onChange: (v: DistributionMode) => void
}) {
  const opts: { id: DistributionMode; label: string; icon: LucideIcon }[] = [
    { id: 'sequential', label: "Dans l'ordre", icon: ListOrdered },
    { id: 'random',     label: 'Au hasard',    icon: Shuffle     },
  ]
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-muted/20 p-1 w-fit">
      {opts.map(opt => {
        const Icon = opt.icon
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              value === opt.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="h-3.5 w-3.5" />{opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function JobAssignmentConfigurator({
  elementConfigs,
  currentUserId,
  allUsers,
  allTeams,
  batchSize = DEFAULT_BATCH_SIZE,
  persistKey,
  onConfigChange,
  onManageAccess,
  className,
}: JobAssignmentConfiguratorProps) {
  const includedCount = elementConfigs.filter(c => c.include).length
  const batchCount    = Math.max(1, Math.ceil(includedCount / batchSize))

  const availableTeams  = allTeams
  const hasTeams        = availableTeams.length > 0
  const usersWithSource = allUsers
  const rawUsers        = useMemo(() => allUsers.map(x => x.user), [allUsers])

  const [distributionMode, setDistributionMode] = useState<DistributionMode>('sequential')
  const [pool, setPool] = useState<PoolDraft>(() => makeDefaultDraft(currentUserId))
  const [overrides, setOverrides] = usePersistedOverrides(persistKey, batchCount)

  const handleModeChange = (mode: AssignmentMode) => {
    setPool({
      mode,
      annotatorIds: mode === 'individuals' ? [currentUserId] : [],
      teamIds:      [],
      reviewerId:   null,
      reviewMode:   'none',
    })
    setOverrides({})
  }

  const setOverride   = useCallback((bi: number, d: OverrideDraft) =>
    setOverrides(prev => ({ ...prev, [bi]: d })), [setOverrides])

  const clearOverride = useCallback((bi: number) =>
    setOverrides(prev => { const n = { ...prev }; delete n[bi]; return n }), [setOverrides])

  useEffect(() => {
    setOverrides(prev => {
      const next    = { ...prev }
      let changed   = false
      for (const k of Object.keys(next)) {
        if (Number(k) > batchCount) { delete next[Number(k)]; changed = true }
      }
      return changed ? next : prev
    })
  }, [batchCount, setOverrides])

  const batchOverrides = useMemo<BatchAssignmentOverride[]>(() =>
    Object.entries(overrides).map(([idx, d]) => overrideDraftToBatchOverride(Number(idx), d)),
    [overrides]
  )

  const jobPool = useMemo(() => poolDraftToJobPool(pool), [pool])

  const resolvedAssignments = useMemo<ResolvedBatchAssignment[]>(() => {
    if (!draftIsValid(pool)) return []
    return distributePool(jobPool, batchCount, batchOverrides)
  }, [pool, jobPool, batchCount, batchOverrides])

  const isValid = draftIsValid(pool)

  const orphanCount = useMemo(() =>
    Object.values(overrides).filter(d =>
      (d.annotatorId && !rawUsers.find(u => u.id === d.annotatorId)) ||
      (d.teamId      && !availableTeams.find(t => t.id === d.teamId))
    ).length,
    [overrides, rawUsers, availableTeams]
  )

  const overrideCount = Object.keys(overrides).length
  const isSubmittable = isValid && orphanCount === 0

  useEffect(() => {
    if (!isValid) { onConfigChange(null); return }
    onConfigChange({
      batchCount,
      batchSize,
      distributionMode,
      pool:                jobPool,
      batchOverrides,
      resolvedAssignments,
      isSubmittable,
    })
  }, [pool, jobPool, batchOverrides, resolvedAssignments, distributionMode,
      batchCount, batchSize, isValid, isSubmittable, onConfigChange])

  const hasNoResources = usersWithSource.length <= 1 && !hasTeams

  return (
    <div className={cn("flex flex-col gap-8", className)}>

      {/* Résumé éléments */}
      <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{includedCount} éléments à traiter</strong>{" "}
          répartis en{" "}
          <strong className="text-foreground">{batchCount} groupe{batchCount !== 1 ? "s" : ""}</strong>{" "}
          de {batchSize} au maximum.
        </p>
      </div>

      {/* Alerte aucun collaborateur */}
      {hasNoResources && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Personne n'a encore accès à ce projet</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Invitez des personnes ou ajoutez une équipe pour pouvoir leur assigner du travail.
              </p>
            </div>
          </div>
          {onManageAccess && (
            <button type="button" onClick={onManageAccess}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400
                hover:text-amber-800 border border-amber-300 dark:border-amber-700
                rounded-lg px-3 py-1.5 transition-colors hover:bg-amber-100 w-fit">
              <UserPlus className="h-3.5 w-3.5" />Gérer l'accès au projet
            </button>
          )}
        </div>
      )}

      {/* Alerte overrides orphelins */}
      {orphanCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {orphanCount} groupe{orphanCount > 1 ? "s" : ""} avec un problème d'assignation
            </p>
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
              Les personnes assignées ont changé. Corrigez ou réinitialisez ces groupes avant de continuer.
            </p>
          </div>
          <button type="button" onClick={() => setOverrides({})}
            className="flex items-center gap-1 text-[11px] font-medium text-red-700 dark:text-red-400 hover:text-red-800 transition-colors shrink-0">
            <RotateCcw className="h-3 w-3" />Tout réinitialiser
          </button>
        </div>
      )}

      {/* 1 — Qui travaille ? */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">Qui travaille sur ce projet ?</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Choisissez si vous assignez des personnes individuellement ou par équipe.
          </p>
        </div>
        <ModeSwitch value={pool.mode} onChange={handleModeChange} hasTeams={hasTeams} />
        <div className="flex items-start gap-2 rounded-xl bg-muted/30 border px-3 py-2.5">
          {pool.mode === 'individuals'
            ? <><PenLine className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Chaque personne reçoit des éléments à traiter. Vous pouvez aussi désigner quelqu'un pour relire le travail.
                </p></>
            : <><Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Chaque équipe reçoit une partie du travail et organise sa propre relecture en interne.
                </p></>
          }
        </div>
      </div>

      {/* 2 — Personnes impliquées */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Personnes impliquées</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {pool.mode === 'individuals'
                ? "Choisissez qui va traiter les éléments, et si quelqu'un doit relire le travail."
                : "Choisissez les équipes qui participeront."}
            </p>
          </div>
          {onManageAccess && (
            <button type="button" onClick={onManageAccess}
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary
                transition-colors border border-border rounded-lg px-2.5 py-1 hover:border-primary/30 shrink-0">
              <Users className="h-3 w-3" />Gérer l'accès
            </button>
          )}
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/2 px-4 py-4">
          {pool.mode === 'individuals' ? (
            <IndividualsPoolSelector
              pool={pool}
              usersWithSource={usersWithSource}
              currentUserId={currentUserId}
              onManageAccess={onManageAccess}
              onChange={setPool}
            />
          ) : (
            <TeamsPoolSelector pool={pool} availableTeams={availableTeams} onChange={setPool} />
          )}
        </div>
      </div>

      {/* 3 — Ordre des éléments */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Dans quel ordre traiter les éléments ?</p>
        <DistributionToggle value={distributionMode} onChange={setDistributionMode} />
      </div>

      {/* 4 — Répartition du travail */}
      {isValid && batchCount > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Répartition du travail</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cliquez sur une ligne pour changer qui s'en occupe.
                {overrideCount > 0 && orphanCount === 0 && (
                  <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    {overrideCount} modifié{overrideCount !== 1 ? "s" : ""} ✎
                  </span>
                )}
              </p>
            </div>
            {overrideCount > 0 && (
              <button type="button" onClick={() => setOverrides({})}
                className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground
                  hover:text-foreground border border-border rounded-lg px-2.5 py-1 transition-colors shrink-0">
                <RotateCcw className="h-3 w-3" />Tout réinitialiser
              </button>
            )}
          </div>
          <AssignmentTable
            mode={pool.mode}
            assignments={resolvedAssignments}
            overrides={overrides}
            allUsers={rawUsers}
            availableTeams={availableTeams}
            currentUserId={currentUserId}
            pool={pool}
            batchSize={batchSize}
            onSetOverride={setOverride}
            onClearOverride={clearOverride}
          />
        </div>
      )}

      {/* Validation */}
      {!isValid && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {pool.mode === 'individuals'
            ? "Choisissez au moins une personne pour continuer."
            : "Choisissez au moins une équipe pour continuer."
          }
        </p>
      )}
    </div>
  )
}