"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2, ArrowRight, Users, Tag, SkipForward,
  Layers, FileText, Info, LayoutDashboard, Clock,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dataset } from "@/types/datasets"
import { ElementConfig } from "@/components/datasets/elementConfigurator"
import { AnnotationConfig } from "@/components/datasets/annotationConfigurator"
import { getUserById } from "@/constants/mock-data"
import { useRouter } from "next/navigation"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface AnnotationStepPanelProps {
  dataset: Dataset
  elementConfigs: ElementConfig[]
  annotationConfig: AnnotationConfig
  sessionId?: string
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Génère un faux sessionId pendant le dev */
function mockSessionId() {
  return "sess_" + Math.random().toString(36).slice(2, 9)
}

const TASK_LABELS: Record<string, string> = {
  classification: "Classification",
  bounding_box:   "Bounding Box",
  segmentation:   "Segmentation",
  ner:            "NER",
  sentiment:      "Sentiment",
  transcription:  "Transcription",
  captioning:     "Captioning",
}

// ─────────────────────────────────────────────
// SOUS-COMPOSANT : RECAP CARD
// Commun aux deux modes
// ─────────────────────────────────────────────

function RecapCard({ dataset, elementConfigs, annotationConfig }: {
  dataset: Dataset
  elementConfigs: ElementConfig[]
  annotationConfig: AnnotationConfig
}) {
  const includedCount = elementConfigs.filter((c) => c.include).length

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <Layers className="h-3.5 w-3.5" />,
      label: "Dataset",
      value: dataset.title,
    },
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Éléments",
      value: `${includedCount} élément${includedCount > 1 ? "s" : ""} sélectionné${includedCount > 1 ? "s" : ""}`,
    },
    {
      icon: <Zap className="h-3.5 w-3.5" />,
      label: "Tâche",
      value: TASK_LABELS[annotationConfig.taskType] ?? annotationConfig.taskName,
    },
    ...(annotationConfig.labels.length > 0 ? [{
      icon: <Tag className="h-3.5 w-3.5" />,
      label: "Labels",
      value: `${annotationConfig.labels.length} label${annotationConfig.labels.length > 1 ? "s" : ""}`,
    }] : []),
    ...(annotationConfig.allowSkip ? [{
      icon: <SkipForward className="h-3.5 w-3.5" />,
      label: "Passage",
      value: "Autorisé",
    }] : []),
  ]

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      {/* Header de la card */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Récapitulatif de la session
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-muted-foreground shrink-0">{row.icon}</span>
            <span className="text-xs text-muted-foreground w-20 shrink-0">{row.label}</span>
            <span className="text-sm font-medium text-foreground truncate">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Labels visuels */}
      {annotationConfig.labels.length > 0 && (
        <div className="px-4 py-3 border-t flex flex-wrap gap-1.5">
          {annotationConfig.labels.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// mode self: l'utilisateur annote la donnee lui meme

function SelfModePanel({ dataset, elementConfigs, annotationConfig, sessionId }: AnnotationStepPanelProps) {
  const router = useRouter()
  const includedCount = elementConfigs.filter((c) => c.include).length
  const sid = sessionId ?? mockSessionId()

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Message principal */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Tout est prêt !</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pl-[42px]">
          Votre session d'annotation est configurée.
          Vous allez annoter{" "}
          <strong className="text-foreground">{includedCount} élément{includedCount > 1 ? "s" : ""}</strong>{" "}
          avec la tâche{" "}
          <strong className="text-foreground">{annotationConfig.taskName}</strong>.
        </p>
      </div>

      {/* Récap */}
      <RecapCard
        dataset={dataset}
        elementConfigs={elementConfigs}
        annotationConfig={annotationConfig}
      />

      {/* Info sur ce qui va se passer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-primary/80 leading-relaxed">
          Les éléments vous seront présentés un par un. Vous pouvez
          {annotationConfig.allowSkip ? " passer un élément" : " ne pas passer d'élément"}{" "}
          et attribuer{" "}
          {annotationConfig.allowMultiple ? "plusieurs labels" : "un seul label"}{" "}
          par élément.
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => router.push(`/annotate/${sid}`)}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors self-start"
      >
        Commencer l'annotation
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// mode delegated : l'utilisateur confie la session a ses collaborateurs

function DelegatedModePanel({ dataset, elementConfigs, annotationConfig }: AnnotationStepPanelProps) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(false)
  const assignedIds = annotationConfig.assignment.assignedUserIds

  // Petite animation d'apparition au montage
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Résoudre les users assignés
  const assignedUsers = assignedIds
    .map((id) => getUserById(id))
    .filter(Boolean)

  return (
    <div className={cn(
      "flex flex-col gap-6 w-full transition-all duration-500",
      revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )}>

      {/* Message de succès */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Session créée !</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pl-[42px]">
          La session a été assignée à{" "}
          <strong className="text-foreground">
            {assignedUsers.length} collaborateur{assignedUsers.length > 1 ? "s" : ""}
          </strong>.
          Ils recevront une notification et pourront commencer dès maintenant.
        </p>
      </div>

      {/* Collaborateurs assignés */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Assigné à
        </p>
        <div className="flex flex-col gap-2">
          {assignedUsers.map((user) => (
            <div
              key={user!.id}
              className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: user!.avatarColor }}
              >
                {user!.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{user!.name}</p>
                <p className="text-[11px] text-muted-foreground">{user!.country}</p>
              </div>
              {/* Badge "Notifié" */}
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Clock className="h-2.5 w-2.5" />
                En attente
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Récap */}
      <RecapCard
        dataset={dataset}
        elementConfigs={elementConfigs}
        annotationConfig={annotationConfig}
      />

      {/* Info */}
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vous pouvez suivre la progression de cette session depuis la page du dataset{" "}
          <strong className="text-foreground">{dataset.title}</strong>{" "}
          ou depuis votre tableau de bord.
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="flex items-center justify-center gap-2 rounded-xl border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors self-start"
      >
        <LayoutDashboard className="h-4 w-4" />
        Retour au tableau de bord
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL — switche selon le mode
// ─────────────────────────────────────────────

export function AnnotationStepPanel(props: AnnotationStepPanelProps) {
  const isSelf = props.annotationConfig.assignment.mode === "self"

  return isSelf
    ? <SelfModePanel {...props} />
    : <DelegatedModePanel {...props} />
}