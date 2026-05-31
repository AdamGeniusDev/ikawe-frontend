"use client"


import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, X, Save,
  Lock, Globe, Users, Tag,
  AlertCircle, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dataset } from "@/types/datasets"

// ─── Composants de champs ─────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-foreground">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground">{children}</p>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DatasetEditForm({original}: { original: Dataset }) {

  const router = useRouter()

  // ── State du formulaire ──────────────────────────────────────────────────────

  const [title,       setTitle]       = useState(original.title)
  const [description, setDescription] = useState(original.description ?? "")
  const [tags,        setTags]        = useState<string[]>(original.tags)
  const [tagInput,    setTagInput]    = useState("")
  const [visibility,  setVisibility]  = useState<Dataset['visibility']>(original.visibility)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const isDirty =
    title !== original.title ||
    description !== (original.description ?? "") ||
    JSON.stringify(tags) !== JSON.stringify(original.tags) ||
    visibility !== original.visibility

  // ── Tags ─────────────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput("")
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  // ── Sauvegarder ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    // TODO: appel API réel
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    await new Promise(r => setTimeout(r, 600))
    router.push(`/datasets/${original.id}`)
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header sticky */}
      <div className="sticky top-0 z-10 flex w-full items-center justify-between px-6 py-3 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/datasets/${original.id}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Retour
          </button>
          <span className="text-muted-foreground/30 text-sm">/</span>
          <span className="text-sm font-semibold truncate max-w-60">{original.title}</span>
          <span className="text-muted-foreground/30 text-sm">/</span>
          <span className="text-sm text-muted-foreground">Modifier</span>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && !saved && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />Modifications non enregistrées
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push(`/datasets/${original.id}`)}
            className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || !isDirty || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {saving ? (
              <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Enregistrement…</>
            ) : saved ? (
              <><CheckCircle2 className="h-3.5 w-3.5" />Enregistré</>
            ) : (
              <><Save className="h-3.5 w-3.5" />Enregistrer</>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-8 px-6 py-8 w-full max-w-2xl mx-auto">

        {/* Titre de section */}
        <div>
          <h1 className="text-lg font-bold tracking-tight">Modifier les métadonnées</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ces informations sont visibles par les membres ayant accès au dataset.
          </p>
        </div>

        {/* Formulaire */}
        <div className="flex flex-col gap-6">

          {/* Titre */}
          <div className="flex flex-col gap-2">
            <FieldLabel required>Titre</FieldLabel>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Nom du dataset"
            />
            <FieldHint>Choisissez un nom clair et descriptif.</FieldHint>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Décrivez le contenu, l'objectif et le contexte de ce dataset…"
            />
            <FieldHint>Une bonne description facilite la découverte et la collaboration.</FieldHint>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Tags</FieldLabel>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Ajouter un tag (Entrée pour valider)"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />Ajouter
              </button>
            </div>
            <FieldHint>Les tags améliorent la recherche. Utilisez des mots-clés pertinents.</FieldHint>
          </div>

          {/* Visibilité */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Visibilité</FieldLabel>
              <FieldHint>Détermine qui peut voir et accéder à ce dataset.</FieldHint>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                {
                  value:  'private' as const,
                  label:  'Privé',
                  icon:   Lock,
                  desc:   'Vous seul y avez accès.',
                  color:  'border-zinc-200 dark:border-zinc-700',
                  active: 'border-primary bg-primary/5 text-primary',
                },
                {
                  value:  'team' as const,
                  label:  'Équipe',
                  icon:   Users,
                  desc:   'Les membres assignés y ont accès.',
                  color:  'border-zinc-200 dark:border-zinc-700',
                  active: 'border-primary bg-primary/5 text-primary',
                },
                {
                  value:  'public' as const,
                  label:  'Public',
                  icon:   Globe,
                  desc:   'Visible par tous les utilisateurs.',
                  color:  'border-zinc-200 dark:border-zinc-700',
                  active: 'border-primary bg-primary/5 text-primary',
                },
              ]).map(opt => {
                const Icon   = opt.icon
                const active = visibility === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                      active
                        ? opt.active
                        : "hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] leading-relaxed opacity-70">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {/* Récapitulatif des changements */}
        {isDirty && (
          <div className="rounded-xl border bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Modifications en attente</p>
            <ul className="flex flex-col gap-1">
              {title !== original.title && (
                <li className="text-[11px] text-muted-foreground">
                  Titre : <span className="line-through opacity-50">{original.title}</span>{" → "}<span className="font-medium text-foreground">{title}</span>
                </li>
              )}
              {description !== (original.description ?? "") && (
                <li className="text-[11px] text-muted-foreground">Description modifiée</li>
              )}
              {JSON.stringify(tags) !== JSON.stringify(original.tags) && (
                <li className="text-[11px] text-muted-foreground">Tags modifiés ({tags.length} tag{tags.length !== 1 ? "s" : ""})</li>
              )}
              {visibility !== original.visibility && (
                <li className="text-[11px] text-muted-foreground">
                  Visibilité : <span className="opacity-50">{original.visibility}</span>{" → "}<span className="font-medium text-foreground">{visibility}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}