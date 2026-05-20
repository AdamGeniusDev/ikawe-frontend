"use client"

import { TableIcon } from "lucide-react"

export interface CsvFilePreview {
  id:      string
  name:    string
  sizeMb:  string
  headers: string[]
  rows:    string[][]  // max 5 lignes
}

interface CsvPreviewProps {
  files:        CsvFilePreview[]
  totalCount:   number
  detectedExts: string[]
}

export function CsvPreview({ files, totalCount, detectedExts }: CsvPreviewProps) {
  const file = files[0]
  if (!file) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TableIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Aperçu — {file.name}
        </p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {totalCount} fichier{totalCount > 1 ? "s" : ""} au total
          {detectedExts.length > 0 && <> · {detectedExts.map(e => `.${e}`).join(" · ")}</>}
        </span>
      </div>

      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted">
              {file.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {file.rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-foreground max-w-50 truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {file.headers.length} colonne{file.headers.length > 1 ? "s" : ""} détectée{file.headers.length > 1 ? "s" : ""}
        {totalCount > 1 && ` · ${totalCount - 1} autre${totalCount > 2 ? "s" : ""} fichier${totalCount > 2 ? "s" : ""} non affiché${totalCount > 2 ? "s" : ""}`}
      </p>
    </div>
  )
}