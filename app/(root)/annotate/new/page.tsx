"use client"

// app/(root)/annotate/new/page.tsx
// Stepper 4 étapes :
//   1. Choisir le dataset
//   2. Sélectionner les éléments
//   3. Configurer l'annotation   (tâche + labels + options)
//   4. Assigner les groupes      (JobAssignmentConfigurator)

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CircleCheck, ArrowLeft, Layers } from "lucide-react"

import { DatasetWorkspace }     from "@/components/datasets/dataset-workspace"
import { ElementConfigurator, ElementConfig } from "@/components/datasets/elementConfigurator"
import { AnnotationConfigurator, AnnotationConfig } from "@/components/datasets/annotationConfigurator"
import { JobAssignmentConfigurator, JobAssignmentConfig, BATCH_SIZE } from "@/components/datasets/jobAssignmentConfigurator"
import {
  Stepper, StepperFooter, StepperIndicator, StepperItem, StepperList,
  StepperNext, StepperPanel, StepperPrevious, StepperSeparator,
  StepperTitle, StepperTrigger,
} from "@/components/ui/stepper"

import { CURRENT_USER, getAccessibleDatasets } from "@/constants/mock-data"
import { Dataset } from "@/types/datasets"

export default function AnnotateNew() {
  const router = useRouter()

  const [step,             setStep]             = useState(0)
  const [selected,         setSelected]         = useState<Dataset | null>(null)
  const [elementConfigs,   setElementConfigs]   = useState<ElementConfig[]>([])
  const [annotationConfig, setAnnotationConfig] = useState<AnnotationConfig | null>(null)
  const [assignmentConfig, setAssignmentConfig] = useState<JobAssignmentConfig | null>(null)

  const accessibleDatasets = getAccessibleDatasets(CURRENT_USER.id)
  const includedCount      = elementConfigs.filter(c => c.include).length
  const annotationReady    = annotationConfig !== null
  const assignmentReady    = assignmentConfig !== null
  const batchCount         = Math.max(1, Math.ceil(includedCount / BATCH_SIZE))

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="top-0 z-10 flex w-full px-6 items-center gap-3 py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
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
            Nouveau <span className="text-secondary">job</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Configurez un job d'annotation en 4 étapes
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
              <StepperTitle>Sélectionner les éléments</StepperTitle>
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

          <StepperItem step={3} canContinue={assignmentReady}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>Assigner les groupes</StepperTitle>
            </StepperTrigger>
          </StepperItem>

        </StepperList>

        {/* ── Étape 1 — Dataset ── */}
        <StepperPanel step={0}>
          <DatasetWorkspace
            datasets={accessibleDatasets}
            onSelect={d => setSelected(prev => prev?.id === d.id ? null : d)}
            selectedId={selected?.id}
          />
          <StepperFooter>
            <span className="max-w-[60%] block">
              {selected && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">Dataset sélectionné</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold truncate">{selected.title}</p>
                </div>
              )}
            </span>
            <StepperNext disabled={!selected}>Continuer</StepperNext>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 2 — Éléments ── */}
        <StepperPanel step={1}>
          {selected && (
            <ElementConfigurator
              dataset={selected}
              onConfigChange={setElementConfigs}
            />
          )}
          <StepperFooter>
            <span className="max-w-[60%] block">
              {includedCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {includedCount} élément{includedCount > 1 ? "s" : ""} sélectionné{includedCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    → {batchCount} groupe{batchCount > 1 ? "s" : ""} de {BATCH_SIZE} max
                  </p>
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={includedCount === 0}>Continuer</StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 3 — Annotation ── */}
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
                    <p className="font-semibold text-primary text-sm">{annotationConfig.taskName}</p>
                  </div>
                  {annotationConfig.labels.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {annotationConfig.labels.slice(0, 4).map(l => (
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
                          +{annotationConfig.labels.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <StepperNext disabled={!annotationReady}>Continuer</StepperNext>
            </div>
          </StepperFooter>
        </StepperPanel>

        {/* ── Étape 4 — Assignation ── */}
        <StepperPanel step={3}>
          {selected && (
            <JobAssignmentConfigurator
              dataset={selected}
              elementConfigs={elementConfigs}
              key={includedCount}
              currentUserId={CURRENT_USER.id}
              onConfigChange={setAssignmentConfig}
            />
          )}
          <StepperFooter>
            <span className="max-w-[55%] block">
              {assignmentConfig && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary text-sm">
                      {assignmentConfig.batchCount} groupe{assignmentConfig.batchCount > 1 ? "s" : ""} assigné{assignmentConfig.batchCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {assignmentConfig.distributionMode === "sequential" ? "Séquentiel" : "Aléatoire"}
                  </p>
                </div>
              )}
            </span>
            <div className="flex items-center gap-3">
              <StepperPrevious />
              <button
                type="button"
                disabled={!assignmentReady}
                onClick={() => {
                  // TODO en production : POST /api/jobs → router.push(`/annotate/job/${newJobId}`)
                  router.push("/annotate")
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Créer le job
              </button>
            </div>
          </StepperFooter>
        </StepperPanel>

      </Stepper>
    </div>
  )
}