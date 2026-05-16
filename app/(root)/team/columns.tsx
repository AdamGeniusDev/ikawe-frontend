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

interface ActionHandlers {
  onChangeRole: (m: TeamMember) => void
  onDetails:    (m: TeamMember) => void
  onRemove:     (m: TeamMember) => void
}

export function buildColumns(handlers: ActionHandlers): ColumnDef<TeamMember>[] {
  return [
    {
      id: "member",
      header: "Membre",
      cell: ({ row }) => {
        const { collaborator } = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              collaborator.avatarColor
            )}>
              {collaborator.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{collaborator.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{collaborator.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      id: "role",
      header: "Rôle",
      cell: ({ row }) => {
        const { role } = row.original
        return (
          <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", role.color)}>
            {role.name}
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
            day: "numeric", month: "short", year: "numeric"
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