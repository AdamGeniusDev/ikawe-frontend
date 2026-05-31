"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, UserCog, Info, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TeamMember } from "@/types/team"
import { User, TEAM_ROLE_LABELS } from "@/types/user"
import { getAvatarProps } from "@/types/user"
import Image from "next/image"

// Couleur de badge par rôle — local à ce fichier, pas besoin dans les types
const ROLE_BADGE_COLORS: Record<string, string> = {
  team_owner: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  team_admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  reviewer:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  annotator:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  viewer:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

// La ligne = TeamMember enrichi avec son User (aplati par le parent)
export type TeamMemberRow = TeamMember & { user: User }

interface ActionHandlers {
  onChangeRole: (m: TeamMember) => void
  onDetails:    (m: TeamMember) => void
  onRemove:     (m: TeamMember) => void
}

export function buildColumns(handlers: ActionHandlers): ColumnDef<TeamMemberRow>[] {
  return [
    {
      id: "member",
      header: "Membre",
      cell: ({ row }) => {
        const { user } = row.original
        const avatar = getAvatarProps(user)

        return (
          <div className="flex items-center gap-2.5">
            {avatar.avatarUrl ? (
              <Image
                src={avatar.avatarUrl}
                alt={user.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: avatar.color }}
              >
                {avatar.initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      id: "role",
      header: "Rôle",
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", ROLE_BADGE_COLORS[role])}>
            {TEAM_ROLE_LABELS[role]}
          </span>
        )
      },
    },
    {
      id: "annotations",
      header: "Annotations ce mois",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-emerald-600">
          {row.original.annotations.toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      id: "joinedAt",
      header: "Membre depuis",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.joinedAt).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "lastActive",
      header: "Dernière activité",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.lastActive}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const m = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 data-[state=open]:bg-muted"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handlers.onDetails(m)}>
                <Info className="h-3.5 w-3.5 mr-2" />
                Détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlers.onChangeRole(m)}>
                <UserCog className="h-3.5 w-3.5 mr-2" />
                Changer le rôle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlers.onRemove(m)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Retirer de l'équipe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}