'use client'

// app/(root)/review/[batchId]/page.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle2, XCircle, ArrowLeft,
  ChevronLeft, ChevronRight, MessageSquare,
  ImageIcon, Music, FileText, Table2, Braces,
  AlertCircle, Check, Info, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ReviewItem,ReviewDecision,
  computeReviewProgress,
} from '@/types/review'
import { MOCK_REVIEW_SESSIONS } from '@/constants/mock-data'
import type { DataType } from '@/types/datasets'
import AnnotationReadOnlyViewer from '@/components/review/AnnotationReadOnlyViewer'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DataTypeIcon({ type, className }: { type: DataType; className?: string }) {
  const cls = cn('shrink-0', className)
  if (type === 'image') return <ImageIcon className={cn(cls, 'text-blue-500')} />
  if (type === 'audio') return <Music     className={cn(cls, 'text-violet-500')} />
  if (type === 'csv')   return <Table2    className={cn(cls, 'text-emerald-500')} />
  if (type === 'json')  return <Braces    className={cn(cls, 'text-amber-500')} />
  return                        <FileText  className={cn(cls, 'text-zinc-500')} />
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOGUE DE REJET
// ─────────────────────────────────────────────────────────────────────────────

function RejectDialog({
  open,
  initialComment,
  onConfirm,
  onCancel,
}: {
  open:           boolean
  initialComment: string
  onConfirm:      (comment: string) => void
  onCancel:       () => void
}) {
 
  const [comment, setComment] = useState(initialComment)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    // setTimeout pour laisser le DOM se rendre avant le focus
    const id = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])

  // Raccourcis clavier du dialogue
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && comment.trim()) {
        onConfirm(comment)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, comment, onConfirm, onCancel])

 
  if (!open) return null

  const canConfirm = comment.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md mx-4 rounded-2xl border border-red-200 dark:border-red-800/40 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-900/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Rejeter l'annotation</p>
              <p className="text-[10px] text-red-500/70 dark:text-red-500/60">Ce feedback sera visible par l'annotateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Raison du rejet <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
          </label>
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Expliquez ce qui ne va pas et comment corriger…"
            rows={4}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-300 dark:focus:border-red-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed transition-all"
          />
          {!canConfirm && (
            <p className="flex items-center gap-1.5 text-[10px] text-red-500">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Un commentaire est obligatoire pour rejeter
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 font-mono">Ctrl+↵ pour confirmer · Échap pour annuler</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => onConfirm(comment)}
              disabled={!canConfirm}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                canConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed',
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANNEAU DE RÉVISION
// ─────────────────────────────────────────────────────────────────────────────

function ReviewPanel({
  item,
  decision,
  onValidateAndSubmit,
  onOpenRejectDialog,
  currentIndex,
  total,
}: {
  item:                ReviewItem
  decision:            ReviewDecision
  onValidateAndSubmit: () => void
  onOpenRejectDialog:  () => void
  currentIndex:        number
  total:               number
}) {
  const isValidated = decision.status === 'validated'
  const isRejected  = decision.status === 'rejected'

  return (
    <div className="flex flex-col gap-5 h-full">

      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Révision · {currentIndex + 1} / {total}
      </p>

      {/* Note de l'annotateur */}
      {item.comment && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/10 px-3 py-2.5">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
              Note de l'annotateur
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
              "{item.comment}"
            </p>
          </div>
        </div>
      )}

      {/* Décision actuelle si déjà traitée */}
      {decision.status !== null && (
        <div className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-medium border',
          isValidated
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400',
        )}>
          {isValidated
            ? <><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Annotation validée</>
            : <><XCircle      className="h-3.5 w-3.5 shrink-0" /> Annotation rejetée</>
          }
        </div>
      )}

      {/* Boutons de décision */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Votre décision
        </p>

        {/* Valider */}
        <button
          type="button"
          onClick={onValidateAndSubmit}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left group',
            isValidated
              ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
          )}
        >
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            isValidated ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600',
          )}>
            <Check className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold',
              isValidated ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
              Valider
            </p>
            <p className="text-[10px] text-muted-foreground">L'annotation est correcte</p>
          </div>
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 shrink-0">V</kbd>
        </button>

        {/* Rejeter */}
        <button
          type="button"
          onClick={onOpenRejectDialog}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left group',
            isRejected
              ? 'border-red-400/50 bg-red-50 dark:bg-red-900/20'
              : 'border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10',
          )}
        >
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            isRejected ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-500',
          )}>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold',
              isRejected ? 'text-red-700 dark:text-red-400' : 'text-foreground')}>
              Rejeter
            </p>
            <p className="text-[10px] text-muted-foreground">Annotation incorrecte ou incomplète</p>
          </div>
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 shrink-0">R</kbd>
        </button>
      </div>

      {/* Feedback rejet affiché en lecture */}
      {isRejected && decision.comment && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-red-500 mb-1">Feedback envoyé</p>
          <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed italic">
            "{decision.comment}"
          </p>
        </div>
      )}

      {/* Raccourcis */}
      <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Raccourcis
        </p>
        {([
          { key: 'V',  label: 'Valider & passer au suivant' },
          { key: 'R',  label: 'Ouvrir le dialogue de rejet' },
          { key: '←',  label: 'Élément précédent' },
          { key: '→',  label: 'Élément suivant (si décidé)' },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <kbd className="shrink-0 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono font-semibold">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BARRE DE PROGRESSION
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({
  items,
  currentIndex,
  onJump,
}: {
  items:        ReviewItem[]
  currentIndex: number
  onJump:       (i: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {items.map((item, i) => (
        <button
          key={item.elementId}
          type="button"
          onClick={() => onJump(i)}
          title={item.element.filename}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-all',
            i === currentIndex
              ? 'bg-primary scale-y-125'
              : item.reviewStatus === 'validated'
                ? 'bg-emerald-500'
                : item.reviewStatus === 'rejected'
                  ? 'bg-red-400'
                  : 'bg-muted hover:bg-muted-foreground/30',
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const router      = useRouter()

  const session = MOCK_REVIEW_SESSIONS[batchId]


  const [items, setItems] = useState<ReviewItem[]>(session?.items ?? [])

  const [currentIndex, setCurrentIndex] = useState(0)

  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>(
    () => Object.fromEntries(
      (session?.items ?? []).map(i => [
        i.elementId,
        {
          status:  i.reviewStatus === 'pending'
            ? null
            : (i.reviewStatus as 'validated' | 'rejected'),
          comment: i.reviewComment ?? '',
        },
      ]),
    ),
  )

  const [showInstructions, setShowInstructions] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  // ── Valeurs dérivées ──────────────────────────────────────────────────────
  // Calculées ici (avant les callbacks) pour éviter les dépendances circulaires

  const currentItem = items[currentIndex]
  const decision    = decisions[currentItem?.elementId] ?? { status: null, comment: '' }
  const progress    = computeReviewProgress(items)
  const isFirst     = currentIndex === 0
  const isLast      = currentIndex === items.length - 1
  const allDone     = progress.pending === 0

  // ── Mutations d'état ──────────────────────────────────────────────────────

  const commitDecision = useCallback((
    status:  'validated' | 'rejected',
    comment: string,
  ) => {
    if (!currentItem) return

    setDecisions(prev => ({
      ...prev,
      [currentItem.elementId]: { status, comment },
    }))

    setItems(prev => prev.map(item =>
      item.elementId === currentItem.elementId
        ? { ...item, reviewStatus: status, reviewComment: comment, reviewedAt: new Date().toISOString() }
        : item,
    ))

    if (!isLast) setCurrentIndex(i => i + 1)
  }, [currentItem, isLast])

  const validateAndSubmit = useCallback(() => {
    commitDecision('validated', '')
  }, [commitDecision])

  const handleRejectConfirm = useCallback((comment: string) => {
    setRejectDialogOpen(false)
    commitDecision('rejected', comment)
  }, [commitDecision])

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    if (decision.status === null) return
    setCurrentIndex(i => Math.min(items.length - 1, i + 1))
  }, [decision.status, items.length])

  // ── Raccourcis clavier ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (rejectDialogOpen) return

      if (e.key === 'v' || e.key === 'V') { e.preventDefault(); validateAndSubmit() }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setRejectDialogOpen(true) }
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [validateAndSubmit, goNext, goPrev, rejectDialogOpen])

  // ── CORRECTION 4 ──────────────────────────────────────────────────────────
  // Le return conditionnel (session introuvable) est APRÈS tous les hooks.

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Batch introuvable ou déjà révisé.</p>
          <button onClick={() => router.push('/tasks')} className="mt-3 text-sm text-primary hover:underline">
            Retour aux tâches
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── CORRECTION 5 ──────────────────────────────────────────────────────
          La key={currentItem.elementId} sur RejectDialog réinitialise
          le composant (et donc son state `comment`) à chaque changement
          d'élément — sans avoir besoin de setComment() dans un useEffect. */}
      <RejectDialog
        key={currentItem?.elementId ?? 'dialog'}
        open={rejectDialogOpen}
        initialComment={decision.comment}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectDialogOpen(false)}
      />

      <div className="flex flex-col w-full min-h-screen">

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 flex w-full items-center gap-3 px-6 py-3 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => router.push('/tasks')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <DataTypeIcon type={session.dataType} className="h-4 w-4" />
            <span className="text-sm font-semibold truncate">{session.datasetName}</span>
            <span className="text-[11px] text-muted-foreground shrink-0">
              · Batch {session.batchId.split('-').slice(-1)}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-600 font-semibold">{progress.validated} ✓</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-red-500 font-semibold">{progress.rejected} ✗</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-muted-foreground">{progress.pending} à revoir</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {currentIndex + 1} / {items.length}
            </span>
            {session.instructions && (
              <button
                type="button"
                onClick={() => setShowInstructions(p => !p)}
                className={cn(
                  'flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors',
                  showInstructions
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <Info className="h-3 w-3" />
                Instructions
              </button>
            )}
          </div>
        </div>

        {/* ── Instructions ── */}
        {showInstructions && session.instructions && (
          <div className="px-6 py-3 border-b bg-muted/30">
            <div className="flex flex-col gap-1 max-w-2xl">
              {session.instructions.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className={cn(
                  'text-sm',
                  line.startsWith('•') ? 'pl-3 text-muted-foreground text-[12px]' : 'font-medium',
                )}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Corps ── */}
        {allDone ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Révision terminée</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {progress.validated} validée{progress.validated > 1 ? 's' : ''} ·{' '}
                {progress.rejected} rejetée{progress.rejected > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/tasks')}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Retour aux tâches
              </button>
              <button
                type="button"
                onClick={() => router.push('/annotate')}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continuer à annoter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Zone principale ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">

              {/* Navigation + barre de progression */}
              <div className="flex items-center gap-3 px-6 pt-4 pb-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Précédent
                </button>

                <div className="flex-1">
                  <ProgressBar items={items} currentIndex={currentIndex} onJump={setCurrentIndex} />
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={isLast || decision.status === null}
                  title={decision.status === null ? 'Prenez une décision avant de continuer' : undefined}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Suivant
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* En-tête de l'élément */}
              <div className="flex items-center justify-between px-6 pt-2 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {currentItem?.element.filename}
                  </span>
                  {currentItem?.reviewStatus !== 'pending' && (
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      currentItem?.reviewStatus === 'validated'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                    )}>
                      {currentItem?.reviewStatus === 'validated' ? '✓ Validé' : '✗ Rejeté'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Annoté par {currentItem?.annotatedBy}
                </span>
              </div>

              {/* Viewer */}
              <div className="px-6 pb-6 pt-2">
                {currentItem && (
                  <AnnotationReadOnlyViewer item={currentItem} session={session} />
                )}
              </div>
            </div>

            {/* ── Panneau latéral ── */}
            <div className="w-80 shrink-0 border-l bg-muted/20 overflow-y-auto px-5 py-5">
              {currentItem && (
                <ReviewPanel
                  item={currentItem}
                  decision={decision}
                  onValidateAndSubmit={validateAndSubmit}
                  onOpenRejectDialog={() => setRejectDialogOpen(true)}
                  currentIndex={currentIndex}
                  total={items.length}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}