"use client"

import { useState } from "react"
import { ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import Image from "next/image"

export interface ImageFilePreview {
  id:      string
  name:    string
  sizeMb:  string
  url:     string
  width?:  number
  height?: number
}

interface ImagePreviewProps {
  files:        ImageFilePreview[]
  totalCount:   number
  detectedExts: string[]
}

export function ImagePreview({ files, totalCount, detectedExts }: ImagePreviewProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = () => setLightbox(i => i !== null ? Math.max(0, i - 1) : null)
  const next = () => setLightbox(i => i !== null ? Math.min(files.length - 1, i + 1) : null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Aperçu des {Math.min(files.length, 3)} premières images
        </p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {totalCount} image{totalCount > 1 ? "s" : ""} au total
          {detectedExts.length > 0 && <> · {detectedExts.map(e => `.${e}`).join(" · ")}</>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {files.map((file, i) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative aspect-video rounded-xl overflow-hidden border bg-muted hover:border-primary/40 transition-all cursor-pointer"
          >
            <Image
              src={file.url}
              alt={file.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white truncate">{file.name}</p>
              <p className="text-[9px] text-white/60">{file.sizeMb}</p>
            </div>
          </button>
        ))}
      </div>

      {totalCount > 3 && (
        <p className="text-[11px] text-muted-foreground text-center">
          + {totalCount - 3} autre{totalCount - 3 > 1 ? "s" : ""} image{totalCount - 3 > 1 ? "s" : ""} non affichées
        </p>
      )}

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          {/* Boutons nav — z-10 pour passer au-dessus de l'image */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setLightbox(null) }}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {lightbox > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {lightbox < files.length - 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Conteneur image — dimensions explicites pour que fill fonctionne */}
          <div
            className="relative w-[80vw] h-[70vh] flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full flex-1">
              <Image
                src={files[lightbox].url}
                alt={files[lightbox].name}
                fill
                className="object-contain rounded-xl"
                sizes="80vw"
              />
            </div>
            <p className="text-sm text-white/70 shrink-0">
              {files[lightbox].name} · {files[lightbox].sizeMb}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}