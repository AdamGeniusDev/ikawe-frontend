"use client"

// components/datasets/DatasetAccessPanel.tsx

import { useState, useMemo, useRef, useCallback } from "react"
import {
  Plus, Users, X, Shield, Key,
  Eye, Pencil, CheckCircle2,
  UserPlus, UserX, Search,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

import type { Dataset, DatasetRole } from "@/types/datasets"
import type { Team } from "@/types/team"
import type { User } from "@/types/user"

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<DatasetRole, { label: string; desc: string; icon: LucideIcon }> = {
  viewer:    { label: "Lecteur",    desc: "Consultation seulement",         icon: Eye          },
  annotator: { label: "Annotateur", desc: "Peut annoter les éléments",      icon: Pencil       },
  reviewer:  { label: "Réviseur",   desc: "Valide les annotations",         icon: CheckCircle2 },
  admin:     { label: "Admin",      desc: "Accès complet hors suppression", icon: Shield       },
}

const ROLE_COLORS: Record<DatasetRole, string> = {
  viewer:    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  annotator: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  reviewer:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  admin:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
}

type ActiveSection = "users" | "teams"
export type StagedUser = { user: User; role: DatasetRole }

// ─── Sheet latérale ───────────────────────────────────────────────────────────

function AddAccessSheet({
  open, onClose, dataset, allTeams, allUsers, currentUserId,
  onAddMembers, onAddTeam, onRemoveTeam, onRemoveMember, onUpdateMemberRole,
}: {
  open:                boolean
  onClose:             () => void
  dataset:             Dataset
  allTeams:            Team[]
  allUsers:            User[]
  currentUserId:       string
  onAddMembers:        (users: StagedUser[]) => void
  onAddTeam:           (team: Team) => void
  onRemoveTeam:        (teamId: string) => void
  onRemoveMember:      (userId: string) => void
  onUpdateMemberRole?: (userId: string, role: DatasetRole) => void
}) {
  const [tab,          setTab]          = useState<ActiveSection>("users")
  const [stagedUsers,  setStagedUsers]  = useState<StagedUser[]>([])
  const [defaultRole,  setDefaultRole]  = useState<DatasetRole>("annotator")
  const [userSearch,   setUserSearch]   = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [teamSearch,   setTeamSearch]   = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const existingUserIds = useMemo(() => new Set([
    ...dataset.members.map(m => m.userId),
    ...stagedUsers.map(s => s.user.id),
    currentUserId,
  ]), [dataset.members, stagedUsers, currentUserId])

  const suggestions = useMemo(() =>
    allUsers.filter(u =>
      !existingUserIds.has(u.id) && (
        userSearch.length === 0 ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email?.toLowerCase().includes(userSearch.toLowerCase()) ?? false)
      )
    ).slice(0, 6),
    [allUsers, existingUserIds, userSearch]
  )

  const filteredTeams = useMemo(() =>
    allTeams.filter(t =>
      !dataset.teamAssignments.some(ta => ta.teamId === t.id) &&
      (teamSearch.length === 0 || t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    ),
    [allTeams, dataset.teamAssignments, teamSearch]
  )

  // Membres affichés : dédupliqués, sans currentUser
  const displayedMembers = useMemo(() => {
    const seen = new Set<string>()
    return dataset.members.filter(m => {
      if (m.userId === currentUserId) return false
      if (seen.has(m.userId)) return false
      seen.add(m.userId)
      return true
    })
  }, [dataset.members, currentUserId])

  const memberCount = displayedMembers.length
  const teamCount   = dataset.teamAssignments.length

  const addStaged = useCallback((user: User) => {
    setStagedUsers(prev => [...prev, { user, role: defaultRole }])
    setUserSearch(""); setShowDropdown(false)
    inputRef.current?.focus()
  }, [defaultRole])

  const removeStaged     = (userId: string) => setStagedUsers(prev => prev.filter(s => s.user.id !== userId))
  const updateStagedRole = (userId: string, role: DatasetRole) =>
    setStagedUsers(prev => prev.map(s => s.user.id === userId ? { ...s, role } : s))

  const confirmAdd = () => {
    if (!stagedUsers.length) return
    onAddMembers(stagedUsers)
    setStagedUsers([]); setUserSearch(""); onClose()
  }

  const handleClose = () => {
    setStagedUsers([]); setUserSearch(""); setTeamSearch(""); onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && handleClose()}>
      <SheetContent side="right" className="w-100 p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <SheetTitle className="text-sm">Gérer les accès</SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 shrink-0">
          {(["users", "teams"] as ActiveSection[]).map(s => (
            <button key={s} type="button"
              onClick={() => { setTab(s); setUserSearch(""); setTeamSearch("") }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tab === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
              {s === "users"
                ? `Collaborateurs (${memberCount})`
                : `Équipes (${teamCount})`}
            </button>
          ))}
        </div>

        {/* ── Onglet Collaborateurs ── */}
        {tab === "users" && (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-5 py-4">

            {/* Zone d'ajout */}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-medium text-muted-foreground flex-1">
                  Ajouter des membres
                </p>
                <Select value={defaultRole} onValueChange={v => setDefaultRole(v as DatasetRole)}>
                  <SelectTrigger className="h-auto w-auto bg-transparent px-2 py-1 text-[10px]
                    text-muted-foreground shadow-none outline-none focus:ring-0 cursor-pointer
                    border border-input rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {(Object.keys(ROLE_LABELS) as DatasetRole[]).map(r => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABELS[r].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pills des users en attente */}
              {stagedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {stagedUsers.map(({ user, role }) => (
                    <div key={user.id}
                      className="flex items-center gap-1 rounded-full border bg-background pl-1.5 pr-1 py-0.5">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-medium">{user.name}</span>
                      <Select value={role} onValueChange={v => updateStagedRole(user.id, v as DatasetRole)}>
                        <SelectTrigger className="h-auto w-auto border border-input bg-transparent
                          px-1.5 text-[10px] text-muted-foreground shadow-none outline-none
                          focus:ring-0 cursor-pointer rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {(Object.keys(ROLE_LABELS) as DatasetRole[]).map(r => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {ROLE_LABELS[r].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button type="button" onClick={() => removeStaged(user.id)}
                        className="flex items-center justify-center hover:text-foreground
                          text-muted-foreground/50 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Champ de recherche */}
              <div className="relative">
                <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5
                  focus-within:ring-1 focus-within:ring-primary/30">
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <input ref={inputRef} type="text" value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Rechercher un utilisateur…"
                    className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/40" />
                </div>
                {showDropdown && (userSearch.length > 0 || suggestions.length > 0) && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border
                    bg-background shadow-lg overflow-hidden">
                    {suggestions.length > 0 ? suggestions.map(user => (
                      <button key={user.id} type="button" onMouseDown={() => addStaged(user)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50
                          transition-colors text-left">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center
                          justify-center text-[9px] font-bold text-primary shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{user.name}</p>
                          {user.email && (
                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          )}
                        </div>
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Aucun résultat</div>
                    )}
                  </div>
                )}
              </div>

              {stagedUsers.length > 0 && (
                <button type="button" onClick={confirmAdd}
                  className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary
                    py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  <UserPlus className="h-3.5 w-3.5" />
                  Ajouter {stagedUsers.length} membre{stagedUsers.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>

            {/* Membres existants */}
            {displayedMembers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                  Membres actuels · {displayedMembers.length}
                </p>
                {displayedMembers.map(member => {
                  const roleConfig = ROLE_LABELS[member.role as DatasetRole] ?? ROLE_LABELS.viewer
                  const RoleIcon   = roleConfig.icon
                  return (
                    <div key={`${member.userId}-${member.grantedAt}`}
                      className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center
                        justify-center text-[10px] font-bold text-primary shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Depuis {new Date(member.grantedAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      </div>

                      {/* Rôle — cliquable si onUpdateMemberRole fourni, badge sinon */}
                      {onUpdateMemberRole ? (
                        <Select
                          value={member.role as DatasetRole}
                          onValueChange={v => onUpdateMemberRole(member.userId, v as DatasetRole)}
                        >
                          <SelectTrigger className={cn(
                            "h-auto w-auto border-0 px-2 py-0.5 text-[10px] shadow-none",
                            "focus:ring-0 cursor-pointer rounded-full shrink-0",
                            ROLE_COLORS[member.role as DatasetRole] ?? ROLE_COLORS.viewer
                          )}>
                            <div className="flex items-center gap-1">
                              <RoleIcon className="h-2.5 w-2.5" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent align="end">
                            {(Object.keys(ROLE_LABELS) as DatasetRole[]).map(r => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {ROLE_LABELS[r].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0",
                          ROLE_COLORS[member.role as DatasetRole] ?? ROLE_COLORS.viewer
                        )}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {roleConfig.label}
                        </div>
                      )}

                      <button type="button"
                        onClick={() => onRemoveMember(member.userId)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg
                          hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20
                          dark:hover:text-red-400 transition-colors text-muted-foreground/30 shrink-0"
                        aria-label={`Retirer ${member.name}`}>
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Équipes ── */}
        {tab === "teams" && (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-5 py-4">
            <div className="relative flex items-center gap-1.5 rounded-lg border bg-background
              px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-primary/30">
              <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <input type="text" value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                placeholder="Rechercher une équipe…"
                className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/40" />
            </div>

            {filteredTeams.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                  Disponibles
                </p>
                {filteredTeams.map(team => (
                  <button key={team.id} type="button"
                    onClick={() => { onAddTeam(team); handleClose() }}
                    className="flex items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5
                      hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{team.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {team.members?.length ?? 0} membres
                      </p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary
                      transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {dataset.teamAssignments.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                  Assignées · {dataset.teamAssignments.length}
                </p>
                {dataset.teamAssignments.map(ta => (
                  <div key={ta.teamId}
                    className="flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ta.teamName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Depuis {new Date(ta.assignedAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    </div>
                    <button type="button" onClick={() => onRemoveTeam(ta.teamId)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg
                        hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20
                        dark:hover:text-red-400 transition-colors text-muted-foreground/40 shrink-0"
                      aria-label={`Désassigner ${ta.teamName}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredTeams.length === 0 && dataset.teamAssignments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-1.5 rounded-xl border border-dashed">
                <Users className="h-6 w-6 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">Aucune équipe disponible</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t bg-muted/20 shrink-0">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Les membres ajoutés reçoivent un accès immédiat au dataset.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface DatasetAccessPanelProps {
  dataset:               Dataset
  allTeams:              Team[]
  allUsers:              User[]
  currentUserId:         string
  onAddMember?:          (user: User, role: DatasetRole) => void
  onAddMembers?:         (users: StagedUser[]) => void
  onAddTeam:             (team: Team) => void
  onRemoveMember:        (userId: string) => void
  onRemoveTeam:          (teamId: string) => void
  onUpdateMemberRole?:   (userId: string, role: DatasetRole) => void
  externalOpen?:         boolean
  onExternalOpenChange?: (open: boolean) => void
  headless?:             boolean
}

export function DatasetAccessPanel({
  dataset, allTeams, allUsers, currentUserId,
  onAddMember, onAddMembers, onAddTeam, onRemoveMember, onRemoveTeam,
  onUpdateMemberRole,
  externalOpen, onExternalOpenChange,
  headless = false,
}: DatasetAccessPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = internalOpen || (externalOpen ?? false)

  const handleOpenChange = (v: boolean) => {
    setInternalOpen(v)
    onExternalOpenChange?.(v)
  }

  const handleAddMembers = (users: StagedUser[]) => {
    if (onAddMembers)     onAddMembers(users)
    else if (onAddMember) users.forEach(({ user, role }) => onAddMember(user, role))
  }

  const sheetProps = {
    open:               isOpen,
    onClose:            () => handleOpenChange(false),
    dataset,
    allTeams,
    allUsers,
    currentUserId,
    onAddMembers:       handleAddMembers,
    onAddTeam,
    onRemoveTeam,
    onRemoveMember,
    onUpdateMemberRole,
  }

  if (headless) {
    return <AddAccessSheet {...sheetProps} />
  }

  // Mode normal : panneau inline + sheet
  const seen = new Set<string>()
  const displayedMembers = dataset.members.filter(m => {
    if (m.userId === currentUserId) return false
    if (seen.has(m.userId)) return false
    seen.add(m.userId); return true
  })

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Gestion des accès</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {displayedMembers.length} membre{displayedMembers.length !== 1 ? "s" : ""}{" · "}
            {dataset.teamAssignments.length} équipe{dataset.teamAssignments.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" className="gap-1.5 text-xs h-7 ml-1" onClick={() => handleOpenChange(true)}>
            <Plus className="h-3.5 w-3.5" />Ajouter
          </Button>
        </div>

        {displayedMembers.length === 0 && dataset.teamAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed">
            <Shield className="h-7 w-7 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Aucun accès partagé</p>
            <p className="text-[10px] text-muted-foreground/60 text-center max-w-50 leading-relaxed">
              Seul vous avez accès. Cliquez sur Ajouter pour partager ce dataset.
            </p>
          </div>
        ) : (
          <>
            {displayedMembers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Membres individuels · {displayedMembers.length}
                </p>
                {displayedMembers.map(member => {
                  const roleConfig = ROLE_LABELS[member.role as DatasetRole] ?? ROLE_LABELS.viewer
                  const RoleIcon   = roleConfig.icon
                  return (
                    <div key={`${member.userId}-${member.grantedAt}`}
                      className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5
                        hover:border-muted-foreground/20 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center
                        justify-center text-[10px] font-bold text-primary shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Depuis {new Date(member.grantedAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0",
                        ROLE_COLORS[member.role as DatasetRole] ?? ROLE_COLORS.viewer
                      )}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {roleConfig.label}
                      </div>
                      <button type="button" onClick={() => onRemoveMember(member.userId)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg
                          hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20
                          dark:hover:text-red-400 transition-colors text-muted-foreground/40 shrink-0"
                        aria-label={`Retirer ${member.name}`}>
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {dataset.teamAssignments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Équipes assignées · {dataset.teamAssignments.length}
                </p>
                {dataset.teamAssignments.map(ta => (
                  <div key={ta.teamId}
                    className="flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2.5
                      hover:border-muted-foreground/20 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ta.teamName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Depuis {new Date(ta.assignedAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    </div>
                    <button type="button" onClick={() => onRemoveTeam(ta.teamId)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg
                        hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20
                        dark:hover:text-red-400 transition-colors text-muted-foreground/40 shrink-0"
                      aria-label={`Désassigner ${ta.teamName}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddAccessSheet {...sheetProps} />
    </>
  )
}