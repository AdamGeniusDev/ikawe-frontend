"use client"

// app/(root)/tasks/columns.tsx

import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown, CheckCircle2, Clock, MoreHorizontal,
  Zap, Eye, Settings, XCircle,
  ImageIcon, Music, FileText, Table2, Braces,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Task, DataType, STATUS_META } from "@/types/tasks"
import { DATA_TYPE_LABELS } from "@/types/datasets"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(t: Task): number {
  if (t.totalElements === 0) return 0
  return Math.round((t.completedElements / t.totalElements) * 100)
}

function DataTypeIcon({ type, className }: { type: DataType; className?: string }) {
  if (type === "image") return <ImageIcon className={cn("text-blue-500",    className)} />
  if (type === "audio") return <Music     className={cn("text-violet-500",  className)} />
  if (type === "csv")   return <Table2    className={cn("text-emerald-500", className)} />
  if (type === "json")  return <Braces    className={cn("text-amber-500",   className)} />
  return                        <FileText  className={cn("text-amber-500",   className)} />
}

// ─── buildColumns ─────────────────────────────────────────────────────────────
// currentUserId   — pour calculer les droits dans la colonne actions
// onViewDetails   — navigue vers /tasks/[task.id]
// onCancelTask    — ouvre la modal de confirmation dans la page

export function buildColumns(
  currentUserId: string,
  onViewDetails: (task: Task) => void,
  onCancelTask:  (task: Task) => void,
): ColumnDef<Task>[] {
  return [

    // ── Tâche ────────────────────────────────────────────────────────────────
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Tâche <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <DataTypeIcon type={task.dataType} className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate leading-snug">{task.title}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.labels.slice(0, 3).map(l => (
                  <span key={l.id}
                    className="rounded-full px-1.5 py-px text-[9px] font-semibold text-white leading-tight"
                    style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
                {task.labels.length > 3 && (
                  <span className="text-[9px] text-muted-foreground self-center">
                    +{task.labels.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      },
    },

    // ── Dataset source ────────────────────────────────────────────────────────
    {
      accessorKey: "datasetSource",
      header: () => <span className="text-[11px] font-semibold text-muted-foreground">Dataset source</span>,
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground truncate max-w-40">
                {task.datasetSource}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 pl-4.5">
              {DATA_TYPE_LABELS[task.dataType]} · {task.totalElements.toLocaleString("fr-FR")} élém.
            </p>
          </div>
        )
      },
    },

    // ── Avancement ────────────────────────────────────────────────────────────
    {
      id: "progress",
      accessorFn: row => pct(row),
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Avancement <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const task     = row.original
        const progress = pct(task)
        const isDone   = task.status === "completed"
        return (
          <div className="flex flex-col gap-1.5 min-w-30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {task.completedElements.toLocaleString("fr-FR")}&thinsp;/&thinsp;
                {task.totalElements.toLocaleString("fr-FR")}
              </span>
              <span className="text-[10px] font-bold tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  isDone ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )
      },
    },

    // ── Échéance ──────────────────────────────────────────────────────────────
    {
      accessorKey: "deadline",
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground hidden sm:flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Échéance <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" />
          {row.getValue("deadline")}
        </div>
      ),
    },

    // ── Statut ────────────────────────────────────────────────────────────────
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Statut <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as Task["status"]
        const isDone = status === "completed"
        const m      = STATUS_META[status]
        return isDone ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Terminée
          </span>
        ) : (
          <span className={cn(
            "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
            m.className
          )}>
            {m.label}
          </span>
        )
      },
      filterFn: (row, _id, filterValues: string[]) => {
        if (!filterValues.length) return true
        return filterValues.includes(row.getValue("status"))
      },
    },

    
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const task      = row.original
        const isOwner   = task.ownerId === currentUserId
        const canEdit   = isOwner && task.status === "pending"
        const isLocked  = isOwner && task.status === "in_progress"
        const canCancel = isOwner && task.status !== "completed"

        return (
          <TooltipProvider delayDuration={200}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-48">

                {/* Voir le détail — toujours disponible, navigue vers la page détail */}
                <DropdownMenuItem onClick={() => onViewDetails(task)}>
                  <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  Voir en détail
                </DropdownMenuItem>

                {/* Modifier la configuration — owner + job pending uniquement */}
                {canEdit && (
                  <DropdownMenuItem onClick={() => console.log("modifier config", task.jobId)}>
                    <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    Modifier la config
                  </DropdownMenuItem>
                )}

                {/* Modifier la configuration — grisé avec tooltip si in_progress */}
                {isLocked && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* div nécessaire : DropdownMenuItem disabled absorbe les events du Tooltip */}
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground/40 cursor-not-allowed select-none rounded-sm">
                        <Settings className="h-3.5 w-3.5 shrink-0" />
                        Modifier la config
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-55 text-[11px] leading-relaxed">
                      Configuration verrouillée — des annotations sont déjà en cours.
                      Pour changer les labels ou la tâche, annulez ce job et recréez-en un.
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Annuler la tâche — owner, pas si terminée */}
                {canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onCancelTask(task)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2" />
                      Annuler la tâche
                    </DropdownMenuItem>
                  </>
                )}

              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        )
      },
    },
  ]
}

// Export statique de compatibilité
export const columns = buildColumns('', () => {}, () => {})