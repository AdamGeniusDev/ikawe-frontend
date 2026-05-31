"use client"

// components/datasets/dialogs/DatasetActionDialogs.tsx
// DuplicateDialog · ArchiveDialog · DeleteDialog
// Ces trois dialogs restent en modal (actions ponctuelles, pas de formulaire complexe).

import { useState } from "react"
import { Copy, Archive, Trash2, AlertTriangle } from "lucide-react"
import { Modal } from "./Modal"
import type { Dataset } from "@/types/datasets"

// ─── Dupliquer ────────────────────────────────────────────────────────────────

interface DuplicateDialogProps {
  dataset:     Dataset
  onDuplicate: (newTitle: string) => void
  onClose:     () => void
}

export function DuplicateDialog({ dataset, onDuplicate, onClose }: DuplicateDialogProps) {
  const [title, setTitle] = useState(`${dataset.title}_copie`)

  return (
    <Modal title="Dupliquer le dataset" onClose={onClose}>
      <div className="flex flex-col gap-5 px-5 py-4">
        <div className="flex items-start gap-3 rounded-xl bg-muted/30 border p-3">
          <Copy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">La copie n'inclut pas les annotations</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
              Seule la structure et les fichiers source sont dupliqués. Les jobs et annotations ne sont pas copiés.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Nom du nouveau dataset</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => { onDuplicate(title.trim()); onClose() }}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />Dupliquer
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Archiver ─────────────────────────────────────────────────────────────────

interface ArchiveDialogProps {
  dataset:   Dataset
  onConfirm: () => void
  onClose:   () => void
}

export function ArchiveDialog({ dataset, onConfirm, onClose }: ArchiveDialogProps) {
  return (
    <Modal title="Archiver le dataset" onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3">
          <Archive className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Dataset archivé</p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
              Le dataset sera masqué de la marketplace et inaccessible aux annotateurs. Vous pourrez le désarchiver plus tard.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Voulez-vous archiver <span className="font-semibold text-foreground">«&nbsp;{dataset.title}&nbsp;»</span> ?
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
            Annuler
          </button>
          <button type="button" onClick={() => { onConfirm(); onClose() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
            <Archive className="h-3.5 w-3.5" />Archiver
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Supprimer ────────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  dataset:       Dataset
  hasActiveJobs: boolean
  onConfirm:     () => void
  onClose:       () => void
}

export function DeleteDialog({ dataset, hasActiveJobs, onConfirm, onClose }: DeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("")
  const canDelete = !hasActiveJobs && confirmation === dataset.title

  return (
    <Modal title="Supprimer le dataset" onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-4">
        {hasActiveJobs ? (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Suppression impossible</p>
              <p className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5 leading-relaxed">
                Ce dataset a des jobs d'annotation actifs. Terminez ou supprimez-les avant de supprimer le dataset.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3">
              <Trash2 className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Action irréversible</p>
                <p className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5 leading-relaxed">
                  Toutes les annotations et les fichiers associés seront définitivement supprimés.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground">
                Tapez <span className="font-mono font-semibold text-foreground">{dataset.title}</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                className="rounded-lg border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/30"
                placeholder={dataset.title}
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
            {hasActiveJobs ? "Fermer" : "Annuler"}
          </button>
          {!hasActiveJobs && (
            <button
              type="button"
              onClick={() => { onConfirm(); onClose() }}
              disabled={!canDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />Supprimer définitivement
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}