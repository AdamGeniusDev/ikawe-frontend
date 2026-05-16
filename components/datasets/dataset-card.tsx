import { Archive, AudioLines, Copy, Download, Eye, FileText, Globe, ImageIcon, Lock, LucideIcon, MoreHorizontal, Pen, Sheet, Trash, Users } from "lucide-react"
import { Dataset } from "@/types/datasets"
import { formatDate } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useRouter } from "next/router"


interface SecondaryActionProps {
  label: string
  icon: LucideIcon
  action: (dataset: Dataset) => void
  destructive?: boolean
}

export const DATA_TYPE_ICON: Record<string, React.ReactNode> = {
  image: <ImageIcon size={14} />,
  audio: <AudioLines size={14} />,
  text:  <FileText size={14} />,
  csv:   <Sheet size={14} />,
  json:  <FileText size={14} />,
}

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  draft:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived:  "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
}

const STATUS_LABEL: Record<string, string> = {
  active:    "Actif",
  draft:     "Brouillon",
  completed: "Terminé",
  in_review: "En révision",
  archived:  "Archivé",
}

const VISIBILITY_ICON: Record<string, React.ReactNode> = {
  private: <Lock size={12} />,
  team:    <Users size={12} />,
  public:  <Globe size={12} />,
}

const VISIBILITY_LABEL: Record<string, string> = {
  private: "Privé",
  team:    "Team",
  public:  "Public",
}

const MODIFY_ACTIONS: SecondaryActionProps[] = [
  { label: "Modifier les métadonnées", icon: Pen,     action: (d) => console.log("edit",    d.id) },
  { label: "Dupliquer",               icon: Copy,    action: (d) => console.log("dup",     d.id) },
  { label: "Changer la visibilité",   icon: Eye,     action: (d) => console.log("vis",     d.id) },
  { label: "Exporter",                icon: Download, action: (d) => console.log("export",  d.id) },
]

const DANGER_ACTIONS: SecondaryActionProps[] = [
  { label: "Archiver",   icon: Archive, action: (d) => console.log("archive", d.id), destructive: false },
  { label: "Supprimer",  icon: Trash,   action: (d) => console.log("delete",  d.id), destructive: true  },
]


// Couleur de la barre selon la progression
function barColor(progress: number): string {
  if (progress === 100) return "bg-green-500"
  if (progress >= 50)   return "bg-[#C8963E]"
  if (progress > 0)     return "bg-[#C8963E]/70"
  return "bg-zinc-200 dark:bg-zinc-700"
}

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : ligne de tâche
// ─────────────────────────────────────────────────────────────


interface TaskRowProps {
  /** Libellé du type : "Bounding box", "Classification", etc. */
  label: string
  /** Couleur du badge type (classe Tailwind bg-* ou hex inline) */
  badgeClass: string
  /** 0 – 100 */
  progress: number
  /** Ex: "966 / 2 300" */
  countLabel: string
}

function TaskRow({ label, badgeClass, progress, countLabel }: TaskRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Badge type de tâche */}
      <span
        className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md ${badgeClass}`}
      >
        {label}
      </span>

      {/* Barre */}
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(progress)}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Pourcentage */}
      <span
        className={`shrink-0 text-[10px] font-medium tabular-nums min-w-7 text-right ${
          progress === 100
            ? "text-green-600 dark:text-green-400"
            : "text-muted-foreground"
        }`}
      >
        {Math.round(progress)}%
      </span>

      {/* Compteur */}
      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums hidden sm:block">
        {countLabel}
      </span>
    </div>
  )
}

export function DatasetCardDropdown({ dataset }: { dataset: Dataset }) {
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-0.5 transition-colors"
          aria-label="Options du dataset"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
 
      <DropdownMenuContent align="end" className="w-52">
 
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex items-center gap-3 hover:cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <FileText size={13} />
            <span className="text-[11px]">Details du dataset</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
 
        <DropdownMenuSeparator />
 
        {/* ── Actions de modification ───────────────────────── */}
        <DropdownMenuGroup>
          {MODIFY_ACTIONS.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="flex items-center gap-3 hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                item.action(dataset)
              }}
            >
              <item.icon size={13} />
              <span className="text-[11px]">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
 
        <DropdownMenuSeparator />
 
        <DropdownMenuGroup>
          {DANGER_ACTIONS.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className={[
                "flex items-center gap-3 hover:cursor-pointer",
                item.destructive
                  ? "text-destructive focus:text-destructive focus:bg-destructive/80"
                  : "",
              ].join(" ")}
              onClick={(e) => {
                e.stopPropagation()
                item.action(dataset)
              }}
            >
              <item.icon size={13} />
              <span className="text-[11px]">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
 
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


export function getTaskTypeMeta(taskType: string): {
  label: string
  badgeClass: string
} {
  switch (taskType) {
    case "object_detection":
      return { label: "Bounding box", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" }
    case "classification":
      return { label: "Classification", badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" }
    case "segmentation":
      return { label: "Segmentation", badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" }
    case "ner":
      return { label: "NER", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" }
    case "transcription":
      return { label: "Transcription", badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" }
    case "sentiment":
      return { label: "Sentiment", badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" }
    default:
      return { label: taskType, badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" }
  }
}

// ─────────────────────────────────────────────────────────────
// PROPS PRINCIPALES
// ─────────────────────────────────────────────────────────────


export interface DatasetCardTask {
  taskType: string
  progress: number        // 0–100
  annotatedFiles: number
  totalFiles: number
}

interface DatasetCardProps {
  dataset: Dataset
  tasks?: DatasetCardTask[]
  isSelected?: boolean
  onSelect?: (d: Dataset) => void
  isSelectable?: boolean
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function DatasetCard({
  dataset,
  tasks,
  isSelected,
  onSelect,
  isSelectable,
}: DatasetCardProps) {

 
  const displayTasks: DatasetCardTask[] = tasks && tasks.length > 0
    ? tasks
    : [{
        taskType: dataset.taskType,
        progress: dataset.annotationProgress,
        annotatedFiles: dataset.annotatedFiles,
        totalFiles: dataset.totalFiles,
      }]

  const isDraft = dataset.status === "draft"

  return (
    <div
      onClick={() => isSelectable && onSelect?.(dataset)}
      className={[
        "flex flex-col rounded-xl border bg-white dark:bg-zinc-900 p-4 gap-3 transition-all duration-200",
        isSelectable
          ? "cursor-pointer hover:border-secondary"
          : "hover:shadow-md",
        isSelected
          ? "border-secondary ring-2 ring-secondary/40"
          : "border-zinc-200 dark:border-zinc-800",
        isDraft ? "opacity-75" : "",
      ].join(" ")}
    >

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
            {DATA_TYPE_ICON[dataset.dataType]}
            <span className="capitalize">{dataset.dataType}</span>
          </span>
          <span className="font-semibold text-sm truncate">{dataset.title}</span>
        </div>

        <DatasetCardDropdown dataset={dataset} />

      </div>

      {/* ── Description ────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {dataset.description}
      </p>

      {/* ── Tags ───────────────────────────────────────────── */}
      {dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dataset.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
          {dataset.tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              +{dataset.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* ── Séparateur ─────────────────────────────────────── */}
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 -mx-1" />

      {/* ── Section tâches ─────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Tâches d'annotation
        </span>

        {isDraft ? (
          <p className="text-[11px] text-muted-foreground italic">
            Aucune tâche — dataset en brouillon
          </p>
        ) : (
          displayTasks.map((task, i) => {
            const { label, badgeClass } = getTaskTypeMeta(task.taskType)
            return (
              <TaskRow
                key={i}
                label={label}
                badgeClass={badgeClass}
                progress={task.progress}
                countLabel={`${task.annotatedFiles.toLocaleString()} / ${task.totalFiles.toLocaleString()}`}
              />
            )
          })
        )}
      </div>

      {/* ── Meta footer ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          <span>
            {dataset.sizeMb >= 1024
              ? `${(dataset.sizeMb / 1024).toFixed(1)} GB`
              : `${dataset.sizeMb} MB`}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>{formatDate(dataset.createdAt)}</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[dataset.status]}`}
          >
            {STATUS_LABEL[dataset.status]}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {VISIBILITY_ICON[dataset.visibility]}
          <span>{VISIBILITY_LABEL[dataset.visibility]}</span>
        </div>
      </div>

    </div>
  )
}