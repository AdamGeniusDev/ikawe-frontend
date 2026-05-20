"use client"

// app/(root)/team/page.tsx

import { useMemo, useState } from "react"
import {
  Plus, Users, Database, CheckCircle2, Clock,
  Shield, ChevronRight, ArrowLeft, LucideIcon,
  Activity, UserCheck, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { buildColumns } from "./columns"
import {
  DialogGererRoles,
  DialogChoisirRole,
  DialogInviter,
  DialogChangerRole,
  DialogDetails,
  DialogRetirer,
  DialogCreerEquipe,
  DialogAjouterAEquipe,
} from "./dialogs"
import {
  Team, TeamMember, PendingInvite,
  MOCK_TEAMS, MOCK_PENDING, MOCK_DATASETS,
} from "@/types/team"
import {
  User, TeamRole,
  TEAM_ROLE_LABELS,
  MOCK_USERS, getUserById, getAvatarProps,
} from "@/types/user"
import type { DatasetStatus } from "@/types/datasets"
import Image from "next/image"

// ─── Types locaux ─────────────────────────────────────────────────────────────

type DialogType =
  | "roles"
  | "creer_equipe"
  | "choisir_role"        // ajouter un collaborateur à l'équipe active
  | "ajouter_a_equipe"    // depuis la section collaborateurs → choisir équipe + rôle
  | "inviter"
  | "role"
  | "details"
  | "remove"
  | null

interface DialogState {
  type:   DialogType
  member: TeamMember | null
  user:   User | null
}

// ─── Helpers visuels ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub: string; icon: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function UserAvatar({ userId, size = 7 }: { userId: string; size?: number }) {
  const user = getUserById(userId)
  if (!user) return null
  const avatar = getAvatarProps(user)
  if (avatar.avatarUrl) {
    return (
      <Image src={avatar.avatarUrl} alt={user.name} title={user.name}
        width={size * 4} height={size * 4}
        className={`w-${size} h-${size} rounded-full border-2 border-background object-cover shrink-0`} />
    )
  }
  return (
    <div title={user.name}
      className={`w-${size} h-${size} rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
      style={{ backgroundColor: avatar.color }}>
      {avatar.initials}
    </div>
  )
}

// ─── CollaboratorRow ──────────────────────────────────────────────────────────
// Affiche un collaborateur avec ses équipes + rôles actuels

const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
  team_owner: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  team_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewer:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  annotator:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  viewer:     'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

function CollaboratorRow({ user, teams, onAdd }: {
  user:   User
  teams:  Team[]       // toutes les équipes pour trouver les memberships
  onAdd:  (user: User) => void
}) {
  const avatar = getAvatarProps(user)

  // Trouver dans quelles équipes ce collaborateur est déjà membre
  const memberships = teams
    .map(t => {
      const m = t.members.find(m => m.userId === user.id)
      return m ? { teamName: t.name, role: m.role } : null
    })
    .filter(Boolean) as { teamName: string; role: TeamRole }[]

  return (
    <div className="flex items-center gap-3 py-3 px-1">

      {/* Avatar */}
      {avatar.avatarUrl ? (
        <Image src={avatar.avatarUrl} alt={user.name}
          width={40} height={40}
          className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: avatar.color }}>
          {avatar.initials}
        </div>
      )}

      {/* Infos + équipes */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        {memberships.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {memberships.map((m, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-medium", TEAM_ROLE_COLORS[m.role])}>
                  {TEAM_ROLE_LABELS[m.role]}
                </span>
                <span className="text-muted-foreground/60">{m.teamName}</span>
              </span>
            ))}
          </div>
        )}
        {memberships.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Pas encore dans une équipe</p>
        )}
      </div>

      {/* Action */}
      <button type="button" onClick={() => onAdd(user)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors shrink-0">
        <Plus className="h-3 w-3" />
        Ajouter à une équipe
      </button>
    </div>
  )
}

// ─── TeamCard ─────────────────────────────────────────────────────────────────

function TeamCard({ team, onSelect }: { team: Team; onSelect: () => void }) {
  const totalAnnotations = team.members.reduce((a, m) => a + m.annotations, 0)
  return (
    <button type="button" onClick={onSelect}
      className="group w-full text-left rounded-2xl border bg-background hover:border-primary/30 hover:shadow-sm transition-all duration-150 overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold truncate">{team.name}</h3>
          </div>
          {team.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-10">{team.description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-3 px-5 pb-4">
        <div className="flex -space-x-2">
          {team.members.slice(0, 4).map(m => (
            <UserAvatar key={m.userId} userId={m.userId} size={7} />
          ))}
          {team.members.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
              +{team.members.length - 4}
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {team.members.length} membre{team.members.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-4 border-t px-5 py-3 bg-muted/20">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>{team.datasetIds.length} dataset{team.datasetIds.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          <span>{totalAnnotations.toLocaleString("fr-FR")} annotations</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto">
          <Activity className="h-3 w-3" />
          <span>Créée le {new Date(team.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
        </div>
      </div>
    </button>
  )
}

// ─── Vue liste principale ─────────────────────────────────────────────────────

function TeamsListView({ teams, pending, collaborators, onSelectTeam, onCreerEquipe,
  onGererRoles, onInviter, onAnnulerInvitation, onAddToTeam }: {
  teams:               Team[]
  pending:             PendingInvite[]
  collaborators:       User[]
  onSelectTeam:        (team: Team) => void
  onCreerEquipe:       () => void
  onGererRoles:        () => void
  onInviter:           () => void
  onAnnulerInvitation: (id: string) => void
  onAddToTeam:         (user: User) => void
}) {
  const totalMembers     = teams.reduce((a, t) => a + t.members.length, 0)
  const totalAnnotations = teams.reduce((a, t) => a + t.members.reduce((b, m) => b + m.annotations, 0), 0)
  const totalDatasets    = new Set(teams.flatMap(t => t.datasetIds)).size

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px] text-secondary">Équipes</h1>
          <p className="text-[14px] text-muted-foreground">
            {teams.length} équipe{teams.length > 1 ? "s" : ""} · {collaborators.length} collaborateurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onGererRoles}>
            <Shield className="h-3.5 w-3.5" />
            Rôles
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onInviter}>
            <Plus className="h-3.5 w-3.5" />
            Inviter
          </Button>
          <button type="button" onClick={onCreerEquipe}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nouvelle équipe
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Membres total"       value={totalMembers}                             sub="dans les équipes"        icon={Users}       />
          <StatCard label="Datasets actifs"     value={totalDatasets}                            sub="partagés entre équipes"  icon={Database}    />
          <StatCard label="Annotations totales" value={totalAnnotations.toLocaleString("fr-FR")} sub="ce mois, toutes équipes" icon={CheckCircle2}/>
          <StatCard label="Invitations"         value={pending.length}                           sub="en attente de réponse"   icon={Clock}       />
        </div>

        {/* ── Mes équipes ── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold">Mes équipes</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Groupes de travail avec des accès et rôles par dataset
            </p>
          </div>
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Aucune équipe pour l'instant</p>
              <button type="button" onClick={onCreerEquipe} className="text-xs text-primary hover:underline">
                Créer la première équipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {teams.map(team => (
                <TeamCard key={team.id} team={team} onSelect={() => onSelectTeam(team)} />
              ))}
            </div>
          )}
        </section>

        {/* ── Mes collaborateurs ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Mes collaborateurs
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {collaborators.length}
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Personnes qui ont accepté votre invitation. Ajoutez-les à vos équipes avec le rôle de votre choix.
              </p>
            </div>
            <button type="button" onClick={onInviter}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0">
              <Mail className="h-3.5 w-3.5" />
              Inviter
            </button>
          </div>

          {collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Aucun collaborateur confirmé</p>
              <p className="text-xs text-muted-foreground max-w-xs text-center leading-relaxed">
                Invitez quelqu'un via son email. Une fois l'invitation acceptée, il apparaîtra ici.
              </p>
              <button type="button" onClick={onInviter}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Inviter un collaborateur
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-background px-4 divide-y divide-border/40">
              {collaborators.map(user => (
                <CollaboratorRow
                  key={user.id}
                  user={user}
                  teams={teams}
                  onAdd={onAddToTeam}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Invitations en attente ── */}
        {pending.length > 0 && (
          <section>
            <div className="rounded-2xl border bg-background overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <span className="text-sm font-semibold">Invitations en attente</span>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full">
                  {pending.length} en attente
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {pending.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">?</div>
                    <span className="flex-1 text-xs">{inv.email}</span>
                    <span className="text-[11px] text-muted-foreground">{inv.sentAt}</span>
                    <button type="button" onClick={() => onAnnulerInvitation(inv.id)}
                      className="text-[11px] text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition-colors">
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ─── Vue détail équipe ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DatasetStatus, { label: string; color: string }> = {
  active:    { label: "Actif",       color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed: { label: "Terminé",     color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  draft:     { label: "Brouillon",   color: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500" },
  in_review: { label: "En révision", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  archived:  { label: "Archivé",     color: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400" },
}

function TeamDetailView({ team, disponibles, onBack, onDialog, columns }: {
  team:        Team
  disponibles: User[]
  onBack:      () => void
  onDialog:    (type: DialogType, member?: TeamMember | null, user?: User | null) => void
  columns:     ReturnType<typeof buildColumns>
}) {
  const totalAnnotations = useMemo(() => team.members.reduce((a, m) => a + m.annotations, 0), [team.members])
  const datasetsEquipe   = useMemo(() => MOCK_DATASETS.filter(d => team.datasetIds.includes(d.id)), [team.datasetIds])

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Équipes
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-sm font-semibold text-secondary">{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onDialog("roles")}>
            <Shield className="h-3.5 w-3.5" />
            Rôles
          </Button>
          <button type="button" onClick={() => onDialog("inviter")}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Inviter
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Membres"            value={team.members.length}                      sub="dans l'équipe"        icon={Users}       />
          <StatCard label="Datasets associés"  value={datasetsEquipe.length}                    sub="en lecture seule ici" icon={Database}    />
          <StatCard label="Annotations équipe" value={totalAnnotations.toLocaleString("fr-FR")} sub="ce mois"              icon={CheckCircle2}/>
          <StatCard label="Créée le"
            value={new Date(team.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            sub={team.description ?? "—"} icon={Activity} />
        </div>

        {/* Datasets */}
        <div className="rounded-2xl border bg-background px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold">Datasets associés</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Gérez les accès depuis la page de chaque dataset</p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">Lecture seule</span>
          </div>
          {datasetsEquipe.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun dataset associé. Assignez cette équipe depuis la page Dataset.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {datasetsEquipe.map(ds => {
                const cfg = STATUS_CONFIG[ds.status as DatasetStatus]
                return (
                  <div key={ds.id} className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-foreground/80">{ds.name}</span>
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Membres */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Membres de l'équipe</span>
            <span className="text-[11px] text-muted-foreground">{team.members.length} membre{team.members.length > 1 ? "s" : ""}</span>
          </div>
          <DataTable columns={columns} data={team.members} pageSize={8} />
        </div>

        {/* Collaborateurs disponibles à ajouter */}
        {disponibles.length > 0 && (
          <div className="rounded-2xl border bg-background px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Collaborateurs disponibles</span>
              <span className="text-[11px] text-muted-foreground">{disponibles.length} disponible{disponibles.length > 1 ? "s" : ""}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Vos collaborateurs confirmés non encore membres de cette équipe.
            </p>
            <div className="flex flex-col divide-y divide-border/40">
              {disponibles.map(user => {
                const avatar = getAvatarProps(user)
                return (
                  <div key={user.id} className="flex items-center gap-3 py-2.5">
                    {avatar.avatarUrl ? (
                      <Image src={avatar.avatarUrl} alt={user.name} width={32} height={32}
                        className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: avatar.color }}>
                        {avatar.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button type="button"
                      onClick={() => onDialog("choisir_role", null, user)}
                      className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors shrink-0">
                      + Ajouter à l'équipe
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TeamPage() {
  const [teams,        setTeams]        = useState<Team[]>(MOCK_TEAMS)
  const [pending,      setPending]      = useState<PendingInvite[]>(MOCK_PENDING)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [dialog,       setDialog]       = useState<DialogState>({ type: null, member: null, user: null })

  // Utilisateur courant — en production : useSession().user.id
  const currentUserId = 'user-owner'
  const currentUser   = MOCK_USERS.find(u => u.id === currentUserId)

  // Collaborateurs confirmés du user courant
  const collaborators = useMemo(() => {
    if (!currentUser) return []
    return MOCK_USERS.filter(u => currentUser.collaboratorIds.includes(u.id))
  }, [currentUser])

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null

  // Collaborateurs non encore membres de l'équipe active
  const disponibles = useMemo(() => {
    if (!activeTeam) return []
    const memberIds = new Set(activeTeam.members.map(m => m.userId))
    return collaborators.filter(u => !memberIds.has(u.id))
  }, [activeTeam, collaborators])

  const open  = (type: DialogType, member: TeamMember | null = null, user: User | null = null) =>
    setDialog({ type, member, user })
  const close = () => setDialog({ type: null, member: null, user: null })

  const handleCreerEquipe = (name: string, description: string) => {
    setTeams(prev => [...prev, {
      id: crypto.randomUUID(), name,
      description: description || undefined,
      ownerId: currentUserId,
      createdAt: new Date().toISOString().split("T")[0],
      datasetIds: [], members: [],
    }])
  }

  // Ajouter un membre à l'équipe active (depuis vue détail)
  const handleAjouterMembre = (user: User, role: TeamRole) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: [...t.members, {
          userId: user.id, role,
          joinedAt: new Date().toISOString().split("T")[0],
          annotations: 0, lastActive: "À l'instant",
        }],
      }
    ))
  }

  // Ajouter un collaborateur à UNE équipe choisie (depuis vue liste)
  const handleAjouterAEquipe = (user: User, teamId: string, role: TeamRole) => {
    setTeams(prev => prev.map(t =>
      t.id !== teamId ? t : {
        ...t,
        members: [...t.members, {
          userId: user.id, role,
          joinedAt: new Date().toISOString().split("T")[0],
          annotations: 0, lastActive: "À l'instant",
        }],
      }
    ))
  }

  const handleRoleChange = (userId: string, role: TeamRole) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: t.members.map(m => m.userId === userId ? { ...m, role } : m),
      }
    ))
  }

  const handleRemove = (userId: string) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: t.members.filter(m => m.userId !== userId),
      }
    ))
  }

  const columns = useMemo(() => buildColumns({
    onChangeRole: m => open("role",    m),
    onDetails:    m => open("details", m),
    onRemove:     m => open("remove",  m),
  }), [])

  return (
    <>
      {activeTeam ? (
        <TeamDetailView
          team={activeTeam}
          disponibles={disponibles}
          onBack={() => setActiveTeamId(null)}
          onDialog={open}
          columns={columns}
        />
      ) : (
        <TeamsListView
          teams={teams}
          pending={pending}
          collaborators={collaborators}
          onSelectTeam={t => setActiveTeamId(t.id)}
          onCreerEquipe={() => open("creer_equipe")}
          onGererRoles={() => open("roles")}
          onInviter={() => open("inviter")}
          onAnnulerInvitation={id => setPending(prev => prev.filter(p => p.id !== id))}
          onAddToTeam={user => open("ajouter_a_equipe", null, user)}
        />
      )}

      <DialogGererRoles     open={dialog.type === "roles"}           onOpenChange={v => !v && close()} />
      <DialogCreerEquipe    open={dialog.type === "creer_equipe"}    onOpenChange={v => !v && close()}
        onCreate={(n, d) => { handleCreerEquipe(n, d); close() }} />
      <DialogInviter        open={dialog.type === "inviter"}         onOpenChange={v => !v && close()}
        onInvite={email => { setPending(prev => [...prev, { id: crypto.randomUUID(), email, sentAt: "À l'instant" }]); close() }} />

      {/* Ajouter à l'équipe active (depuis vue détail) */}
      <DialogChoisirRole    open={dialog.type === "choisir_role"}    onOpenChange={v => !v && close()}
        user={dialog.user}
        onAdd={(user, role) => { handleAjouterMembre(user, role); close() }} />

      {/* Ajouter à une équipe choisie (depuis vue liste collaborateurs) */}
      <DialogAjouterAEquipe open={dialog.type === "ajouter_a_equipe"} onOpenChange={v => !v && close()}
        user={dialog.user}
        teams={teams}
        onAdd={(user, teamId, role) => { handleAjouterAEquipe(user, teamId, role); close() }} />

      <DialogChangerRole    open={dialog.type === "role"}            onOpenChange={v => !v && close()}
        member={dialog.member}
        onRoleChange={(uid, role) => { handleRoleChange(uid, role); close() }} />
      <DialogDetails        open={dialog.type === "details"}         onOpenChange={v => !v && close()} member={dialog.member} />
      <DialogRetirer        open={dialog.type === "remove"}          onOpenChange={v => !v && close()}
        member={dialog.member}
        onConfirm={uid => { handleRemove(uid); close() }} />
    </>
  )
}