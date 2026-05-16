"use client"

// ─────────────────────────────────────────────
// app/taches/columns.tsx
// ─────────────────────────────────────────────

import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown, CheckCircle2, Clock,
  MoreHorizontal, Zap,
  ImageIcon, Music, FileText, Table2, Braces,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import {
  Task,
  DataType,
  STATUS_META,
} from "@/types/tasks"  

import { DATA_TYPE_LABELS } from "@/types/datasets"

// ─────────────────────────────────────────────
// HELPERS VISUELS
// ─────────────────────────────────────────────

function pct(t: Task) {
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

// ─────────────────────────────────────────────
// COLONNES
// ─────────────────────────────────────────────

export const columns: ColumnDef<Task>[] = [

  // ── Tâche ──────────────────────────────────
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tâche
        <ArrowUpDown className="ml-1 h-3 w-3" />
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
              {task.labels.slice(0, 3).map((l) => (
                <span
                  key={l.id}
                  className="rounded-full px-1.5 py-px text-[9px] font-semibold text-white leading-tight"
                  style={{ backgroundColor: l.color }}
                >
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

  // ── Dataset source ──────────────────────────
  {
    accessorKey: "datasetSource",
    header: () => (
      <span className="text-[11px] font-semibold text-muted-foreground">
        Dataset source
      </span>
    ),
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

  // ── Avancement ─────────────────────────────
  {
    id: "progress",
    accessorFn: (row) => pct(row),
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Avancement
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const task        = row.original
      const progress    = pct(task)
      const isCompleted = task.status === "completed"
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
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )
    },
  },

  // ── Échéance ────────────────────────────────
  {
    accessorKey: "deadline",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground hidden sm:flex"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Échéance
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
        <Clock className="h-3 w-3 shrink-0" />
        {row.getValue("deadline")}
      </div>
    ),
  },

  // ── Statut ──────────────────────────────────
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Statut
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const status      = row.getValue("status") as Task["status"]
      const isCompleted = status === "completed"
      const meta        = STATUS_META[status]
      return isCompleted ? (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3" />
          Terminée
        </span>
      ) : (
        <span className={cn(
          "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
          meta.className
        )}>
          {meta.label}
        </span>
      )
    },
    // filterFn utilisée par le statusFilter externe du DataTable
    filterFn: (row, _id, filterValues: string[]) => {
      if (!filterValues.length) return true
      return filterValues.includes(row.getValue("status"))
    },
  },

  // ── Actions ─────────────────────────────────
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => {
      const task = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => console.log("détails", task.id)}>
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("modifier", task.id)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => console.log("supprimer", task.id)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]