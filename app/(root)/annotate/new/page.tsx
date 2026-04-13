"use client"



import { DatasetWorkspace } from "@/components/datasets/dataset-workspace"
import {
  ElementConfigurator,
  ElementConfig,
} from "@/components/datasets/elementConfigurator"
import {
  AnnotationConfigurator,
  AnnotationConfig,
} from "@/components/datasets/annotationConfigurator"
import {
  AnnotationStepPanel,
} from "@/components/datasets/annotationStepPanel"
import {
  Stepper, StepperFooter, StepperIndicator, StepperItem, StepperList,
  StepperNext, StepperPanel, StepperPrevious, StepperSeparator,
  StepperTitle, StepperTrigger,
} from "@/components/ui/stepper"
import { CURRENT_USER, getAccessibleDatasets } from "@/constants/mock-data"
import { Dataset } from "@/types/datasets"
import { CircleCheck, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AnnotateNew() {
  const router = useRouter()

  const [step, setStep]                         = useState(0)
  const [selected, setSelected]                 = useState<Dataset | null>(null)
  const [elementConfigs, setElementConfigs]     = useState<ElementConfig[]>([])
  const [annotationConfig, setAnnotationConfig] = useState<AnnotationConfig | null>(null)

  const accessibleDatasets = getAccessibleDatasets(CURRENT_USER.id)

  const handleSelect = (dataset: Dataset) =>
    setSelected((prev) => (prev?.id === dataset.id ? null : dataset))

  const includedCount   = elementConfigs.filter((c) => c.include).length
  const annotationReady = annotationConfig !== null
  const isSelfMode      = annotationConfig?.assignment?.mode === "self"

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── Header ── */}
      <div className="top-0 z-10 flex w-full px-6 items-center gap-3 py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        {/* Bouton retour vers le hub */}
        <button
          type="button"
          onClick={() => router.push("/annotate")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="h-4 w-px bg-border" />

        <div>
          <h1 className="font-bold text-[25px]">
            Nouvelle <span className="text-secondary">session</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Configurez une session d'annotation en 4 étapes
          </p>
        </div>
      </div>

      <Stepper value={step} onValueChange={setStep} className="w-full py-8 px-4">
        <StepperList>
          <StepperItem step={0} canContinue={!!selected}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Choisir le dataset</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={1} canContinue={includedCount > 0}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Configurer les éléments</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={2} canContinue={annotationReady}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Configurer l'annotation</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>

          <StepperItem step={3}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>
                {isSelfMode ? "Annoter" : "Confirmation"}
              </StepperTitle>
            </StepperTrigger>
          </StepperItem>
        </StepperList>

        {/* ── Étape 1 ── */}
        <StepperPanel step={0}>
          <DatasetWorkspace
            datasets={accessibleDatasets}
            onSelect={handleSelect}
            selectedId={selected?.id}
          />
          <StepperFooter>
            <span className="max-w-[60%] block">
              {selected && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">Un dataset sélectionné</p>
                  </div>
                  <p className="font-semibold text-xs text-muted-foreground">{selected.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed truncate">
                    {selected.description}
                  </p>
                </div>
              )}
            </span>
            <StepperNext disabled={!selected}>Continuer</StepperNext>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 2 ── */}
        <StepperPanel step={1}>
          {selected && (
            <ElementConfigurator
              dataset={selected}
              onConfigChange={setElementConfigs}
            />
          )}
          <StepperFooter className="flex justify-end">
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={includedCount === 0}>Continuer</StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 3 ── */}
        <StepperPanel step={2}>
          {selected && (
            <AnnotationConfigurator
              dataset={selected}
              elementConfigs={elementConfigs}
              onConfigChange={setAnnotationConfig}
            />
          )}
          <StepperFooter>
            <span className="max-w-[55%] block">
              {annotationConfig && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {annotationConfig.taskName}
                      {annotationConfig.assignment?.mode === "collaborators" && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          · {annotationConfig.assignment.assignedUserIds.length} collaborateur
                          {annotationConfig.assignment.assignedUserIds.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {annotationConfig.assignment?.mode === "self" && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          · Moi-même
                        </span>
                      )}
                    </p>
                  </div>
                  {annotationConfig.labels.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {annotationConfig.labels.slice(0, 4).map((l) => (
                        <span
                          key={l.id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: l.color }}
                        >
                          {l.name}
                        </span>
                      ))}
                      {annotationConfig.labels.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{annotationConfig.labels.length - 4} autres
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={!annotationReady}>
                {annotationConfig?.assignment?.mode === "collaborators"
                  ? "Créer la session"
                  : "Continuer"}
              </StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 4 ── */}
        <StepperPanel step={3}>
          {selected && annotationConfig && (
            <AnnotationStepPanel
              dataset={selected}
              elementConfigs={elementConfigs}
              annotationConfig={annotationConfig}
              sessionId={undefined}
            />
          )}
        </StepperPanel>
      </Stepper>
    </div>
  )
}