"use client"

// components/datasets/annotationConfigurator.tsx


import { useEffect, useState, useCallback } from "react"
import {
  Tag, Plus, X, Info, BoxSelect, Fingerprint,
  Mic, ChevronRight, ToggleLeft, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dataset, TaskType } from "@/types/datasets"
import { ElementConfig } from "@/components/datasets/elementConfigurator"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnnotationLabel {
  id:    string
  name:  string
  color: string
}

export interface AnnotationConfig {
  taskType:      TaskType
  taskName:      string
  labels:        AnnotationLabel[]
  allowMultiple: boolean
  allowSkip:     boolean
  instructions?: string   
}

export interface AnnotationConfiguratorProps {
  dataset:         Dataset
  elementConfigs:  ElementConfig[]
  onConfigChange?: (config: AnnotationConfig | null) => void
  className?:      string
}

// ─── Tâches par type de dataset ───────────────────────────────────────────────

interface TaskDefinition {
  type:        TaskType
  label:       string
  description: string
  icon:        React.ReactNode
  needsLabels: boolean
}

const TASKS_BY_TYPE: Record<string, TaskDefinition[]> = {
  image: [
    { type: "classification", label: "Classification", description: "Attribuer une catégorie à chaque image",       icon: <Tag       className="h-4 w-4" />, needsLabels: true  },
    { type: "bounding_box",   label: "Bounding Box",   description: "Délimiter des objets par des rectangles",      icon: <BoxSelect className="h-4 w-4" />, needsLabels: true  },
    { type: "transcription",  label: "Transcription",  description: "Rédiger une description textuelle de l'image", icon: <Mic       className="h-4 w-4" />, needsLabels: false },
  ],
  audio: [
    { type: "transcription",  label: "Transcription",  description: "Retranscrire le contenu audio en texte",       icon: <Mic       className="h-4 w-4" />, needsLabels: false },
    { type: "classification", label: "Classification", description: "Catégoriser chaque fichier audio",             icon: <Tag       className="h-4 w-4" />, needsLabels: true  },
  ],
  text: [
    { type: "classification", label: "Classification", description: "Catégoriser chaque document texte",            icon: <Tag         className="h-4 w-4" />, needsLabels: true },
    { type: "sequence",       label: "NER / Séquence", description: "Identifier les entités nommées",              icon: <Fingerprint className="h-4 w-4" />, needsLabels: true },
  ],
  csv:  [{ type: "classification", label: "Classification de lignes", description: "Étiqueter chaque ligne du tableau", icon: <Tag className="h-4 w-4" />, needsLabels: true }],
  json: [{ type: "classification", label: "Classification",           description: "Catégoriser chaque entrée JSON",    icon: <Tag className="h-4 w-4" />, needsLabels: true }],
}

const DEFAULT_TASKS: TaskDefinition[] = [
  { type: "classification", label: "Classification", description: "Attribuer une catégorie à chaque élément", icon: <Tag className="h-4 w-4" />, needsLabels: true },
]

// ─── Couleurs ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f59e0b",
]

function getNextColor(usedColors: string[]): string {
  return PRESET_COLORS.find(c => !usedColors.includes(c))
    ?? PRESET_COLORS[usedColors.length % PRESET_COLORS.length]
}

function generateId() { return Math.random().toString(36).slice(2, 9) }

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SectionHeader({ label, subtitle, step }: { label: string; subtitle?: string; step: number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function SectionDivider() { return <div className="h-px bg-border/60 w-full" /> }

function TaskCard({ task, selected, onSelect }: { task: TaskDefinition; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-150",
        selected
          ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-background hover:border-border/80 hover:bg-muted/30"
      )}
    >
      <div className={cn("absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-all",
        selected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
        {selected && <div className="absolute inset-0.5 rounded-full bg-white" />}
      </div>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {task.icon}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>
          {task.label}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
      </div>
    </button>
  )
}

function LabelRow({ label, onRemove, onChange }: {
  label: AnnotationLabel; onRemove: () => void; onChange: (u: AnnotationLabel) => void
}) {
  const [showPalette, setShowPalette] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <div className="relative shrink-0">
        <button type="button" onClick={() => setShowPalette(p => !p)}
          className="flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all hover:scale-110"
          style={{ backgroundColor: label.color, borderColor: label.color }}
        />
        {showPalette && (
          <div className="absolute top-8 left-0 z-20 flex flex-wrap gap-1.5 rounded-xl border bg-popover p-2.5 shadow-lg w-[140px]">
            {PRESET_COLORS.map(color => (
              <button key={color} type="button"
                onClick={() => { onChange({ ...label, color }); setShowPalette(false) }}
                className={cn("h-5 w-5 rounded-md border-2 transition-all hover:scale-110",
                  label.color === color ? "border-foreground scale-110" : "border-transparent")}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
      <input
        type="text" value={label.name}
        onChange={e => onChange({ ...label, name: e.target.value })}
        placeholder="Nom du label…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
      <button type="button" onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function AnnotationConfigurator({
  dataset, elementConfigs, onConfigChange, className,
}: AnnotationConfiguratorProps) {
  const includedCount = elementConfigs.filter(c => c.include).length
  const tasks = TASKS_BY_TYPE[dataset.dataType] ?? DEFAULT_TASKS

  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null)
  const [labels,           setLabels]           = useState<AnnotationLabel[]>([])
  const [allowMultiple,    setAllowMultiple]     = useState(false)
  const [allowSkip,        setAllowSkip]         = useState(true)
  const [instructions,     setInstructions]      = useState("")   // ← NOUVEAU

  const selectedTask = tasks.find(t => t.type === selectedTaskType) ?? null

  const handleTaskSelect = useCallback((type: TaskType) => {
    setSelectedTaskType(type)
    setLabels([])
  }, [])

  const addLabel = useCallback(() => {
    const usedColors = labels.map(l => l.color)
    setLabels(prev => [...prev, { id: generateId(), name: "", color: getNextColor(usedColors) }])
  }, [labels])

  const removeLabel = useCallback((id: string) => setLabels(prev => prev.filter(l => l.id !== id)), [])
  const updateLabel = useCallback((updated: AnnotationLabel) => {
    setLabels(prev => prev.map(l => l.id === updated.id ? updated : l))
  }, [])

  // Remonte la config complète au parent — incluant instructions
  useEffect(() => {
    if (!selectedTask) { onConfigChange?.(null); return }
    const validLabels = labels.filter(l => l.name.trim())
    if (selectedTask.needsLabels && validLabels.length === 0) { onConfigChange?.(null); return }
    onConfigChange?.({
      taskType:      selectedTask.type,
      taskName:      selectedTask.label,
      labels:        selectedTask.needsLabels ? validLabels : [],
      allowMultiple,
      allowSkip,
      instructions:  instructions.trim() || undefined,  // ← inclus si non vide
    })
  }, [selectedTask, labels, allowMultiple, allowSkip, instructions, onConfigChange])

  // Numéro de section dynamique
  const optionsSectionStep    = selectedTask?.needsLabels ? 3 : 2
  const instructionsSectionStep = optionsSectionStep + 1

  return (
    <div className={cn("flex flex-col gap-7", className)}>

      {/* Bandeau contexte */}
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{includedCount} élément{includedCount > 1 ? "s" : ""}</strong>{" "}
          sélectionné{includedCount > 1 ? "s" : ""} dans{" "}
          <strong className="text-foreground">{dataset.title}</strong>.
          Configurez la tâche partagée par tous les groupes.
        </p>
      </div>

      {/* Section 1 — Tâche */}
      <div className="flex flex-col gap-4">
        <SectionHeader step={1} label="Tâche d'annotation"
          subtitle={`Types disponibles pour un dataset « ${dataset.dataType} »`} />
        <div className={cn(
          "grid gap-3",
          tasks.length === 1 ? "grid-cols-1 max-w-xs"
          : tasks.length === 2 ? "grid-cols-2 max-w-md"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {tasks.map(task => (
            <TaskCard key={task.type} task={task}
              selected={selectedTaskType === task.type}
              onSelect={() => handleTaskSelect(task.type)} />
          ))}
        </div>
      </div>

      {/* Section 2 — Labels (si besoin) */}
      {selectedTask?.needsLabels && (
        <>
          <SectionDivider />
          <div className="flex flex-col gap-4">
            <SectionHeader step={2} label="Labels / Classes"
              subtitle="Étiquettes que l'annotateur pourra attribuer" />
            <div className="flex flex-col gap-2">
              {labels.map(label => (
                <LabelRow key={label.id} label={label}
                  onRemove={() => removeLabel(label.id)}
                  onChange={updateLabel} />
              ))}
              <button type="button" onClick={addLabel}
                className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150 w-full">
                <Plus className="h-4 w-4" />
                Ajouter un label
              </button>
            </div>
            {labels.filter(l => l.name.trim()).length === 0 && (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <Info className="h-3 w-3 shrink-0" />
                Au moins un label est requis pour continuer
              </p>
            )}
          </div>
        </>
      )}

      {/* Info tâche sans labels */}
      {selectedTask && !selectedTask.needsLabels && (
        <>
          <SectionDivider />
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-primary/80 leading-relaxed">
              La tâche <strong className="text-primary">{selectedTask.label}</strong> ne
              nécessite pas de labels — l'annotateur saisit du texte libre.
            </p>
          </div>
        </>
      )}

      {/* Section Options */}
      {selectedTask && (
        <>
          <SectionDivider />
          <div className="flex flex-col gap-4">
            <SectionHeader step={optionsSectionStep} label="Options de session"
              subtitle="Paramètres de comportement pendant l'annotation" />
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-1">

              {selectedTask.needsLabels && (
                <button type="button" onClick={() => setAllowMultiple(p => !p)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg",
                      allowMultiple ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <ToggleLeft className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Labels multiples</p>
                      <p className="text-[11px] text-muted-foreground">Attribuer plusieurs labels par élément</p>
                    </div>
                  </div>
                  <div className={cn("relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0",
                    allowMultiple ? "bg-primary" : "bg-muted-foreground/30")}>
                    <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                      allowMultiple ? "translate-x-4" : "translate-x-0.5")} />
                  </div>
                </button>
              )}

              <button type="button" onClick={() => setAllowSkip(p => !p)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg",
                    allowSkip ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Autoriser le passage</p>
                    <p className="text-[11px] text-muted-foreground">Passer un élément sans l'annoter</p>
                  </div>
                </div>
                <div className={cn("relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0",
                  allowSkip ? "bg-primary" : "bg-muted-foreground/30")}>
                  <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                    allowSkip ? "translate-x-4" : "translate-x-0.5")} />
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Section Instructions — optionnelle, toujours en dernier */}
      {selectedTask && (
        <>
          <SectionDivider />
          <div className="flex flex-col gap-4">
            <SectionHeader
              step={instructionsSectionStep}
              label="Instructions pour les annotateurs"
              subtitle="Optionnel — affichées dans la page de la tâche et dans l'interface d'annotation"
            />
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder={`Ex : Dessinez une bounding box autour de chaque véhicule visible.\n• Un box par véhicule, bien ajusté\n• Ignorer les panneaux de signalisation`}
                  rows={5}
                  className="w-full rounded-xl border bg-background pl-9 pr-4 pt-3 pb-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50 leading-relaxed"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Supporte les retours à la ligne. Préfixez une ligne avec <code className="bg-muted px-1 rounded text-[10px]">•</code> pour créer une puce.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  )
}