"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Tag, Plus, X, Info, BoxSelect, Fingerprint,
  MessageSquareText, Mic, BarChart2, User, Users,
  AlertCircle, ChevronRight, ToggleLeft,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dataset } from "@/types/datasets"
import { ElementConfig } from "@/components/datasets/elementConfigurator"
import { MockUser, getUserById } from "@/constants/mock-data"

// ─────────────────────────────────────────────
// TYPES EXPORTÉS
// ─────────────────────────────────────────────

export type AnnotationTaskType =
  | "classification"
  | "bounding_box"
  | "segmentation"
  | "ner"
  | "sentiment"
  | "transcription"
  | "captioning"

export type AssignmentMode = "self" | "collaborators"

export interface AnnotationLabel {
  id: string
  name: string
  color: string
}

export interface AssignmentConfig {
  mode: AssignmentMode
  assignedUserIds: string[]  // vide si mode === "self"
}

export interface AnnotationConfig {
  taskType: AnnotationTaskType
  taskName: string
  labels: AnnotationLabel[]
  allowMultiple: boolean
  allowSkip: boolean
  assignment: AssignmentConfig
}

export interface AnnotationConfiguratorProps {
  dataset: Dataset
  elementConfigs: ElementConfig[]
  onConfigChange?: (config: AnnotationConfig | null) => void
  className?: string
}

// ─────────────────────────────────────────────
// DÉFINITIONS DES TÂCHES PAR TYPE DE DATASET
// ─────────────────────────────────────────────

interface TaskDefinition {
  type: AnnotationTaskType
  label: string
  description: string
  icon: React.ReactNode
  needsLabels: boolean
}

const TASKS_BY_TYPE: Record<string, TaskDefinition[]> = {
  image: [
    {
      type: "classification",
      label: "Classification",
      description: "Attribuer une catégorie à chaque image",
      icon: <Tag className="h-4 w-4" />,
      needsLabels: true,
    },
    {
      type: "bounding_box",
      label: "Bounding Box",
      description: "Délimiter des objets par des rectangles",
      icon: <BoxSelect className="h-4 w-4" />,
      needsLabels: true,
    },
    {
      type: "captioning",
      label: "Captioning",
      description: "Rédiger une description textuelle de l'image",
      icon: <MessageSquareText className="h-4 w-4" />,
      needsLabels: false,
    },
  ],
  audio: [
    {
      type: "transcription",
      label: "Transcription",
      description: "Retranscrire le contenu audio en texte",
      icon: <Mic className="h-4 w-4" />,
      needsLabels: false,
    },
    {
      type: "classification",
      label: "Classification",
      description: "Catégoriser chaque fichier audio",
      icon: <Tag className="h-4 w-4" />,
      needsLabels: true,
    },
    {
      type: "sentiment",
      label: "Sentiment",
      description: "Analyser le ton émotionnel de l'audio",
      icon: <BarChart2 className="h-4 w-4" />,
      needsLabels: true,
    },
  ],
  text: [
    {
      type: "classification",
      label: "Classification",
      description: "Catégoriser chaque document texte",
      icon: <Tag className="h-4 w-4" />,
      needsLabels: true,
    },
    {
      type: "ner",
      label: "NER",
      description: "Identifier les entités nommées (personnes, lieux…)",
      icon: <Fingerprint className="h-4 w-4" />,
      needsLabels: true,
    },
    {
      type: "sentiment",
      label: "Sentiment",
      description: "Classer le ton émotionnel du texte",
      icon: <BarChart2 className="h-4 w-4" />,
      needsLabels: true,
    },
  ],
  csv: [
    {
      type: "classification",
      label: "Classification de lignes",
      description: "Étiqueter chaque ligne du tableau",
      icon: <Tag className="h-4 w-4" />,
      needsLabels: true,
    },
  ],
  json: [
    {
      type: "classification",
      label: "Classification",
      description: "Catégoriser chaque entrée JSON",
      icon: <Tag className="h-4 w-4" />,
      needsLabels: true,
    },
  ],
}

const DEFAULT_TASKS: TaskDefinition[] = [
  {
    type: "classification",
    label: "Classification",
    description: "Attribuer une catégorie à chaque élément",
    icon: <Tag className="h-4 w-4" />,
    needsLabels: true,
  },
]

// ─────────────────────────────────────────────
// COULEURS PRÉDÉFINIES POUR LES LABELS
// ─────────────────────────────────────────────

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f59e0b",
]

function getNextColor(usedColors: string[]): string {
  const unused = PRESET_COLORS.find((c) => !usedColors.includes(c))
  return unused ?? PRESET_COLORS[usedColors.length % PRESET_COLORS.length]
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────

function SectionHeader({ label, subtitle, step }: {
  label: string
  subtitle?: string
  step: number
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px bg-border/60 w-full" />
}
//pour le choix de celui qui va faire l'annotation: soit l'utilisateur lui meme soit ces collaboarateurs
function AssignmentModeCard({ mode, selected, disabled, onSelect }: {
  mode: AssignmentMode
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const isSelf = mode === "self"
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex flex-1 flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-150",
        selected && !disabled
          ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : disabled
          ? "border-border/30 bg-muted/10 opacity-40 cursor-not-allowed"
          : "border-border bg-background hover:border-border/80 hover:bg-muted/20"
      )}
    >
      <div className={cn(
        "absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-all",
        selected && !disabled ? "border-primary bg-primary" : "border-muted-foreground/30"
      )}>
        {selected && !disabled && (
          <div className="absolute inset-0.5 rounded-full bg-white" />
        )}
      </div>
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
        selected && !disabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {isSelf ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
      </div>
      <div>
        <p className={cn(
          "text-sm font-semibold",
          selected && !disabled ? "text-primary" : "text-foreground"
        )}>
          {isSelf ? "Moi-même" : "Mes collaborateurs"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
          {isSelf
            ? "J'annote directement à l'étape suivante"
            : disabled
            ? "Aucun collaborateur sur ce dataset"
            : "Déléguer à des membres du dataset"}
        </p>
      </div>
    </button>
  )
}

//card des collaborateurs
function CollaboratorCard({ user, role, selected, onToggle }: {
  user: MockUser
  role: string
  selected: boolean
  onToggle: () => void
}) {
  const roleLabel: Record<string, string> = {
    annotator: "Annotateur",
    reviewer:  "Réviseur",
    admin:     "Admin",
  }
  const roleColor: Record<string, string> = {
    annotator: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    reviewer:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    admin:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 w-full",
        selected
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-background hover:bg-muted/20"
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            roleColor[role] ?? roleColor.annotator
          )}>
            {roleLabel[role] ?? role}
          </span>
          <span className="text-[10px] text-muted-foreground">{user.country}</span>
        </div>
      </div>
      <div className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-all",
        selected ? "border-primary bg-primary" : "border-border"
      )}>
        {selected && <Check className='text-white h-3 w-3' strokeWidth={3} />}
      </div>
    </button>
  )
}

function TaskCard({ task, selected, onSelect }: {
  task: TaskDefinition
  selected: boolean
  onSelect: () => void
}) {
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
      <div className={cn(
        "absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-all",
        selected ? "border-primary bg-primary" : "border-muted-foreground/30"
      )}>
        {selected && <div className="absolute inset-0.5 rounded-full bg-white" />}
      </div>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {task.icon}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>
          {task.label}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
          {task.description}
        </p>
      </div>
    </button>
  )
}

function LabelRow({ label, onRemove, onChange }: {
  label: AnnotationLabel
  onRemove: () => void
  onChange: (updated: AnnotationLabel) => void
}) {
  const [showPalette, setShowPalette] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowPalette((p) => !p)}
          className="flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all hover:scale-110"
          style={{ backgroundColor: label.color, borderColor: label.color }}
        />
        {showPalette && (
          <div className="absolute top-8 left-0 z-20 flex flex-wrap gap-1.5 rounded-xl border bg-popover p-2.5 shadow-lg w-[140px]">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => { onChange({ ...label, color }); setShowPalette(false) }}
                className={cn(
                  "h-5 w-5 rounded-md border-2 transition-all hover:scale-110",
                  label.color === color ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
      <input
        type="text"
        value={label.name}
        onChange={(e) => onChange({ ...label, name: e.target.value })}
        placeholder="Nom du label…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export function AnnotationConfigurator({
  dataset,
  elementConfigs,
  onConfigChange,
  className,
}: AnnotationConfiguratorProps) {
  const includedCount = elementConfigs.filter((c) => c.include).length
  const tasks = TASKS_BY_TYPE[dataset.dataType] ?? DEFAULT_TASKS

  const [assignmentMode, setAssignmentMode]     = useState<AssignmentMode>("self")
  const [selectedUserIds, setSelectedUserIds]   = useState<string[]>([])
  const [selectedTaskType, setSelectedTaskType] = useState<AnnotationTaskType | null>(null)
  const [labels, setLabels]                     = useState<AnnotationLabel[]>([])
  const [allowMultiple, setAllowMultiple]       = useState(false)
  const [allowSkip, setAllowSkip]               = useState(true)

  // Résoudre les membres du dataset en MockUser
  const collaborators = dataset.members
    .map((m) => {
      const user = getUserById(m.userId)
      return user ? { user, role: m.role } : null
    })
    .filter(Boolean) as { user: MockUser; role: string }[]

  const hasCollaborators = collaborators.length > 0
  const selectedTask = tasks.find((t) => t.type === selectedTaskType) ?? null

  const toggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }, [])

  const handleTaskSelect = useCallback((type: AnnotationTaskType) => {
    setSelectedTaskType(type)
    setLabels([])
  }, [])

  const addLabel = useCallback(() => {
    const usedColors = labels.map((l) => l.color)
    setLabels((prev) => [
      ...prev,
      { id: generateId(), name: "", color: getNextColor(usedColors) },
    ])
  }, [labels])

  const removeLabel = useCallback((id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const updateLabel = useCallback((updated: AnnotationLabel) => {
    setLabels((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }, [])

  // Remonter la config au parent à chaque changement
  useEffect(() => {
    if (!selectedTask) { onConfigChange?.(null); return }

    const validLabels = labels.filter((l) => l.name.trim())
    if (selectedTask.needsLabels && validLabels.length === 0) {
      onConfigChange?.(null); return
    }
    if (assignmentMode === "collaborators" && selectedUserIds.length === 0) {
      onConfigChange?.(null); return
    }

    onConfigChange?.({
      taskType:      selectedTask.type,
      taskName:      selectedTask.label,
      labels:        selectedTask.needsLabels ? validLabels : [],
      allowMultiple,
      allowSkip,
      assignment: {
        mode:            assignmentMode,
        assignedUserIds: assignmentMode === "self" ? [] : selectedUserIds,
      },
    })
  }, [
    selectedTask, labels, allowMultiple, allowSkip,
    assignmentMode, selectedUserIds, onConfigChange,
  ])

  // Numéro de section dynamique (3 ou 4 selon si labels)
  const optionsSectionStep = selectedTask?.needsLabels ? 4 : 3

  return (
    <div className={cn("flex flex-col gap-7", className)}>

      {/* ── Bandeau contexte ── */}
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">
            {includedCount} élément{includedCount > 1 ? "s" : ""}
          </strong>{" "}
          sélectionné{includedCount > 1 ? "s" : ""} dans{" "}
          <strong className="text-foreground">{dataset.title}</strong>.{" "}
          Configurez la session d'annotation ci-dessous.
        </p>
      </div>

      {/* ══ SECTION 1 — QUI ANNOTE ? ══ */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          step={1}
          label="Qui va annoter ?"
          subtitle="Annotez vous-même ou déléguez à des collaborateurs du dataset"
        />

        <div className="flex gap-3">
          <AssignmentModeCard
            mode="self"
            selected={assignmentMode === "self"}
            onSelect={() => { setAssignmentMode("self"); setSelectedUserIds([]) }}
          />
          <AssignmentModeCard
            mode="collaborators"
            selected={assignmentMode === "collaborators"}
            disabled={!hasCollaborators}
            onSelect={() => { if (hasCollaborators) setAssignmentMode("collaborators") }}
          />
        </div>

        {/* Alerte aucun collaborateur */}
        {!hasCollaborators && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Ce dataset n'a pas encore de collaborateurs. Ajoutez des membres
              depuis la page du dataset pour pouvoir déléguer l'annotation.
            </p>
          </div>
        )}

        {/* Liste collaborateurs */}
        {assignmentMode === "collaborators" && hasCollaborators && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Sélectionnez les membres à assigner à cette session
              </p>
              {selectedUserIds.length > 0 && (
                <span className="text-xs font-semibold text-primary">
                  {selectedUserIds.length} sélectionné{selectedUserIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {collaborators.map(({ user, role }) => (
              <CollaboratorCard
                key={user.id}
                user={user}
                role={role}
                selected={selectedUserIds.includes(user.id)}
                onToggle={() => toggleUser(user.id)}
              />
            ))}
            {selectedUserIds.length === 0 && (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <Info className="h-3 w-3 shrink-0" />
                Sélectionnez au moins un collaborateur pour continuer
              </p>
            )}
          </div>
        )}
      </div>

      <SectionDivider />

      {/* ══ SECTION 2 — TÂCHE ══ */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          step={2}
          label="Tâche d'annotation"
          subtitle={`Tâches disponibles pour un dataset de type « ${dataset.dataType} »`}
        />
        <div className={cn(
          "grid gap-3",
          tasks.length === 1 ? "grid-cols-1 max-w-xs"
          : tasks.length === 2 ? "grid-cols-2 max-w-md"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {tasks.map((task) => (
            <TaskCard
              key={task.type}
              task={task}
              selected={selectedTaskType === task.type}
              onSelect={() => handleTaskSelect(task.type)}
            />
          ))}
        </div>
      </div>

      {/* ══ SECTION 3 — LABELS (si besoin) ══ */}
      {selectedTask?.needsLabels && (
        <>
          <SectionDivider />
          <div className="flex flex-col gap-4">
            <SectionHeader
              step={3}
              label="Labels / Classes"
              subtitle="Les étiquettes que l'annotateur pourra attribuer à chaque élément"
            />
            <div className="flex flex-col gap-2">
              {labels.map((label) => (
                <LabelRow
                  key={label.id}
                  label={label}
                  onRemove={() => removeLabel(label.id)}
                  onChange={updateLabel}
                />
              ))}
              <button
                type="button"
                onClick={addLabel}
                className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150 w-full"
              >
                <Plus className="h-4 w-4" />
                Ajouter un label
              </button>
            </div>
            {labels.filter((l) => l.name.trim()).length === 0 && (
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
              La tâche <strong className="text-primary">{selectedTask.label}</strong> ne nécessite
              pas de labels — l'annotateur saisira directement du texte libre.
            </p>
          </div>
        </>
      )}

      {/* ══ SECTION 4 — OPTIONS ══ */}
      {selectedTask && (
        <>
          <SectionDivider />
          <div className="flex flex-col gap-4">
            <SectionHeader
              step={optionsSectionStep}
              label="Options de session"
              subtitle="Paramètres de comportement pendant l'annotation"
            />
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-1">

              {selectedTask.needsLabels && (
                <button
                  type="button"
                  onClick={() => setAllowMultiple((p) => !p)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      allowMultiple ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <ToggleLeft className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Labels multiples</p>
                      <p className="text-[11px] text-muted-foreground">
                        Attribuer plusieurs labels par élément
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0",
                    allowMultiple ? "bg-primary" : "bg-muted-foreground/30"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                      allowMultiple ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAllowSkip((p) => !p)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    allowSkip ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Autoriser le passage</p>
                    <p className="text-[11px] text-muted-foreground">
                      Passer un élément sans l'annoter
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0",
                  allowSkip ? "bg-primary" : "bg-muted-foreground/30"
                )}>
                  <div className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                    allowSkip ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}