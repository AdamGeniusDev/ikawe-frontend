"use client"

import { useEffect, useMemo, useCallback, useState } from "react"
import { ImageIcon, Music, FileText, Check, Info, EyeOff, Maximize2, Play, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dataset, DatasetElementUI, DataType,DatasetElementStatus } from "@/types/datasets"
import { ElementPreviewModal } from "./elementConfigModal"



export interface ElementConfig {
  id: string
  include: boolean
}

export interface ElementConfiguratorProps {
  dataset: Dataset
  onConfigChange?: (configs: ElementConfig[]) => void
  className?: string
}

type FilterValue = "all" | DatasetElementStatus

// ─────────────────────────────────────────────
// MOCK
// ─────────────────────────────────────────────

function generateMockElements(
  id: string,
  dataType: string,
  totalFiles: number,
  annotatedFiles: number,
): DatasetElementUI[] {
  const type = dataType as DataType
  const total = Math.min(totalFiles, 200)
  const statusPool: DatasetElementUI["status"][] = [
    "unannotated", "unannotated", "unannotated",
    "annotated", "in_review", "rejected",
  ]

  return Array.from({ length: total }, (_, i) => {
    const idx = i + 1
    const el: DatasetElementUI = {
      id:   `${id}_el_${String(idx).padStart(3, "0")}`,
      name: type === "image" ? `img_${String(idx).padStart(3, "0")}.jpg`
          : type === "audio" ? `audio_${String(idx).padStart(3, "0")}.mp3`
          : `doc_${String(idx).padStart(3, "0")}.txt`,
      type,
      status: idx <= annotatedFiles ? "annotated" : statusPool[i % statusPool.length],
    }

    if (type === "image") {
      el.sizeBytes  = 180_000 + Math.floor(Math.random() * 400_000)
      el.previewUrl = `https://placehold.co/200x200/e2e8f0/94a3b8?text=${encodeURIComponent(el.name)}`
    }
    if (type === "audio")  el.durationSeconds = 15 + Math.floor(Math.random() * 180)
    if (["text", "json", "csv"].includes(type)) el.wordCount = 80 + Math.floor(Math.random() * 600)

    return el
  })
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatSize(bytes?: number) {
  if (!bytes) return null
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} Ko`
    : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatDuration(secs?: number) {
  if (!secs) return null
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
}

function elementMeta(el: DatasetElementUI) {
  if (el.type === "image") return formatSize(el.sizeBytes)
  if (el.type === "audio") return formatDuration(el.durationSeconds)
  return el.wordCount ? `${el.wordCount} mots` : null
}

// ─────────────────────────────────────────────
// PETITS COMPOSANTS
// ─────────────────────────────────────────────

function TypeIcon({ type, className }: { type: DataType; className?: string }) {
  if (type === "image") return <ImageIcon className={cn("text-blue-500",   className)} />
  if (type === "audio") return <Music     className={cn("text-violet-500", className)} />
  return                       <FileText  className={cn("text-amber-500",  className)} />
}

function StatusBadge({ status }: { status?: DatasetElementUI["status"] }) {
  if (!status || status === "unannotated") return null
  const styles: Record<string, string> = {
    in_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rejected:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    annotated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  }
  const labels: Record<string, string> = {
    in_review: "En révision", rejected: "Rejeté", annotated: "Annoté",
  }
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", styles[status])}>
      {labels[status]}
    </span>
  )
}

// Icône du bouton de prévisualisation selon le type
function PreviewIcon({ type }: { type: DataType }) {
  if (type === "image") return <Maximize2 className="h-3 w-3" />
  if (type === "audio") return <Play      className="h-3 w-3" />
  return                       <Eye       className="h-3 w-3" />
}

// ─────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────

function FilterBar({ elements, active, onChange }: {
  elements: DatasetElementUI[]
  active: FilterValue
  onChange: (v: FilterValue) => void
}) {
  const counts: Record<FilterValue, number> = {
    all:         elements.length,
    unannotated: elements.filter((e) => !e.status || e.status === "unannotated").length,
    annotated:   elements.filter((e) => e.status === "annotated").length,
    in_review:   elements.filter((e) => e.status === "in_review").length,
    rejected:    elements.filter((e) => e.status === "rejected").length,
  }
  const tabs: { value: FilterValue; label: string }[] = [
    { value: "all",         label: "Tous" },
    { value: "unannotated", label: "Non annotés" },
    { value: "annotated",   label: "Annotés" },
    { value: "in_review",   label: "En révision" },
    { value: "rejected",    label: "Rejetés" },
  ]

  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.filter((t) => t.value === "all" || counts[t.value] > 0).map((tab) => (
        <button key={tab.value} type="button" onClick={() => onChange(tab.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
            active === tab.value
              ? "bg-primary/10 border-primary/40 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}>
          {tab.label}
          <span className={cn(
            "text-[10px] rounded-full px-1.5 font-bold",
            active === tab.value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {counts[tab.value]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// CARD GRID
// ─────────────────────────────────────────────

export function CardGrid({ element, config, onToggle }: {
  element: DatasetElementUI
  config: ElementConfig
  onToggle: () => void
}) {
  const meta = elementMeta(element)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div className={cn(
        "relative flex flex-col rounded-xl border overflow-hidden transition-all duration-150",
        config.include
          ? "border-border bg-background shadow-sm"
          : "border-border/30 bg-muted/20 opacity-45"
      )}>
        {/* Preview */}
        <div className="relative aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
            <TypeIcon type={element.type} className="h-5 w-5" />
            {meta && <span className="text-[9px]">{meta}</span>}
          </div>

          {/* Bouton inclure / exclure */}
          <button type="button" onClick={onToggle}
            className={cn(
              "absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
              config.include
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-white/80 dark:bg-zinc-900/80 border-border text-transparent hover:border-primary/60"
            )}>
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </button>

          <div className="absolute bottom-1 left-1">
            <StatusBadge status={element.status} />
          </div>
        </div>

        {/* Nom + bouton preview */}
        <div className="flex flex-row items-center justify-between px-2 py-1.5">
          <p className="text-[10px] font-medium truncate text-foreground/75">{element.name}</p>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-md border shrink-0 px-1 py-1 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <PreviewIcon type={element.type} />
          </button>
        </div>
      </div>

      {/* Modal — en dehors du div de la card pour éviter tout conflit de z-index */}
      <ElementPreviewModal
        element={element}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export function ElementConfigurator({ dataset, onConfigChange, className }: ElementConfiguratorProps) {
  const { id, dataType, totalFiles, annotatedFiles, title } = dataset

  const elements = useMemo(
    () => generateMockElements(id, dataType, totalFiles, annotatedFiles ?? 0),
    [id, dataType, totalFiles, annotatedFiles]
  )

  const [configs, setConfigs] = useState<Map<string, ElementConfig>>(
    () => new Map(elements.map((el) => [el.id, { id: el.id, include: true }]))
  )
  const [filter, setFilter] = useState<FilterValue>("all")

  useEffect(() => {
    onConfigChange?.([...configs.values()])
  }, [configs, onConfigChange])

  const toggleInclude = useCallback((id: string) => {
    setConfigs((prev) => {
      const next = new Map(prev)
      next.set(id, { ...next.get(id)!, include: !next.get(id)!.include })
      return next
    })
  }, [])

  const selectFiltered = (include: boolean) =>
    setConfigs((prev) => {
      const next = new Map(prev)
      filteredElements.forEach((el) => next.set(el.id, { ...next.get(el.id)!, include }))
      return next
    })

  const filteredElements = elements.filter((el) => {
    if (filter === "all")         return true
    if (filter === "unannotated") return !el.status || el.status === "unannotated"
    return el.status === filter
  })

  return (
    <div className={cn("flex flex-col gap-5", className)}>

      {/* Bandeau d'info */}
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{elements.length} éléments</strong> dans{" "}
          <strong className="text-foreground">{title}</strong>.{" "}
          Sélectionnez ceux à inclure dans la session d'annotation.
        </p>
      </div>

      {/* Barre de contrôles */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterBar elements={elements} active={filter} onChange={setFilter} />

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => selectFiltered(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Tout sélectionner
          </button>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <button type="button" onClick={() => selectFiltered(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Désélectionner
          </button>
          <span className="text-muted-foreground/30 text-xs">·</span>
        </div>
      </div>

      {/* Notice aperçu limité */}
      {totalFiles > 200 && (
        <p className="text-xs text-muted-foreground -mt-2 flex items-center gap-1.5">
          <Info className="h-3 w-3 shrink-0" />
          Aperçu limité à 200 éléments sur {totalFiles.toLocaleString("fr")} au total.
        </p>
      )}

      {/* Grille d'éléments */}
      {filteredElements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2">
          <EyeOff className="h-7 w-7 opacity-30" />
          <p className="text-sm">Aucun élément dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filteredElements.map((el) => (
            <CardGrid key={el.id} element={el} config={configs.get(el.id)!}
              onToggle={() => toggleInclude(el.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────

export function ElementConfigSummary({ configs, datasetTitle }: {
  configs: ElementConfig[]
  datasetTitle?: string
}) {
  const included = configs.filter((c) => c.include).length
  if (included === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <p className="font-semibold text-primary text-sm">
          {included} élément{included > 1 ? "s" : ""} sélectionné{included > 1 ? "s" : ""}
        </p>
      </div>
      {datasetTitle && (
        <p className="text-xs text-muted-foreground">{datasetTitle}</p>
      )}
    </div>
  )
}