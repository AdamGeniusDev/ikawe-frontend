'use client'

import { useState, useRef, useCallback} from 'react'
import { RotateCcw, Pencil, Check, X as XIcon } from 'lucide-react'
import { useSettingsStore, type ShortcutKey, DEFAULT_SHORTCUTS } from '@/store/settings.store'
import { displayKey } from '@/components/annotate/ShortcutsPanel'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const AVAILABLE_LANGUAGES = [
  'Fon', 'Hausa', 'Wolof', 'Bambara', 'Yoruba',
]

// ─── Shared primitives ────────────────────────────────────────────────────────

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {children}
    </div>
  )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      {action}
    </div>
  )
}

function SwitchRow({
  id,
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  desc?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-6">
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
          {label}
        </Label>
        {desc && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-amber-500"
      />
    </div>
  )
}

// ─── ShortcutRow ──────────────────────────────────────────────────────────────

const SHORTCUT_LABELS: Record<ShortcutKey, string> = {
  validate:  'Valider annotation',
  next:      'Passer au suivant',
  prev:      'Retour au précédent',
  skip:      'Marquer comme incertain',
  openHelp:  'Ouvrir les raccourcis',
}

/**
 * Touches interdites comme raccourci : elles sont soit réservées système,
 * soit ambiguës dans un contexte d'annotation.
 */
const FORBIDDEN_KEYS = new Set([
  'Tab', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta',
  'OS', 'AltGraph', 'ContextMenu', 'Dead',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'PageUp', 'PageDown', 'Home', 'End',
])

function ShortcutRow({
  shortcutKey,
  value,
  isEditing,
  conflict,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  shortcutKey: ShortcutKey
  value: string
  isEditing: boolean
  conflict: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (newValue: string) => void
}) {
  const [captured, setCaptured] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      setCaptured(null)
      onCancelEdit()
      return
    }

    if (FORBIDDEN_KEYS.has(e.key)) return

    setCaptured(e.key)
  }, [onCancelEdit])

  const handleConfirm = () => {
    if (captured) onSave(captured)
    else onCancelEdit()
    setCaptured(null)
  }

  const handleCancel = () => {
    setCaptured(null)
    onCancelEdit()
  }

  return (
    <div className={`flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-4 transition-colors ${conflict ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {SHORTCUT_LABELS[shortcutKey]}
        </p>
        {conflict && (
          <p className="text-[11px] text-red-500 dark:text-red-400">
            Conflit avec un autre raccourci
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <>
            {/* Champ de capture */}
            <input
              ref={inputRef}
              autoFocus
              readOnly
              value={captured ? displayKey(captured) : ''}
              onKeyDown={handleKeyDown}
              placeholder="Appuyez sur une touche…"
              className="w-44 text-center text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-amber-400 dark:border-amber-500 rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 outline-none ring-2 ring-amber-400/30 transition"
            />
            {/* Confirmer */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!captured}
              aria-label="Confirmer"
              className="flex items-center justify-center w-7 h-7 rounded-md border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={13} />
            </button>
            {/* Annuler */}
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Annuler"
              className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <XIcon size={13} />
            </button>
          </>
        ) : (
          <>
            <kbd className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 min-w-8 text-center">
              {displayKey(value)}
            </kbd>
            <button
              type="button"
              onClick={onStartEdit}
              aria-label={`Modifier le raccourci pour "${SHORTCUT_LABELS[shortcutKey]}"`}
              className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pencil size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotationSettings() {
  const { annotation, updateAnnotation, toggleAnnotationLanguage, updateShortcut, resetShortcuts } =
    useSettingsStore()

  const [editingKey, setEditingKey] = useState<ShortcutKey | null>(null)

  const shortcuts = annotation.shortcuts

  // Détecte les conflits : deux raccourcis avec la même valeur
  const conflictMap = Object.entries(shortcuts).reduce<Record<string, ShortcutKey[]>>(
    (acc, [k, v]) => {
      if (!acc[v]) acc[v] = []
      acc[v].push(k as ShortcutKey)
      return acc
    },
    {}
  )

  const hasConflict = (key: ShortcutKey) =>
    (conflictMap[shortcuts[key]]?.length ?? 0) > 1

  const handleSave = (key: ShortcutKey, value: string) => {
  const alreadyUsed = Object.entries(shortcuts).some(
    ([k, v]) => k !== key && v === value
  )
  if (alreadyUsed) {
    toast.error('Cette touche est déjà utilisée par un autre raccourci')
    return
  }
  updateShortcut(key, value)
  setEditingKey(null)
}
  const isModified = (Object.keys(DEFAULT_SHORTCUTS) as ShortcutKey[]).some(
    (k) => shortcuts[k] !== DEFAULT_SHORTCUTS[k]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Workflow */}
      <SettingsCard>
        <CardHeader title="Flux de travail" />
        <SwitchRow
          id="double-validation"
          label="Validation double"
          desc="Chaque annotation doit être validée par 2 annotateurs"
          checked={annotation.doubleValidation}
          onCheckedChange={(v) => updateAnnotation({ doubleValidation: v })}
        />
        <SwitchRow
          id="mandatory-review"
          label="Révision obligatoire"
          desc="Les annotations passent par un réviseur avant validation"
          checked={annotation.mandatoryReview}
          onCheckedChange={(v) => updateAnnotation({ mandatoryReview: v })}
        />
        <SwitchRow
          id="consensus-mode"
          label="Mode consensus"
          desc="Accord majoritaire requis pour valider une annotation"
          checked={annotation.consensusMode}
          onCheckedChange={(v) => updateAnnotation({ consensusMode: v })}
        />
      </SettingsCard>

      {/* Languages */}
      <SettingsCard>
        <CardHeader title="Langues activées pour l'annotation" />
        <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <div key={lang} className="flex items-center justify-between">
              <Label
                htmlFor={`lang-${lang}`}
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                {lang}
              </Label>
              <Switch
                id={`lang-${lang}`}
                checked={annotation.enabledLanguages.includes(lang)}
                onCheckedChange={() => toggleAnnotationLanguage(lang)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Shortcuts */}
      <SettingsCard>
        <CardHeader
          title="Raccourcis clavier"
          action={
            isModified ? (
              <button
                type="button"
                onClick={resetShortcuts}
                className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <RotateCcw size={11} />
                Réinitialiser
              </button>
            ) : null
          }
        />

        {/* Info banner */}
        <div className="px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Cliquez sur <span className="font-medium text-zinc-500">✏️</span> puis appuyez sur la touche souhaitée.
            Les raccourcis 1–9 pour les labels sont fixes (position dans la liste).
          </p>
        </div>

        {(Object.keys(shortcuts) as ShortcutKey[]).map((key) => (
          <ShortcutRow
            key={editingKey === key ? `${key}-editing` : key}
            shortcutKey={key}
            value={shortcuts[key]}
            isEditing={editingKey === key}
            conflict={hasConflict(key)}
            onStartEdit={() => setEditingKey(key)}
            onCancelEdit={() => setEditingKey(null)}
            onSave={(v) => handleSave(key, v)}
          />
        ))}
      </SettingsCard>
    </div>
  )
}
