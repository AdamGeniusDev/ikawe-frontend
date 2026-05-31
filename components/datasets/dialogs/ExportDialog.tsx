"use client"

// components/datasets/dialogs/ExportDialog.tsx

import { useState } from "react"
import { Download, Braces, Layers, FileJson, FileSpreadsheet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Modal } from "./Modal"
import type { Dataset } from "@/types/datasets"

type ExportFormat = 'json' | 'csv' | 'coco' | 'yolo'

const EXPORT_FORMATS: {
  value: ExportFormat; label: string; desc: string; icon: LucideIcon; ext: string
}[] = [
  { value: 'json', label: 'JSON', desc: 'Format générique, compatible avec tous les outils', icon: FileJson,        ext: '.json' },
  { value: 'csv',  label: 'CSV',  desc: 'Tableur, idéal pour classification et texte',       icon: FileSpreadsheet, ext: '.csv'  },
  { value: 'coco', label: 'COCO', desc: "Standard pour la détection d'objets",               icon: Braces,          ext: '.json' },
  { value: 'yolo', label: 'YOLO', desc: 'Entraînement de modèles YOLO (bounding box)',       icon: Layers,          ext: '.txt'  },
]

interface ExportDialogProps {
  dataset: Dataset
  onClose: () => void
}

export function ExportDialog({ dataset, onClose }: ExportDialogProps) {
  const [format,     setFormat]     = useState<ExportFormat>('json')
  const [includeRaw, setIncludeRaw] = useState(false)
  const [exporting,  setExporting]  = useState(false)

  const handleExport = async () => {
    setExporting(true)
    await new Promise(r => setTimeout(r, 1200))
    setExporting(false)
    onClose()
  }

  return (
    <Modal
      title="Exporter les annotations"
      subtitle={`${(dataset.annotatedFiles ?? 0).toLocaleString("fr-FR")} éléments annotés`}
      onClose={onClose}
      width="min-w-xl"
    >
      <div className="flex flex-col gap-5 px-5 py-4">
        {/* Format */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Format d'export</label>
          <div className="flex flex-col gap-2">
            {EXPORT_FORMATS.map(fmt => {
              const Icon   = fmt.icon
              const active = format === fmt.value
              return (
                <button key={fmt.value} type="button" onClick={() => setFormat(fmt.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    active ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                  )}>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                    active ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                      {fmt.label}
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">{fmt.ext}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmt.desc}</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                    active ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {active && <span className="block w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fichiers source */}
        <div
          className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 cursor-pointer"
          onClick={() => setIncludeRaw(v => !v)}
        >
          <div>
            <p className="text-xs font-medium">Inclure les fichiers source</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Archive ZIP avec les données originales</p>
          </div>
          <button type="button"
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors shrink-0",
              includeRaw ? "bg-primary" : "bg-muted-foreground/30"
            )}>
            <span className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              includeRaw && "translate-x-4"
            )} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
            Annuler
          </button>
          <button type="button" onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
            {exporting
              ? <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Export en cours…</>
              : <><Download className="h-3.5 w-3.5" />Exporter</>
            }
          </button>
        </div>
      </div>
    </Modal>
  )
}