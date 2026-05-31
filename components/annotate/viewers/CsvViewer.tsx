'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CsvViewerProps {
  /** Raw CSV string */
  content: string
  filename: string
  index: number
  total: number
  readonly?: boolean
  onPrev?: () => void
  onNext?: () => void
  /** Column to highlight (used to draw attention to the target field) */
  targetColumn?: string
}

// ─── CSV parser (simple, no quoted-newlines) ──────────────────────────────────

function parseCsv(raw: string): { headers: string[]; rows: string[][] } {
  const lines = raw.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.trim())
  )
  return { headers, rows }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CsvViewer({
  content,
  filename,
  index,
  total,
  onPrev,
  onNext,
  targetColumn,
}: CsvViewerProps) {
  const { headers, rows } = useMemo(() => parseCsv(content), [content])
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 8
  const pageCount = Math.ceil(rows.length / PAGE_SIZE)
  const visibleRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900">
        {headers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">
            Fichier vide ou non lisible
          </div>
        ) : (
          <table className="w-full text-xs border-collapse min-w-max">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-3 py-2 text-left font-medium text-zinc-400 dark:text-zinc-500 w-10 shrink-0">
                  #
                </th>
                {headers.map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'px-3 py-2 text-left font-medium whitespace-nowrap',
                      targetColumn === h
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'text-zinc-500 dark:text-zinc-400'
                    )}
                  >
                    {h}
                    {targetColumn === h && (
                      <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-amber-500">
                        cible
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-3 py-2 text-zinc-300 dark:text-zinc-600 font-mono">
                    {page * PAGE_SIZE + rIdx + 1}
                  </td>
                  {headers.map((h, cIdx) => (
                    <td
                      key={h}
                      className={cn(
                        'px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300',
                        targetColumn === h
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 font-medium'
                          : ''
                      )}
                    >
                      {row[cIdx] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 gap-2">
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-35">{filename}</span>

        {/* CSV pagination */}
        {pageCount > 1 && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-30"
            >‹</button>
            <span>{page + 1} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-30"
            >›</button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <NavBtn onClick={onPrev ?? (() => {})} disabled={index <= 1}     label="Précédent"><ChevronLeft size={14} /></NavBtn>
          <span className="text-[10px] text-zinc-400 px-1">{index} / {total}</span>
          <NavBtn onClick={onNext ?? (() => {})} disabled={index >= total} label="Suivant"><ChevronRight size={14} /></NavBtn>
        </div>
      </div>
    </div>
  )
}

function NavBtn({ onClick, disabled, label, children }: {
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-md border transition-colors',
        disabled
          ? 'border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
    >{children}</button>
  )
}