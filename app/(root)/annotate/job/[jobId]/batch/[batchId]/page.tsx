'use client'

// app/(root)/annotate/job/[jobId]/batch/[batchId]/page.tsx

import { useEffect, useCallback } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Eye } from 'lucide-react'
import { useAnnotationStore, selectCurrentElement } from '@/store/annotation.store'
import {
  MOCK_JOBS,
  getSessionById,
  getBatchById,
  canAccessBatch,
} from '@/constants/mock-data'
import { CURRENT_USER } from '@/constants/mock-data'
import AnnotationShell    from '@/components/annotate/AnnotationShell'
import CompletionScreen   from '@/components/annotate/CompletionScreen'
import ImageViewer        from '@/components/annotate/viewers/ImageViewer'
import AudioViewer        from '@/components/annotate/viewers/AudioViewer'
import TextViewer         from '@/components/annotate/viewers/TextViewer'
import CsvViewer          from '@/components/annotate/viewers/CsvViewer'
import JsonViewer         from '@/components/annotate/viewers/JsonViewer'
import ClassificationTask from '@/components/annotate/tasks/ClassificationTask'
import BoundingBoxTask    from '@/components/annotate/tasks/BoundingboxTask'
import TranscriptionTask  from '@/components/annotate/tasks/TranscriptionTask'
import SequenceTask       from '@/components/annotate/tasks/SequenceTask'
import CaptioningTask     from '@/components/annotate/tasks/CaptioningTask'

// ─── Utilisateur courant ──────────────────────────────────────────────────────



const noop = () => {}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { jobId, batchId } = useParams<{ jobId: string; batchId: string }>()

  // Accès : le batch doit exister et appartenir au job de l'URL
  const job   = MOCK_JOBS.find(j => j.id === jobId)
  const batch = getBatchById(batchId)
  if (!job || !batch || batch.jobId !== jobId) notFound()

  // Annotateur assigné = édition. Owner du job = lecture seule. Sinon 404.
  const canEdit = canAccessBatch(batch, CURRENT_USER.id)
  const isOwner = job.createdBy === CURRENT_USER.id
  if (!canEdit && !isOwner) notFound()
  const readOnly = !canEdit

  const sessionData = getSessionById(batchId)

  const loadSession  = useAnnotationStore(s => s.loadSession)
  const session      = useAnnotationStore(s => s.session)
  const currentIdx   = useAnnotationStore(s => s.currentIdx)
  const isComplete   = useAnnotationStore(s => s.isComplete)
  const currentEl    = useAnnotationStore(selectCurrentElement)

  const selectedLabelIds      = useAnnotationStore(s => s.selectedLabelIds)
  const toggleLabel           = useAnnotationStore(s => s.toggleLabel)
  const boundingBoxes         = useAnnotationStore(s => s.boundingBoxes)
  const addBox                = useAnnotationStore(s => s.addBox)
  const removeBox             = useAnnotationStore(s => s.removeBox)
  const spans                 = useAnnotationStore(s => s.spans)
  const pendingSelection      = useAnnotationStore(s => s.pendingSelection)
  const setPendingSelection   = useAnnotationStore(s => s.setPendingSelection)
  const applyLabelToSelection = useAnnotationStore(s => s.applyLabelToSelection)
  const removeSpan            = useAnnotationStore(s => s.removeSpan)
  const transcriptionValue    = useAnnotationStore(s => s.transcriptionValue)
  const setTranscriptionValue = useAnnotationStore(s => s.setTranscriptionValue)
  const validateCurrent       = useAnnotationStore(s => s.validateCurrent)
  const skipCurrent           = useAnnotationStore(s => s.skipCurrent)
  const goNext                = useAnnotationStore(s => s.goNext)
  const goPrev                = useAnnotationStore(s => s.goPrev)

  useEffect(() => {
    if (!sessionData) return
    if (session?.id !== sessionData.id) loadSession(sessionData)
  }, [sessionData, session?.id, loadSession])

  const handleToggleLabel = useCallback((labelId: string) => {
    if (readOnly) return
    toggleLabel(labelId)
    if (!session?.allowMultiple) {
      setTimeout(() => validateCurrent(), 2500)
    }
  }, [readOnly, toggleLabel, session?.allowMultiple, validateCurrent])

  if (!sessionData) notFound()
  if (!session || session.id !== batchId || !currentEl) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-zinc-400">
        Chargement…
      </div>
    )
  }

  if (isComplete) {
    return (
      <AnnotationShell>
        <CompletionScreen />
      </AnnotationShell>
    )
  }

  const total = session.elements.length
  const index = currentIdx + 1

  // BoundingBox — layout spécial plein écran
  if (session.taskType === 'bounding_box' && session.dataType === 'image') {
    return (
      <AnnotationShell>
        <div className="flex h-full flex-col">
          {readOnly && <ReadOnlyBanner />}
          <div className="flex-1 min-h-0">
            <BoundingBoxTask
              imageSrc={currentEl.src}
              filename={currentEl.filename}
              index={index}
              total={total}
              labels={session.labels}
              boxes={boundingBoxes}
              allowSkip={session.allowSkip}
              onAddBox={readOnly ? noop : addBox}
              onRemoveBox={readOnly ? noop : removeBox}
              onValidate={readOnly ? noop : validateCurrent}
              onSkip={readOnly ? noop : skipCurrent}
              onPrev={goPrev}
              onNext={goNext}
            />
          </div>
        </div>
      </AnnotationShell>
    )
  }

  // Layout standard : Viewer gauche + Task droite
  return (
    <AnnotationShell>
      <div className="flex h-full flex-col md:flex-row overflow-hidden">

        <div className="flex-1 min-h-0 min-w-0 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
          <ViewerPane
            session={session}
            element={currentEl}
            index={index}
            total={total}
            spans={spans}
            pendingSelection={pendingSelection}
            onPrev={goPrev}
            onNext={goNext}
            onTextSelect={readOnly ? noop : setPendingSelection}
          />
        </div>

        <div className="w-full md:w-72 lg:w-80 shrink-0 overflow-y-auto bg-white dark:bg-zinc-900">
          {readOnly && <ReadOnlyBanner />}
          <div
            aria-disabled={readOnly}
            className={readOnly ? 'pointer-events-none select-none opacity-60' : ''}
          >
            <TaskPane
              session={session}
              selectedLabelIds={selectedLabelIds}
              spans={spans}
              pendingSelection={pendingSelection}
              transcriptionValue={transcriptionValue}
              onToggleLabel={handleToggleLabel}
              onValidate={readOnly ? noop : validateCurrent}
              onSkip={readOnly ? noop : skipCurrent}
              onLabelSelect={readOnly ? noop : applyLabelToSelection}
              onRemoveSpan={readOnly ? noop : removeSpan}
              onClearPending={readOnly ? noop : () => setPendingSelection(null)}
              onTranscriptionChange={readOnly ? noop : setTranscriptionValue}
            />
            <CommentField readOnly={readOnly} />
          </div>
        </div>

      </div>
    </AnnotationShell>
  )
}

// ─── ReadOnlyBanner ───────────────────────────────────────────────────────────

function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      Lecture seule : ce groupe n'est pas assigné à vous.
    </div>
  )
}

// ─── ViewerPane ───────────────────────────────────────────────────────────────

interface ViewerPaneProps {
  session:          NonNullable<ReturnType<typeof useAnnotationStore.getState>['session']>
  element:          NonNullable<ReturnType<typeof selectCurrentElement>>
  index:            number
  total:            number
  spans:            ReturnType<typeof useAnnotationStore.getState>['spans']
  pendingSelection: ReturnType<typeof useAnnotationStore.getState>['pendingSelection']
  onPrev:           () => void
  onNext:           () => void
  onTextSelect:     (sel: { text: string; start: number; end: number }) => void
}

function ViewerPane({
  session, element, index, total, spans, onPrev, onNext, onTextSelect,
}: ViewerPaneProps) {
  const commonProps = { index, total, filename: element.filename, onPrev, onNext }

  switch (session.dataType) {
    case 'image':
      return <ImageViewer key={element.id} {...commonProps} src={element.src} />

    case 'audio':
      return <AudioViewer key={element.id} {...commonProps} src={element.src} />

    case 'text': {
      const highlights = spans.map(span => {
        const label = session.labels.find(l => l.id === span.labelId)
        return {
          start: span.start, end: span.end,
          label:     label?.name  ?? span.labelId,
          color:     label?.color ?? '#888888',
          textColor: label?.color ?? '#888888',
        }
      })
      return (
        <TextViewer
          key={element.id}
          {...commonProps}
          content={element.src}
          onTextSelect={session.taskType === 'sequence' ? onTextSelect : undefined}
          highlights={highlights}
        />
      )
    }

    case 'csv':
      return <CsvViewer  key={element.id} {...commonProps} content={element.src} targetColumn={session.targetField} />

    case 'json':
      return <JsonViewer key={element.id} {...commonProps} content={element.src} targetField={session.targetField} />
  }
}

// ─── TaskPane ─────────────────────────────────────────────────────────────────

interface TaskPaneProps {
  session:               NonNullable<ReturnType<typeof useAnnotationStore.getState>['session']>
  selectedLabelIds:      string[]
  spans:                 ReturnType<typeof useAnnotationStore.getState>['spans']
  pendingSelection:      ReturnType<typeof useAnnotationStore.getState>['pendingSelection']
  transcriptionValue:    string
  onToggleLabel:         (id: string) => void
  onValidate:            () => void
  onSkip:                () => void
  onLabelSelect:         (id: string) => void
  onRemoveSpan:          (id: string) => void
  onClearPending:        () => void
  onTranscriptionChange: (val: string) => void
}

function TaskPane({
  session, selectedLabelIds, spans, pendingSelection, transcriptionValue,
  onToggleLabel, onValidate, onSkip, onLabelSelect, onRemoveSpan,
  onClearPending, onTranscriptionChange,
}: TaskPaneProps) {
  switch (session.taskType) {
    case 'classification':
      return (
        <ClassificationTask
          labels={session.labels}
          selectedIds={selectedLabelIds}
          allowMultiple={session.allowMultiple ?? false}
          allowSkip={session.allowSkip}
          onToggle={onToggleLabel}
          onValidate={onValidate}
          onSkip={onSkip}
        />
      )
    case 'transcription':
      return (
        <TranscriptionTask
          value={transcriptionValue}
          language={session.transcriptionLanguage}
          allowSkip={session.allowSkip}
          minLength={session.transcriptionMinLength ?? 3}
          onChange={onTranscriptionChange}
          onValidate={onValidate}
          onSkip={onSkip}
        />
      )
    case 'sequence':
      return (
        <SequenceTask
          labels={session.labels}
          spans={spans}
          pendingSelection={pendingSelection}
          allowSkip={session.allowSkip}
          onLabelSelect={onLabelSelect}
          onRemoveSpan={onRemoveSpan}
          onValidate={onValidate}
          onSkip={onSkip}
          onClearPending={onClearPending}
        />
      )
    case 'captioning':
      return (
        <CaptioningTask
          value={transcriptionValue}
          allowSkip={session.allowSkip}
          language={session.transcriptionLanguage}
          onChange={onTranscriptionChange}
          onValidate={onValidate}
          onSkip={onSkip}
        />
      )
    case 'bounding_box':
      return (
        <div className="flex items-center justify-center h-full text-sm text-zinc-400 p-4">
          BoundingBox nécessite un dataset de type image.
        </div>
      )
    default:
      return null
  }
}

// ─── CommentField ─────────────────────────────────────────────────────────────

function CommentField({ readOnly }: { readOnly: boolean }) {
  const comment    = useAnnotationStore(s => s.annotationComment)
  const setComment = useAnnotationStore(s => s.setAnnotationComment)
  return (
    <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
        Note (optionnel)
      </p>
      <textarea
        value={comment}
        onChange={e => { if (!readOnly) setComment(e.target.value) }}
        readOnly={readOnly}
        placeholder="Remarque sur cet élément..."
        rows={2}
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
      />
    </div>
  )
}