"use client"

// app/(root)/tasks/page.tsx

import { useMemo, useState } from "react"
import { Plus, CheckCircle2, Zap, TrendingUp, Layers, ListTodo, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { columns }   from "./columns"
import { Task, MOCK_TASKS } from "@/types/tasks"

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subPositive, icon: Icon }: {
  label:       string
  value:       string | number
  sub?:        string
  subPositive?: boolean
  icon:        LucideIcon
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
        <p className={cn(
          "text-[11px] font-medium",
          subPositive ? "text-emerald-500" : "text-muted-foreground"
        )}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ListTodo className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">Aucune tâche assignée</p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Créez votre première tâche pour commencer à annoter vos datasets.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateTask}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nouvelle tâche
      </button>
    </div>
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
  const [activeTab, setActiveTab] = useState<TabValue>("all")

  const tasks = MOCK_TASKS

  const inProgress     = useMemo(() => tasks.filter(t => t.status === "in_progress"), [tasks])
  const pending        = useMemo(() => tasks.filter(t => t.status === "pending"),     [tasks])
  const completed      = useMemo(() => tasks.filter(t => t.status === "completed"),   [tasks])
  const paused         = useMemo(() => tasks.filter(t => t.status === "paused"),      [tasks])
  const totalAnnotated = useMemo(() => tasks.reduce((acc, t) => acc + t.completedElements, 0), [tasks])

  const hasAnything = tasks.length > 0

  const handleCreate   = () => { /* router.push("/tasks/new") */ }
  const handleRowClick = (_task: Task) => { /* router.push(`/tasks/${_task.id}`) */ }

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
        {hasAnything && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">

        {!hasAnything && <EmptyState onCreateTask={handleCreate} />}

        {/* Stats */}
        {hasAnything && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tâches totales"    value={tasks.length}                           sub="assignées"          icon={Layers}       />
            <StatCard label="En cours"           value={inProgress.length}                      sub="actives maintenant" icon={Zap}          />
            <StatCard label="Terminées ce mois"  value={completed.length}                       sub="+6 vs mois dernier" icon={TrendingUp}   subPositive />
            <StatCard label="Éléments annotés"   value={totalAnnotated.toLocaleString("fr-FR")} sub="cette semaine"      icon={CheckCircle2} />
          </div>
        )}

        {/* Tabs + DataTable */}
        {hasAnything && (
          <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-4">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
              <TabsList className="h-8">
                <TabsTrigger value="all"         className="text-xs px-3">Toutes ({tasks.length})</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs px-3">En cours ({inProgress.length})</TabsTrigger>
                <TabsTrigger value="pending"     className="text-xs px-3">En attente ({pending.length + paused.length})</TabsTrigger>
                <TabsTrigger value="completed"   className="text-xs px-3">Terminées ({completed.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <DataTable
              columns={columns}
              data={tasks}
              onRowClick={handleRowClick}
              statusFilter={TAB_FILTER[activeTab]}
            />
          </div>
        )}

      </div>
    </div>
  )
}