"use client"

// app/(root)/tasks/page.tsx

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, Zap, TrendingUp, Layers, ListTodo,
  LucideIcon, Search, XCircle, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { buildColumns } from "./columns"
import { Task, MOCK_TASKS } from "@/types/tasks"

// ─── Utilisateur courant ──────────────────────────────────────────────────────
// Changer en 'user-kofi' pour tester la vue annotateur sans droits owner

const CURRENT_USER_ID = 'user-owner'

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subPositive, icon: Icon }: {
  label:        string
  value:        string | number
  sub?:         string
  subPositive?: boolean
  icon:         LucideIcon
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && (
        <p className={cn("text-[11px] font-medium",
          subPositive ? "text-emerald-500" : "text-muted-foreground")}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ListTodo className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">Aucune tâche assignée</p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Les tâches apparaissent ici lorsque vous créez une session depuis
          la page Annoter, ou lorsqu'un batch vous est assigné.
        </p>
      </div>
    </div>
  )
}

// ─── CancelModal ──────────────────────────────────────────────────────────────

function CancelModal({ task, onClose, onConfirm }: {
  task:      Task | null
  onClose:   () => void
  onConfirm: (task: Task) => void
}) {
  if (!task) return null
  const hasAnnotations = task.completedElements > 0

  return (
    <Dialog open={!!task} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            Annuler la tâche ?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirmation d'annulation de {task.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-sm font-medium truncate">{task.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{task.datasetSource}</p>
          </div>

          {hasAnnotations ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 dark:text-red-400 leading-relaxed">
                <strong>{task.completedElements.toLocaleString("fr-FR")} éléments</strong> déjà
                annotés seront perdus. Cette action est irréversible.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Aucune annotation n'a encore été faite. La tâche sera supprimée définitivement.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" variant="destructive"
            onClick={() => { onConfirm(task); onClose() }}>
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabValue = "all" | "in_progress" | "pending" | "completed"

const TAB_FILTER: Record<TabValue, string[]> = {
  all:         [],
  in_progress: ["in_progress"],
  pending:     ["pending", "paused"],
  completed:   ["completed"],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter()
  const [activeTab,    setActiveTab]    = useState<TabValue>("all")
  const [search,       setSearch]       = useState("")
  const [taskToCancel, setTaskToCancel] = useState<Task | null>(null)

  const tasks = MOCK_TASKS

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks
    const q = search.toLowerCase()
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.datasetSource.toLowerCase().includes(q)
    )
  }, [tasks, search])

  const inProgress     = useMemo(() => tasks.filter(t => t.status === "in_progress"), [tasks])
  const pending        = useMemo(() => tasks.filter(t => t.status === "pending"),     [tasks])
  const completed      = useMemo(() => tasks.filter(t => t.status === "completed"),   [tasks])
  const paused         = useMemo(() => tasks.filter(t => t.status === "paused"),      [tasks])
  const totalAnnotated = useMemo(() => tasks.reduce((a, t) => a + t.completedElements, 0), [tasks])

  const columns = useMemo(() => buildColumns(
    CURRENT_USER_ID,
    // "Voir le détail" → navigue vers la page détail de la tâche
    (task) => router.push(`/tasks/${task.id}`),
    // "Annuler la tâche" → ouvre la modal de confirmation
    (task) => setTaskToCancel(task),
  ), [router])

  const handleCancelConfirm = (task: Task) => {
    console.log("annuler job", task.jobId)
    // En production :
    // await fetch(`/api/jobs/${task.jobId}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ status: 'cancelled' })
    // })
  }

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-[25px]">
            <span className="text-secondary">Mes tâches</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">Principal / Mes tâches</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">

        {tasks.length === 0 && <EmptyState />}

        {tasks.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Tâches totales"    value={tasks.length}                           sub="assignées"          icon={Layers}       />
              <StatCard label="En cours"           value={inProgress.length}                      sub="actives maintenant" icon={Zap}          />
              <StatCard label="Terminées ce mois"  value={completed.length}                       sub="+6 vs mois dernier" icon={TrendingUp}   subPositive />
              <StatCard label="Éléments annotés"   value={totalAnnotated.toLocaleString("fr-FR")} sub="cette semaine"      icon={CheckCircle2} />
            </div>

            {/* Recherche + Tabs + Table */}
            <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-4">

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par titre ou dataset…"
                  className="w-full h-8 pl-9 pr-9 text-xs rounded-lg border bg-muted/30 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}
                    aria-label="Effacer la recherche"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all"         className="text-xs px-3">Toutes ({tasks.length})</TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs px-3">En cours ({inProgress.length})</TabsTrigger>
                  <TabsTrigger value="pending"     className="text-xs px-3">En attente ({pending.length + paused.length})</TabsTrigger>
                  <TabsTrigger value="completed"   className="text-xs px-3">Terminées ({completed.length})</TabsTrigger>
                </TabsList>
              </Tabs>

              {search && filteredTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune tâche ne correspond à «&nbsp;{search}&nbsp;».
                </p>
              )}

              <DataTable
                columns={columns}
                data={filteredTasks}
                onRowClick={(task: Task) => router.push(`/tasks/${task.id}`)}
                statusFilter={TAB_FILTER[activeTab]}
              />
            </div>
          </>
        )}

      </div>

      {/* Modal de confirmation d'annulation */}
      <CancelModal
        task={taskToCancel}
        onClose={() => setTaskToCancel(null)}
        onConfirm={handleCancelConfirm}
      />

    </div>
  )
}