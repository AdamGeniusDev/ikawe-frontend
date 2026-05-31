'use client'

import { useState, useCallback, useMemo } from 'react'
import { Copy, Check, FileJson, FileCode2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JsonViewerProps {
  content:     string
  filename:    string
  index:       number
  total:       number
  readonly?:    boolean
  targetField?: string
  onPrev?:      () => void
  onNext?:      () => void
}

// ─── Token types ─────────────────────────────────────────────────────────────

type Token =
  | { type: 'key';    value: string; isTarget?: boolean }
  | { type: 'string'; value: string }
  | { type: 'number'; value: string }
  | { type: 'bool';   value: string }
  | { type: 'null';   value: string }
  | { type: 'punct';  value: string }

// ─── Tokenizer ───────────────────────────────────────────────────────────────

function tokenize(json: string, targetField?: string): Token[] {
  const tokens: Token[] = []
  const lines = json.split('\n')

  for (const line of lines) {
    const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/)

    if (keyMatch) {
      const [, indent, key, colon, rest] = keyMatch
      const isTarget = !!targetField && key === targetField
      tokens.push({ type: 'punct', value: indent })
      tokens.push({ type: 'key',   value: `"${key}"`, isTarget })
      tokens.push({ type: 'punct', value: colon })
      tokens.push(...tokenizeValue(rest, isTarget))
      tokens.push({ type: 'punct', value: '\n' })
    } else {
      tokens.push(...tokenizeValue(line.trim()))
      tokens.push({ type: 'punct', value: '\n' })
    }
  }

  return tokens
}

function tokenizeValue(raw: string, highlight = false): Token[] {
  const v     = raw.trim().replace(/,\s*$/, '')
  const trail = raw.trim().endsWith(',') ? ',' : ''
  const tokens: Token[] = []

  if (v.startsWith('"')) {
    tokens.push({ type: highlight ? 'key' : 'string', value: v })
  } else if (v === 'null') {
    tokens.push({ type: 'null',   value: 'null' })
  } else if (v === 'true' || v === 'false') {
    tokens.push({ type: 'bool',   value: v })
  } else if (!isNaN(Number(v)) && v !== '') {
    tokens.push({ type: 'number', value: v })
  } else {
    tokens.push({ type: 'punct',  value: raw.trimEnd() })
    return tokens
  }

  if (trail) tokens.push({ type: 'punct', value: ',' })
  return tokens
}

// ─── Token colors ─────────────────────────────────────────────────────────────

function tokenClass(tok: Token): string {
  if (tok.type === 'key' && 'isTarget' in tok && tok.isTarget) {
    return 'text-amber-300 font-semibold underline underline-offset-2'
  }
  const BASE: Record<Token['type'], string> = {
    key:    'text-violet-400',
    string: 'text-emerald-400',
    number: 'text-amber-400',
    bool:   'text-sky-400',
    null:   'text-zinc-500 italic',
    punct:  'text-zinc-400',
  }
  return BASE[tok.type]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function JsonViewer({
  content,
  filename,
  index,
  total,
  targetField,
  onPrev,
  onNext,
}: JsonViewerProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied]   = useState(false)

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }, [content])

  // 2. displayJson est maintenant stable et sécurisé pour le compilateur
  const displayJson = showRaw ? content : formatted

  // 3. Ajout de useMemo pour la tokenisation qui est une boucle lourde
  const tokens = useMemo(() => {
    return tokenize(displayJson, targetField)
  }, [displayJson, targetField])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(displayJson).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [displayJson])

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 overflow-hidden text-[11px] font-mono">

      {/* ── Header ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 shrink-0">

        {/* Toggle formatté / brut */}
        <div className="flex items-center gap-0.5 bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
          <TabBtn
            active={!showRaw}
            icon={<FileJson size={11} />}
            label="Formatté"
            onClick={() => setShowRaw(false)}
          />
          <TabBtn
            active={showRaw}
            icon={<FileCode2 size={11} />}
            label="Brut"
            onClick={() => setShowRaw(true)}
          />
        </div>

        {/* Target field badge */}
        {targetField && (
          <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/40">
            champ cible : {targetField}
          </span>
        )}

        <div className="flex-1" />

        {/* Copy */}
        <button
          type="button"
          aria-label="Copier le JSON"
          onClick={copy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          {copied
            ? <><Check size={11} className="text-emerald-400" /><span className="text-emerald-400">Copié</span></>
            : <><Copy size={11} /><span>Copier</span></>
          }
        </button>
      </div>

      {/* ── Content ── */}
      <pre className="flex-1 overflow-auto px-4 py-3 leading-5 whitespace-pre">
        {tokens.map((tok, i) => (
          <span key={i} className={tokenClass(tok)}>
            {tok.value}
          </span>
        ))}
      </pre>

      {/* ── Toolbar (navigation) ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 shrink-0">
        <span className="text-[11px] font-sans text-zinc-500 truncate max-w-40">
          {filename}
        </span>
        <div className="flex items-center gap-1">
          <NavBtn onClick={onPrev ?? (() => {})} disabled={index <= 1}     label="Précédent"><ChevronLeft  size={14} /></NavBtn>
          <span className="text-[10px] font-sans text-zinc-500 px-1">{index} / {total}</span>
          <NavBtn onClick={onNext ?? (() => {})} disabled={index >= total} label="Suivant"><ChevronRight size={14} /></NavBtn>
        </div>
      </div>
    </div>
  )
}

// ─── TabBtn ──────────────────────────────────────────────────────────────────

function TabBtn({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans transition-colors',
        active ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {icon}{label}
    </button>
  )
}

// ─── NavBtn ──────────────────────────────────────────────────────────────────

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
          ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
          : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
      )}
    >
      {children}
    </button>
  )
}