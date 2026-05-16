"use client"

import { useState } from "react"
import { Check, Pencil, Trash2, UserPlus, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input  } from "@/components/ui/input"
import { Label  } from "@/components/ui/label"
import {
  Role, TeamMember, Collaborator,
  Permission, PERMISSION_LABELS, COLOR_OPTIONS,
} from "@/types/team"



export function RolePill({ role }: { role: Role }) {
  return (
    <span className={cn(
      "text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
      role.color
    )}>
      {role.name}
    </span>
  )
}

function MemberHeader({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
        member.collaborator.avatarColor
      )}>
        {member.collaborator.initials}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{member.collaborator.name}</p>
        <p className="text-xs text-muted-foreground">{member.collaborator.email}</p>
        <div className="mt-1"><RolePill role={member.role} /></div>
      </div>
    </div>
  )
}

function CollabMiniCard({ collaborator }: { collaborator: Collaborator }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
        collaborator.avatarColor
      )}>
        {collaborator.initials}
      </div>
      <div>
        <p className="text-sm font-medium">{collaborator.name}</p>
        <p className="text-xs text-muted-foreground">{collaborator.email}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Formulaire rôle — création et édition
// ─────────────────────────────────────────────

interface RoleFormProps {
  initial?:   Partial<Role>
  onSave:     (data: Omit<Role, "id">) => void
  onCancel:   () => void
  saveLabel?: string
}

function RoleForm({ initial, onSave, onCancel, saveLabel = "Créer" }: RoleFormProps) {
  const [name,  setName]  = useState(initial?.name  ?? "")
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0].value)
  const [perms, setPerms] = useState<Permission[]>(initial?.permissions ?? [])

  const toggle = (p: Permission) =>
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Nom du rôle</Label>
        <Input
          placeholder="Ex : Vérificateur senior"
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-8 text-xs"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Couleur</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setColor(opt.value)}
              className={cn(
                "text-[10px] font-medium px-2.5 py-1 rounded-full transition-all", opt.value,
                color === opt.value
                  ? "ring-2 ring-offset-1 ring-foreground/30"
                  : "opacity-50 hover:opacity-75"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Permissions</Label>
        <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
          {(Object.entries(PERMISSION_LABELS) as [Permission, string][]).map(([key, label]) => (
            <label key={key} className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
              "hover:bg-muted/50 border-b border-border/30 last:border-0",
              perms.includes(key) && "bg-muted/30"
            )}>
              <input type="checkbox" className="rounded shrink-0"
                checked={perms.includes(key)} onChange={() => toggle(key)} />
              <span className="text-xs">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
        <Button size="sm"
          onClick={() => onSave({ name: name.trim(), color, permissions: perms })}
          disabled={!name.trim()}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 1. Dialog : Gérer les rôles
// ─────────────────────────────────────────────

interface DialogGererRolesProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  roles:         Role[]
  onRolesChange: (roles: Role[]) => void
}

type RoleFormMode = { type: "create" } | { type: "edit"; role: Role } | null

export function DialogGererRoles({
  open, onOpenChange, roles, onRolesChange,
}: DialogGererRolesProps) {
  const [mode, setMode] = useState<RoleFormMode>(null)

  const handleCreate = (data: Omit<Role, "id">) => {
    onRolesChange([...roles, { ...data, id: crypto.randomUUID() }])
    setMode(null)
  }

  const handleEdit = (id: string, data: Omit<Role, "id">) => {
    onRolesChange(roles.map(r => r.id === id ? { ...data, id } : r))
    setMode(null)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) setMode(null); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === null
              ? "Gérer les rôles"
              : mode.type === "create"
              ? "Nouveau rôle"
              : "Modifier le rôle"}
          </DialogTitle>
          {mode === null && (
            <DialogDescription className="text-xs text-muted-foreground">
              Créez des rôles personnalisés et définissez leurs permissions.
            </DialogDescription>
          )}
        </DialogHeader>

        {mode === null && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
              {roles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Aucun rôle. Créez-en un pour commencer.
                </p>
              )}
              {roles.map(role => (
                <div key={role.id}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-border/30 last:border-0">
                  <RolePill role={role} />
                  <div className="flex gap-1 flex-1 flex-wrap">
                    {role.permissions.map(p => (
                      <span key={p}
                        className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {PERMISSION_LABELS[p].split(" ")[0]}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setMode({ type: "edit", role })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button type="button"
                      onClick={() => onRolesChange(roles.filter(r => r.id !== role.id))}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => setMode({ type: "create" })}>
                + Nouveau rôle
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </div>
        )}

        {mode?.type === "create" && (
          <RoleForm
            onSave={handleCreate}
            onCancel={() => setMode(null)}
            saveLabel="Créer le rôle"
          />
        )}
        {mode?.type === "edit" && (
          <RoleForm
            initial={mode.role}
            onSave={data => handleEdit(mode.role.id, data)}
            onCancel={() => setMode(null)}
            saveLabel="Enregistrer"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}


interface DialogCreerEquipeProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onCreate:     (name: string, description: string) => void
}

export function DialogCreerEquipe({
  open, onOpenChange, onCreate,
}: DialogCreerEquipeProps) {
  const [name, setName]        = useState("")
  const [description, setDesc] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), description.trim())
    // Reset
    setName("")
    setDesc("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle équipe</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Créez un groupe de travail. Vous pourrez y ajouter des membres
            puis leur assigner des datasets depuis chaque page de dataset.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nom de l'équipe *</Label>
            <Input
              placeholder="Ex : Équipe NLP Francophone"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description (optionnel)</Label>
            <Input
              placeholder="Ex : Spécialisée dans les entités nommées"
              value={description}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
            Créer l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 3. Dialog : Choisir un rôle pour rejoindre
// ─────────────────────────────────────────────

interface DialogChoisirRoleProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  collaborator: Collaborator | null
  roles:        Role[]
  onAdd:        (collaborator: Collaborator, role: Role) => void
}

export function DialogChoisirRole({
  open, onOpenChange, collaborator, roles, onAdd,
}: DialogChoisirRoleProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id ?? "")

  if (!collaborator) return null

  const handleAdd = () => {
    const role = roles.find(r => r.id === selectedRoleId)
    if (role) { onAdd(collaborator, role); onOpenChange(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Choisir un rôle</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Quel rôle souhaitez-vous donner à {collaborator.name} dans l'équipe ?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CollabMiniCard collaborator={collaborator} />
          {roles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 rounded-lg border border-border/50">
              Aucun rôle disponible. Créez d'abord des rôles depuis "Gérer les rôles".
            </p>
          ) : (
            <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
              {roles.map(role => (
                <button key={role.id} type="button" onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                    "hover:bg-muted/50 border-b border-border/30 last:border-0",
                    selectedRoleId === role.id && "bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <RolePill role={role} />
                    <div className="flex gap-1 flex-wrap">
                      {role.permissions.map(p => (
                        <span key={p}
                          className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {PERMISSION_LABELS[p].split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedRoleId === role.id && (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleAdd} disabled={roles.length === 0}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter à l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 4. Dialog : Inviter par email
// ─────────────────────────────────────────────

interface DialogInviterProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onInvite:     (email: string) => void
}

export function DialogInviter({ open, onOpenChange, onInvite }: DialogInviterProps) {
  const [email, setEmail] = useState("")

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSend = () => {
    if (!isValid) return
    onInvite(email.trim())
    setEmail("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Inviter un collaborateur</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Un email d'invitation sera envoyé. Une fois acceptée, la personne
            apparaîtra dans "Collaborateurs disponibles" et vous pourrez
            l'ajouter à l'équipe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Adresse email</Label>
          <Input
            type="email"
            placeholder="prenom@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            className="h-8 text-xs"
            autoFocus
          />
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

// ─────────────────────────────────────────────
// 5. Dialog : Changer le rôle d'un membre
// ─────────────────────────────────────────────

interface DialogChangerRoleProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  member:       TeamMember | null
  roles:        Role[]
  onRoleChange: (collaboratorId: string, role: Role) => void
}

export function DialogChangerRole({
  open, onOpenChange, member, roles, onRoleChange,
}: DialogChangerRoleProps) {
  const [selectedId, setSelectedId] = useState(member?.role.id ?? "")

  if (!member) return null

  const handleSave = () => {
    const role = roles.find(r => r.id === selectedId)
    if (role) onRoleChange(member.collaborator.id, role)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription className="sr-only">
            Modifier le rôle de {member.collaborator.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <MemberHeader member={member} />
          {roles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Aucun rôle disponible. Créez d'abord des rôles depuis "Gérer les rôles".
            </p>
          ) : (
            <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
              {roles.map(role => (
                <button key={role.id} type="button" onClick={() => setSelectedId(role.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                    "hover:bg-muted/50 border-b border-border/30 last:border-0",
                    selectedId === role.id && "bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <RolePill role={role} />
                    <div className="flex gap-1 flex-wrap">
                      {role.permissions.map(p => (
                        <span key={p}
                          className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {PERMISSION_LABELS[p].split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedId === role.id && (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={roles.length === 0}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 6. Dialog : Détails membre
// ─────────────────────────────────────────────

interface DialogDetailsProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  member:       TeamMember | null
}

export function DialogDetails({ open, onOpenChange, member }: DialogDetailsProps) {
  if (!member) return null

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Email",               value: member.collaborator.email },
    { label: "Rôle",                value: <RolePill role={member.role} /> },
    {
      label: "Annotations ce mois",
      value: <span className="text-emerald-600 font-medium">{member.annotations.toLocaleString("fr-FR")}</span>,
    },
    {
      label: "Membre depuis",
      value: new Date(member.joinedAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
    { label: "Dernière activité", value: member.lastActive },
    {
      label: "Permissions",
      value: (
        <div className="flex flex-col gap-1 items-end">
          {member.role.permissions.map(p => (
            <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              {PERMISSION_LABELS[p]}
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Détails</DialogTitle>
          <DialogDescription className="sr-only">
            Fiche de {member.collaborator.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <MemberHeader member={member} />
          <div className="flex flex-col divide-y divide-border/40">
            {rows.map(row => (
              <div key={row.label}
                className="flex items-start justify-between gap-4 py-2.5">
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

// ─────────────────────────────────────────────
// 7. Dialog : Retirer de l'équipe
// ─────────────────────────────────────────────

interface DialogRetirerProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  member:       TeamMember | null
  onConfirm:    (collaboratorId: string) => void
}

export function DialogRetirer({
  open, onOpenChange, member, onConfirm,
}: DialogRetirerProps) {
  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Retirer de l'équipe</DialogTitle>
          <DialogDescription className="sr-only">
            Confirmer le retrait de {member.collaborator.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
            <Trash2 className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <strong>{member.collaborator.name}</strong> perdra immédiatement
              l'accès à tous les datasets et tâches associés à cette équipe.
              Cette action est irréversible.
            </p>
          </div>
          <MemberHeader member={member} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" variant="destructive"
            onClick={() => { onConfirm(member.collaborator.id); onOpenChange(false) }}
          >
            Retirer de l'équipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}