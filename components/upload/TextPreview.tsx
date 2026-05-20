"use client"

import { FileText, Braces } from "lucide-react"

export interface TextFilePreview {
  id:      string
  name:    string
  sizeMb:  string
  lines:   string[]   // max 20 lignes
  type:    "txt" | "json"
}

interface TextPreviewProps {
  files:        TextFilePreview[]
  totalCount:   number
  detectedExts: string[]
}

export function TextPreview({ files, totalCount, detectedExts }: TextPreviewProps) {
  const file = files[0]
  if (!file) return null

  const Icon = file.type === "json" ? Braces : FileText

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Aperçu — {file.name}
        </p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {totalCount} fichier{totalCount > 1 ? "s" : ""} au total
          {detectedExts.length > 0 && <> · {detectedExts.map(e => `.${e}`).join(" · ")}</>}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-muted overflow-auto max-h-52">
        <pre className="p-3 text-[11px] leading-relaxed text-foreground font-mono whitespace-pre-wrap break-all">
          {file.lines.join("\n")}
        </pre>
      </div>

      {totalCount > 1 && (
        <p className="text-[11px] text-muted-foreground">
          + {totalCount - 1} autre{totalCount > 2 ? "s" : ""} fichier{totalCount > 2 ? "s" : ""} non affiché{totalCount > 2 ? "s" : ""}
        </p>
      )}
    </div>
  )
}