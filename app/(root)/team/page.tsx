"use client"

import { useMemo, useState } from "react"
import {
  Plus, Users, Database, CheckCircle2, Clock,
  Shield, ChevronRight, ArrowLeft, LucideIcon,
  Activity
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
} from "./dialogs"
import {
  Team, TeamMember, Role, Collaborator, PendingInvite,
  MOCK_TEAMS, MOCK_PENDING, MOCK_ROLES,
  MOCK_DATASETS, MOCK_ALL_COLLABORATORS,
} from "@/types/team"

// ─── Types locaux ─────────────────────────────────────────────────────────────

type DialogType =
  | "roles"
  | "creer_equipe"
  | "choisir_role"
  | "inviter"
  | "role"
  | "details"
  | "remove"
  | null

interface DialogState {
  type:         DialogType
  member:       TeamMember | null
  collaborator: Collaborator | null
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label:   string
  value:   string | number
  sub:     string
  icon:    LucideIcon
  accent?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", accent)}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

// ─── Carte équipe (vue liste) ─────────────────────────────────────────────────

function TeamCard({ team, datasetsCount, onSelect }: {
  team:          Team
  datasetsCount: number
  onSelect:      () => void
}) {
  const totalAnnotations = team.members.reduce((a, m) => a + m.annotations, 0)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full text-left rounded-2xl border bg-background hover:border-primary/30 hover:shadow-sm transition-all duration-150 overflow-hidden"
    >
      {/* Header carte */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold truncate">{team.name}</h3>
          </div>
          {team.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-10">
              {team.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>

      {/* Membres avatars */}
      <div className="flex items-center gap-3 px-5 pb-4">
        <div className="flex -space-x-2">
          {team.members.slice(0, 4).map((m) => (
            <div
              key={m.collaborator.id}
              className={cn(
                "w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold shrink-0",
                m.collaborator.avatarColor
              )}
              title={m.collaborator.name}
            >
              {m.collaborator.initials}
            </div>
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

      {/* Footer stats */}
      <div className="flex items-center gap-4 border-t px-5 py-3 bg-muted/20">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>{datasetsCount} dataset{datasetsCount > 1 ? "s" : ""}</span>
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

// ─── Vue liste des équipes ────────────────────────────────────────────────────

function TeamsListView({
  teams,
  pending,
  onSelectTeam,
  onCreerEquipe,
  onGererRoles,
  onInviter,
  onAnnulerInvitation,
}: {
  teams:              Team[]
  pending:            PendingInvite[]
  roles:              Role[]
  onSelectTeam:       (team: Team) => void
  onCreerEquipe:      () => void
  onGererRoles:       () => void
  onInviter:          () => void
  onAnnulerInvitation:(id: string) => void
}) {
  const totalMembers     = teams.reduce((a, t) => a + t.members.length, 0)
  const totalAnnotations = teams.reduce((a, t) => a + t.members.reduce((b, m) => b + m.annotations, 0), 0)
  const totalDatasets    = new Set(teams.flatMap(t => t.datasetIds)).size

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px] text-secondary">Équipes</h1>
          <p className="text-[14px] text-muted-foreground">
            {teams.length} équipe{teams.length > 1 ? "s" : ""} · {totalMembers} membres
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
          <button
            type="button"
            onClick={onCreerEquipe}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle équipe
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">

        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Membres total"       value={totalMembers}                            sub="sur la plateforme"       icon={Users}        />
          <StatCard label="Datasets actifs"     value={totalDatasets}                           sub="partagés entre équipes"  icon={Database}     />
          <StatCard label="Annotations totales" value={totalAnnotations.toLocaleString("fr-FR")} sub="ce mois, toutes équipes" icon={CheckCircle2} />
          <StatCard label="Invitations"         value={pending.length}                          sub="en attente de réponse"   icon={Clock}        />
        </div>

        {/* Grille des équipes */}
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Aucune équipe pour l'instant</p>
            <button type="button" onClick={onCreerEquipe}
              className="text-xs text-primary hover:underline"
            >
              Créer la première équipe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {teams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                datasetsCount={team.datasetIds.length}
                onSelect={() => onSelectTeam(team)}
              />
            ))}
          </div>
        )}

        {/* Invitations en attente */}
        {pending.length > 0 && (
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
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                    ?
                  </div>
                  <span className="flex-1 text-xs">{inv.email}</span>
                  <span className="text-[11px] text-muted-foreground">{inv.sentAt}</span>
                  <button type="button"
                    onClick={() => onAnnulerInvitation(inv.id)}
                    className="text-[11px] text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Vue détail d'une équipe ──────────────────────────────────────────────────

function TeamDetailView({
  team,
  disponibles,
  onBack,
  onDialog,
  columns,
}: {
  team:       Team
  roles:      Role[]
  disponibles: Collaborator[]
  onBack:     () => void
  onDialog:   (type: DialogType, member?: TeamMember | null, collaborator?: Collaborator | null) => void
  columns:    ReturnType<typeof buildColumns>
}) {
  const totalAnnotations = useMemo(
    () => team.members.reduce((a, m) => a + m.annotations, 0),
    [team.members]
  )

  const datasetsEquipe = useMemo(
    () => MOCK_DATASETS.filter(d => team.datasetIds.includes(d.id)),
    [team.datasetIds]
  )

  const STATUS_CONFIG = {
    active:    { label: "Actif",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    completed: { label: "Terminé",  color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"              },
    paused:    { label: "En pause", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"       },
  }

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Équipes
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-sm font-semibold text-secondary">{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => onDialog("roles")}>
            <Shield className="h-3.5 w-3.5" />
            Gérer les rôles
          </Button>
          <button type="button"
            onClick={() => onDialog("inviter")}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Inviter
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">

        {/* Stats équipe */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Membres"            value={team.members.length}                      sub="dans l'équipe"        icon={Users}        />
          <StatCard label="Datasets associés"  value={datasetsEquipe.length}                    sub="en lecture seule ici" icon={Database}     />
          <StatCard label="Annotations équipe" value={totalAnnotations.toLocaleString("fr-FR")} sub="ce mois"              icon={CheckCircle2} />
          <StatCard label="Créée le"           value={new Date(team.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} sub={team.description ?? "—"} icon={Activity} />
        </div>

        {/* Datasets associés — lecture seule */}
        <div className="rounded-2xl border bg-background px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold">Datasets associés</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gérez les accès depuis la page de chaque dataset
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
              Lecture seule
            </span>
          </div>
          {datasetsEquipe.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun dataset associé à cette équipe. Assignez cette équipe depuis la page Dataset.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {datasetsEquipe.map(ds => {
                const cfg = STATUS_CONFIG[ds.status]
                return (
                  <div key={ds.id} className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-foreground/80">{ds.name}</span>
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", cfg.color)}>
                      {cfg.label}
                    </span>
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
            <span className="text-[11px] text-muted-foreground">
              {team.members.length} membre{team.members.length > 1 ? "s" : ""}
            </span>
          </div>
          <DataTable columns={columns} data={team.members} pageSize={8} />
        </div>

        {/* Collaborateurs disponibles */}
        {disponibles.length > 0 && (
          <div className="rounded-2xl border bg-background px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Collaborateurs disponibles</span>
              <span className="text-[11px] text-muted-foreground">
                {disponibles.length} disponible{disponibles.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Ces personnes ont un compte mais ne font pas encore partie de cette équipe.
            </p>
            <div className="flex flex-col divide-y divide-border/40">
              {disponibles.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    c.avatarColor
                  )}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDialog("choisir_role", null, c)}
                    className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors shrink-0"
                  >
                    + Ajouter à l'équipe
                  </button>
                </div>
              ))}
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
  const [roles,        setRoles]        = useState<Role[]>(MOCK_ROLES)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [dialog,       setDialog]       = useState<DialogState>({
    type: null, member: null, collaborator: null,
  })

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null

  // ── Helpers dialog ──────────────────────────────────────────────────────────

  const open = (
    type: DialogType,
    member:       TeamMember  | null = null,
    collaborator: Collaborator | null = null,
  ) => setDialog({ type, member, collaborator })

  const close = () => setDialog({ type: null, member: null, collaborator: null })

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreerEquipe = (name: string, description: string) => {
    const newTeam: Team = {
      id:          crypto.randomUUID(),
      name,
      description: description || undefined,
      createdAt:   new Date().toISOString().split("T")[0],
      datasetIds:  [],
      members:     [],
    }
    setTeams(prev => [...prev, newTeam])
  }

  const handleAjouterMembre = (collaborator: Collaborator, role: Role) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: [...t.members, {
          collaborator,
          role,
          joinedAt:    new Date().toISOString().split("T")[0],
          annotations: 0,
          lastActive:  "À l'instant",
        }],
      }
    ))
  }

  const handleInviter = (email: string) => {
    setPending(prev => [...prev, { id: crypto.randomUUID(), email, sentAt: "À l'instant" }])
  }

  const handleRoleChange = (collaboratorId: string, role: Role) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: t.members.map(m =>
          m.collaborator.id === collaboratorId ? { ...m, role } : m
        ),
      }
    ))
  }

  const handleRemove = (collaboratorId: string) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id !== activeTeamId ? t : {
        ...t,
        members: t.members.filter(m => m.collaborator.id !== collaboratorId),
      }
    ))
  }

  // ── Collaborateurs disponibles pour l'équipe active ──────────────────────────

  const disponibles = useMemo(() => {
    if (!activeTeam) return []
    const memberIds = new Set(activeTeam.members.map(m => m.collaborator.id))
    return MOCK_ALL_COLLABORATORS.filter(c => !memberIds.has(c.id))
  }, [activeTeam])

  // ── Colonnes table membres ───────────────────────────────────────────────────

  const columns = useMemo(() => buildColumns({
    onChangeRole: m => open("role",    m),
    onDetails:    m => open("details", m),
    onRemove:     m => open("remove",  m),
  }), [])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {activeTeam ? (
        <TeamDetailView
          team={activeTeam}
          roles={roles}
          disponibles={disponibles}
          onBack={() => setActiveTeamId(null)}
          onDialog={open}
          columns={columns}
        />
      ) : (
        <TeamsListView
          teams={teams}
          pending={pending}
          roles={roles}
          onSelectTeam={t => setActiveTeamId(t.id)}
          onCreerEquipe={() => open("creer_equipe")}
          onGererRoles={() => open("roles")}
          onInviter={() => open("inviter")}
          onAnnulerInvitation={id => setPending(prev => prev.filter(p => p.id !== id))}
        />
      )}

      {/* ── Dialogs (montés une seule fois, partagés entre les deux vues) ── */}

      <DialogGererRoles
        open={dialog.type === "roles"}
        onOpenChange={v => !v && close()}
        roles={roles}
        onRolesChange={setRoles}
      />

      <DialogCreerEquipe
        open={dialog.type === "creer_equipe"}
        onOpenChange={v => !v && close()}
        onCreate={(name, desc) => { handleCreerEquipe(name, desc); close() }}
      />

      <DialogChoisirRole
        open={dialog.type === "choisir_role"}
        onOpenChange={v => !v && close()}
        collaborator={dialog.collaborator}
        roles={roles}
        onAdd={handleAjouterMembre}
      />

      <DialogInviter
        open={dialog.type === "inviter"}
        onOpenChange={v => !v && close()}
        onInvite={handleInviter}
      />

      <DialogChangerRole
        open={dialog.type === "role"}
        onOpenChange={v => !v && close()}
        member={dialog.member}
        roles={roles}
        onRoleChange={handleRoleChange}
      />

      <DialogDetails
        open={dialog.type === "details"}
        onOpenChange={v => !v && close()}
        member={dialog.member}
      />

      <DialogRetirer
        open={dialog.type === "remove"}
        onOpenChange={v => !v && close()}
        member={dialog.member}
        onConfirm={handleRemove}
      />
    </>
  )
}