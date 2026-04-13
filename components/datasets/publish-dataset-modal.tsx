"use client"

import { useState } from "react"
import { Dataset } from "@/types/datasets"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Globe, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react"
import { DATA_TYPE_ICON } from "./dataset-card"

interface PublishDatasetModalProps {
  open: boolean
  onClose: () => void
  myDatasets: Dataset[]
}

export function PublishDatasetModal({ open, onClose, myDatasets }: PublishDatasetModalProps) {
  const [multiSelect, setMultiSelect] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [published, setPublished] = useState(false)

  const publishable = myDatasets.filter(d => d.visibility !== "public")

    const toggle = (id: string) => {
    if (!multiSelect) {
        // Sélection simple — un seul dataset à la fois
        setSelected(() => {
        const next = new Set<string>()
        if (!selected.has(id)) next.add(id) // si déjà sélectionné → désélectionne (next reste vide)
        return next
        })
    } else {
        // Sélection multiple — on coche/décoche individuellement
        setSelected(prev => {
        const next = new Set(prev)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        return next
        })
    }
    }

  const handlePublish = () => {
    if (selected.size === 0) return
    console.log("Publier datasets :", [...selected])
    setPublished(true)
  }

  const handleClose = () => {
    setSelected(new Set())
    setPublished(false)
    setMultiSelect(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-lg w-full">
        {!published ? (
          <>
            <DialogHeader>
              <DialogTitle>Publier un dataset</DialogTitle>
              <DialogDescription>
                Choisissez un ou plusieurs datasets à rendre publics dans la bibliothèque.
              </DialogDescription>
            </DialogHeader>

            {/* Barre sélection multiple */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} dataset${selected.size > 1 ? "s" : ""} sélectionné${selected.size > 1 ? "s" : ""}`
                  : "Aucune sélection"
                }
              </span>
              <button
                onClick={() => {
                  setMultiSelect(v => !v)
                  if (multiSelect) setSelected(new Set()) // reset à la désactivation
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  multiSelect
                    ? "border-primary text-primary bg-primary/5"
                    : "border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:border-zinc-400"
                }`}
              >
                {multiSelect
                  ? <><ToggleRight size={14} /> Sélection multiple</>
                  : <><ToggleLeft size={14} /> Sélection multiple</>
                }
              </button>
            </div>

            {/* Liste */}
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
              {publishable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tous vos datasets sont déjà publics.
                </p>
              ) : (
                publishable.map((dataset) => {
                  const isSelected = selected.has(dataset.id)
                  return (
                    <button
                      key={dataset.id}
                      onClick={() => toggle(dataset.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:border-zinc-400 dark:hover:border-zinc-500"
                      }`}
                    >
                      {/* Indicateur — rond (simple) ou carré (multiple) */}
                      <div className={`mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center border-2 transition-colors ${
                        multiSelect ? "rounded-sm" : "rounded-full"
                      } ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {isSelected && (
                          multiSelect
                            ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            : <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{dataset.title}</span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                            {DATA_TYPE_ICON[dataset.dataType]}
                            {dataset.dataType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {dataset.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{dataset.totalFiles.toLocaleString()} fichiers</span>
                          <span>·</span>
                          <span>{dataset.annotationProgress}% annoté</span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button disabled={selected.size === 0} onClick={handlePublish} className="gap-2">
                <Globe size={14} />
                Publier {selected.size > 1 ? `(${selected.size})` : ""}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="font-semibold text-base">
                {selected.size > 1
                  ? `${selected.size} datasets publiés avec succès !`
                  : "Dataset publié avec succès !"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {selected.size > 1 ? "Ils sont" : "Il est"} maintenant visible{selected.size > 1 ? "s" : ""} dans la bibliothèque publique.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}