// app/dashboard/page.tsx
"use client"

import { useMemo } from "react"
import {
  Zap, Layers, CheckCircle2,
  ArrowUpRight, Clock,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_TASKS, STATUS_META} from "@/types/tasks"
import { useRouter } from "next/navigation"


type ActivityItem = {
  initials: string
  color:    string
  text:     React.ReactNode
  time:     string
}


const WEEK_BARS = [45, 60, 38, 72, 55, 80, 100] // pourcentages
const WEEK_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Auj"]

const ACTIVITY: ActivityItem[] = [
  {
    initials: "JK",
    color:    "bg-violet-100 text-violet-700",
    text:     <>Vous avez complété 120 annotations sur <strong>phones_images_batch2</strong></>,
    time:     "Il y a 1h",
  },
  {
    initials: "AM",
    color:    "bg-blue-100 text-blue-700",
    text:     <><strong>Amina M.</strong> a partagé <strong>produits_telecom_dakar.json</strong> avec vous</>,
    time:     "Il y a 3h",
  },
  {
    initials: "KD",
    color:    "bg-emerald-100 text-emerald-700",
    text:     <><strong>Kofi D.</strong> a validé la tâche <strong>Détection objets v2</strong></>,
    time:     "Hier",
  },
]

// ── sous-composants ───────────────────────────────────────────────

function StatCard({
  label, value, sub, subVariant, icon: Icon,
}: {
  label:       string
  value:       string | number
  sub?:        string
  subVariant?: "positive" | "negative" | "neutral"
  icon:        LucideIcon
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight leading-none">{value}</p>
      {sub && (
        <p className={cn("text-[11px] font-medium", {
          "text-emerald-600": subVariant === "positive",
          "text-red-500":     subVariant === "negative",
          "text-muted-foreground": !subVariant || subVariant === "neutral",
        })}>
          {sub}
        </p>
      )}
    </div>
  )
}

function DataTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    image: "bg-violet-100 text-violet-700",
    audio: "bg-pink-100 text-pink-700",
    csv:   "bg-blue-100 text-blue-700",
    json:  "bg-amber-100 text-amber-700",
    text:  "bg-emerald-100 text-emerald-700",
  }
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded w-8 text-center shrink-0", map[type] ?? "bg-muted text-muted-foreground")}>
      {type.toUpperCase().slice(0, 3)}
    </span>
  )
}


export default function DashboardPage() {
  const router = useRouter()
  const tasks       = MOCK_TASKS
  const inProgress  = useMemo(() => tasks.filter(t => t.status === "in_progress"), [tasks])
  const totalAnnotated = useMemo(() => tasks.reduce((a, t) => a + t.completedElements, 0), [tasks])

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px]">
            <span className="text-secondary">Dashboard</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">Bienvenue, Jean</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Annotations aujourd'hui" value={284}            sub="↑ 18 % vs hier"          subVariant="positive" icon={CheckCircle2} />
          <StatCard label="Tâches en cours"          value={inProgress.length} sub="3 urgentes"          subVariant="negative" icon={Zap}          />
          <StatCard label="Mes datasets"             value={tasks.length}  sub="4 partagés"              subVariant="neutral"  icon={Layers}       />
        </div>

        {/* Datasets + Tâches actives */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">

          {/* Datasets récents */}
          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Datasets récents</span>
              <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5" onClick={()=> router.push('/datasets')}>
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <DataTypeBadge type={t.dataType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.datasetSource}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t.totalElements.toLocaleString("fr-FR")} entrées
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", STATUS_META[t.status].className)}>
                    {STATUS_META[t.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tâches actives */}
          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Tâches actives</span>
              <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5" onClick={()=> router.push('/tasks')}>
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {inProgress.slice(0, 4).map(t => {
                const pct = Math.round((t.completedElements / t.totalElements) * 100)
                const urgency = pct < 30 ? "bg-red-400" : pct < 70 ? "bg-amber-400" : "bg-emerald-400"
                return (
                  <div key={t.id} className="flex items-start gap-2.5 py-2.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", urgency)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {t.deadline} · {t.completedElements}/{t.totalElements}
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activité + Mini-chart */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Activité récente */}
          <div className="rounded-xl border bg-background p-4">
            <span className="text-sm font-semibold">Activité récente</span>
            <div className="flex flex-col divide-y divide-border/40 mt-3">
              {ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0", item.color)}>
                    {item.initials}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex-1 leading-relaxed">{item.text}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Annotations cette semaine */}
          <div className="rounded-xl border bg-background p-4">
            <span className="text-sm font-semibold">Annotations cette semaine</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-semibold">{totalAnnotated.toLocaleString("fr-FR")}</span>
              <span className="text-[11px] text-emerald-600 font-medium">↑ 8 % vs semaine dernière</span>
            </div>
            <div className="flex items-end gap-1 h-10 mt-3">
              {WEEK_BARS.map((h, i) => (
                <div
                  key={i}
                  className={cn("flex-1 rounded-t", i === 6 ? "bg-indigo-500" : "bg-muted")}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {WEEK_LABELS.map(l => (
                <span key={l} className="text-[9px] text-muted-foreground flex-1 text-center">{l}</span>
              ))}
            </div>
            {/* Répartition par type */}
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground mb-2">Répartition par type</p>
              {[
                { label: "IMG", pct: 58, color: "bg-indigo-500" },
                { label: "TXT", pct: 27, color: "bg-amber-400"  },
                { label: "AUD", pct: 15, color: "bg-emerald-500"},
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-muted-foreground w-7">{label}</span>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pct} %</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}