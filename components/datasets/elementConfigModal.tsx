"use client"

import { ImageIcon, Music, FileText, Eye, Play, Maximize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { DatasetElementUI, DataType } from "@/types/datasets"

//icone du bouton sur la card

export function PreviewTriggerIcon({ type }: { type: DataType }) {
  if (type === "image") return <Maximize2 className="h-3 w-3" />
  if (type === "audio") return <Play      className="h-3 w-3" />
  return                       <Eye       className="h-3 w-3" />
}

// modal de l'image 
function ImagePanel({ element }: { element: DatasetElementUI }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full rounded-lg border bg-muted/40 overflow-hidden flex items-center justify-center">
        {element.previewUrl ? (
          <Image
            src={element.previewUrl}
            width={600}
            height={400}
            alt={element.name}
            className="w-full object-contain max-h-[50vh]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground/40">
            <ImageIcon className="h-12 w-12" />
            <span className="text-xs">Aucun aperçu disponible</span>
          </div>
        )}
      </div>
      {element.sizeBytes && (
        <p className="text-xs text-muted-foreground">
          Taille : {(element.sizeBytes / 1024).toFixed(1)} Ko
        </p>
      )}
    </div>
  )
}

//modal de l'audio

function AudioPanel({ element }: { element: DatasetElementUI }) {
  const duration = element.durationSeconds
    ? `${Math.floor(element.durationSeconds / 60)}:${String(element.durationSeconds % 60).padStart(2, "0")}`
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="h-28 w-full rounded-lg border bg-muted/40 flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
        <Music className="h-10 w-10" />
        {duration && <span className="text-xs">{duration}</span>}
      </div>
      {element.previewUrl ? (
        <audio controls className="w-full">
          <source src={element.previewUrl} />
        </audio>
      ) : (
        <p className="text-xs text-muted-foreground italic">Aucun fichier audio disponible.</p>
      )}
    </div>
  )
}

//modal du text/csv/json

function TextPanel({ element }: { element: DatasetElementUI }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full rounded-lg border bg-muted/20 overflow-y-auto p-3 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
          <FileText className="h-10 w-10" />
          <span className="text-xs">Contenu à charger depuis l'API</span>
        </div>
      </div>
      {element.wordCount && (
        <p className="text-xs text-muted-foreground">{element.wordCount} mots</p>
      )}
    </div>
  )
}

//configuration du type dans la modal

const TYPE_CONFIG: Record<DataType, { title: string; icon: React.ReactNode }> = {
  image: { title: "Aperçu de l'image", icon: <ImageIcon className="h-4 w-4 text-blue-500"   /> },
  audio: { title: "Écouter l'audio",   icon: <Music     className="h-4 w-4 text-violet-500" /> },
  text:  { title: "Lire le texte",     icon: <FileText  className="h-4 w-4 text-amber-500"  /> },
  csv:   { title: "Aperçu du CSV",     icon: <FileText  className="h-4 w-4 text-amber-500"  /> },
  json:  { title: "Aperçu du JSON",    icon: <FileText  className="h-4 w-4 text-amber-500"  /> },
}

// composant principal

export function ElementPreviewModal({ element, open, onClose }: {
  element: DatasetElementUI
  open: boolean
  onClose: () => void
}) {
  const config = TYPE_CONFIG[element.type]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 py-4">
            {config.icon}
            <span>{config.title}</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground truncate max-w-40">
              {element.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        {element.type === "image" && <ImagePanel element={element} />}
        {element.type === "audio" && <AudioPanel element={element} />}
        {(element.type === "text" || element.type === "csv" || element.type === "json") && (
          <TextPanel element={element} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}