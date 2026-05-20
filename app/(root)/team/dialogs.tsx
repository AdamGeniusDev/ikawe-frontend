"use client"

// app/(root)/team/dialogs.tsx
//

import { useState } from "react"
import { Check, Trash2, UserPlus, Mail, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input  } from "@/components/ui/input"
import { Label  } from "@/components/ui/label"
import {
  User, TeamRole, TEAM_ROLE_LABELS,
  getUserById, getAvatarProps,
} from "@/types/user"
import {
  Team, TeamMember,
  PERMISSION_LABELS, TEAM_ROLE_PERMISSIONS,
} from "@/types/team"
import Image from "next/image"

// ─── Constantes visuelles ─────────────────────────────────────────────────────

const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
  team_owner: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  team_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewer:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  annotator:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  viewer:     'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

// Rôles assignables (team_owner non assignable manuellement — c'est le créateur)
const ASSIGNABLE_ROLES: TeamRole[] = ['team_admin', 'reviewer', 'annotator', 'viewer']

// ─── Composants partagés ──────────────────────────────────────────────────────

export function RolePill({ role }: { role: TeamRole }) {
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap", TEAM_ROLE_COLORS[role])}>
      {TEAM_ROLE_LABELS[role]}
    </span>
  )
}

function UserAvatar({ user }: { user: User }) {
  const avatar = getAvatarProps(user)
  if (avatar.avatarUrl) {
    return <Image src={avatar.avatarUrl} alt={user.name} width={36} height={36}
      className="w-9 h-9 rounded-full object-cover shrink-0" />
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{ backgroundColor: avatar.color }}>
      {avatar.initials}
    </div>
  )
}

function UserMiniCard({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <UserAvatar user={user} />
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}

function MemberHeader({ member }: { member: TeamMember }) {
  const user = getUserById(member.userId)
  if (!user) return null
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <UserAvatar user={user} />
      <div>
        <p className="text-sm font-medium leading-tight">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-1"><RolePill role={member.role} /></div>
      </div>
    </div>
  )
}

// ─── RoleSelector ─────────────────────────────────────────────────────────────
// Liste les rôles assignables avec leurs permissions résumées

function RoleSelector({ value, onChange }: { value: TeamRole; onChange: (r: TeamRole) => void }) {
  return (
    <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
      {ASSIGNABLE_ROLES.map(role => {
        const perms = TEAM_ROLE_PERMISSIONS[role]
        return (
          <button key={role} type="button" onClick={() => onChange(role)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 text-left transition-colors",
              "hover:bg-muted/50 border-b border-border/30 last:border-0",
              value === role && "bg-muted/40"
            )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <RolePill role={role} />
              <div className="flex gap-1 flex-wrap">
                {perms.map(p => (
                  <span key={p} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {PERMISSION_LABELS[p].split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
            {value === role && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DialogGererRoles — affichage des rôles et permissions (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

export function DialogGererRoles({ open, onOpenChange }: {
  open: boolean; onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rôles disponibles</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Les rôles définissent ce que chaque membre peut faire dans une équipe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
          {(Object.entries(TEAM_ROLE_LABELS) as [TeamRole, string][]).map(([role]) => {
            const perms = TEAM_ROLE_PERMISSIONS[role]
            return (
              <div key={role} className="flex items-start gap-3 px-3 py-3 border-b border-border/30 last:border-0">
                <RolePill role={role} />
                <div className="flex flex-col gap-1 flex-1">
                  {perms.map(p => (
                    <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      {PERMISSION_LABELS[p]}
                    </div>
                  ))}
                  {perms.length === 0 && <p className="text-xs text-muted-foreground">Aucune permission active</p>}
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DialogCreerEquipe
// ─────────────────────────────────────────────────────────────────────────────

export function DialogCreerEquipe({ open, onOpenChange, onCreate }: {
  open: boolean; onOpenChange: (v: boolean) => void
  onCreate: (name: string, description: string) => void
}) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), desc.trim())
    setName(""); setDesc(""); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle équipe</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Créez un groupe de travail. Vous pourrez y ajouter des collaborateurs
            et leur assigner des datasets.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nom de l'équipe *</Label>
            <Input placeholder="Ex : Équipe NLP Francophone" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="h-8 text-xs" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description (optionnel)</Label>
            <Input placeholder="Ex : Spécialisée dans les entités nommées" value={desc}
              onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="h-8 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>Créer l'équipe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DialogChoisirRole — ajouter un collaborateur à l'équipe ACTIVE
//    (appelé depuis la vue détail d'une équipe)
// ─────────────────────────────────────────────────────────────────────────────

export function DialogChoisirRole({ open, onOpenChange, user, onAdd }: {
  open: boolean; onOpenChange: (v: boolean) => void
  user: User | null
  onAdd: (user: User, role: TeamRole) => void
}) {
  const [selectedRole, setSelectedRole] = useState<TeamRole>('annotator')
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Choisir un rôle</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Quel rôle dans cette équipe pour {user.name} ?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <UserMiniCard user={user} />
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={() => { onAdd(user, selectedRole); onOpenChange(false) }}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter à l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DialogAjouterAEquipe — depuis la section collaborateurs de la vue liste
//    L'utilisateur choisit À QUELLE équipe ajouter + quel rôle
// ─────────────────────────────────────────────────────────────────────────────

export function DialogAjouterAEquipe({ open, onOpenChange, user, teams, onAdd }: {
  open:         boolean
  onOpenChange: (v: boolean) => void
  user:         User | null
  teams:        Team[]
  onAdd:        (user: User, teamId: string, role: TeamRole) => void
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id ?? "")
  const [selectedRole,   setSelectedRole]   = useState<TeamRole>('annotator')

  if (!user) return null

  // Équipes où ce collaborateur n'est pas encore membre
  const availableTeams = teams.filter(
    t => !t.members.some(m => m.userId === user.id)
  )

  if (availableTeams.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Ajouter à une équipe</DialogTitle>
          </DialogHeader>
          <UserMiniCard user={user} />
          <p className="text-xs text-muted-foreground text-center py-4">
            {user.name} est déjà membre de toutes vos équipes.
          </p>
          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter à une équipe</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choisissez l'équipe et le rôle de {user.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <UserMiniCard user={user} />

          {/* Choix de l'équipe */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Équipe</Label>
            <div className="relative">
              <select
                title='available-teams'
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                className="w-full h-8 rounded-lg border bg-background px-3 pr-8 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Choix du rôle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Rôle dans cette équipe</Label>
            <RoleSelector value={selectedRole} onChange={setSelectedRole} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm"
            disabled={!selectedTeamId}
            onClick={() => { onAdd(user, selectedTeamId, selectedRole); onOpenChange(false) }}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter à l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DialogInviter
// ─────────────────────────────────────────────────────────────────────────────

export function DialogInviter({ open, onOpenChange, onInvite }: {
  open: boolean; onOpenChange: (v: boolean) => void
  onInvite: (email: string) => void
}) {
  const [email, setEmail] = useState("")
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSend = () => {
    if (!isValid) return
    onInvite(email.trim()); setEmail(""); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Inviter un collaborateur</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Un email d'invitation sera envoyé. Une fois acceptée, la personne
            apparaîtra dans vos collaborateurs et vous pourrez l'ajouter à une équipe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Adresse email</Label>
          <Input type="email" placeholder="prenom@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
            className="h-8 text-xs" autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleSend} disabled={!isValid}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Envoyer l'invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DialogChangerRole — changer le rôle d'un membre dans son équipe
// ─────────────────────────────────────────────────────────────────────────────

export function DialogChangerRole({ open, onOpenChange, member, onRoleChange }: {
  open: boolean; onOpenChange: (v: boolean) => void
  member: TeamMember | null
  onRoleChange: (userId: string, role: TeamRole) => void
}) {
  const [selectedRole, setSelectedRole] = useState<TeamRole>(member?.role ?? 'annotator')
  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription className="sr-only">Modifier le rôle du membre dans cette équipe</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <MemberHeader member={member} />
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={() => { onRoleChange(member.userId, selectedRole); onOpenChange(false) }}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DialogDetails — fiche d'un membre
// ─────────────────────────────────────────────────────────────────────────────

export function DialogDetails({ open, onOpenChange, member }: {
  open: boolean; onOpenChange: (v: boolean) => void; member: TeamMember | null
}) {
  if (!member) return null
  const user  = getUserById(member.userId)
  const perms = TEAM_ROLE_PERMISSIONS[member.role]
  if (!user) return null

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Email",  value: user.email },
    { label: "Rôle",   value: <RolePill role={member.role} /> },
    { label: "Annotations ce mois",
      value: <span className="text-emerald-600 font-medium">{member.annotations.toLocaleString("fr-FR")}</span> },
    { label: "Membre depuis",
      value: new Date(member.joinedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
    { label: "Dernière activité", value: member.lastActive },
    { label: "Permissions",
      value: (
        <div className="flex flex-col gap-1 items-end">
          {perms.map(p => (
            <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              {PERMISSION_LABELS[p]}
            </div>
          ))}
          {perms.length === 0 && <span className="text-xs text-muted-foreground">Aucune permission</span>}
        </div>
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Détails</DialogTitle>
          <DialogDescription className="sr-only">Fiche de {user.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <MemberHeader member={member} />
          <div className="flex flex-col divide-y divide-border/40">
            {rows.map(row => (
              <div key={row.label as string} className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
                <div className="text-xs text-right">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DialogRetirer — retirer un membre de l'équipe
// ─────────────────────────────────────────────────────────────────────────────

export function DialogRetirer({ open, onOpenChange, member, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void
  member: TeamMember | null
  onConfirm: (userId: string) => void
}) {
  if (!member) return null
  const user = getUserById(member.userId)
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Retirer de l'équipe</DialogTitle>
          <DialogDescription className="sr-only">Confirmer le retrait de {user.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
            <Trash2 className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <strong>{user.name}</strong> perdra l'accès à tous les datasets et tâches
              de cette équipe. Il restera dans vos collaborateurs.
            </p>
          </div>
          <MemberHeader member={member} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" variant="destructive"
            onClick={() => { onConfirm(member.userId); onOpenChange(false) }}>
            Retirer de l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}