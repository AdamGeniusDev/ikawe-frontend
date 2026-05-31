'use client'

// app/(root)/annotate/[sessionId]/page.tsx

import { useEffect, useCallback } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useAnnotationStore, selectCurrentElement } from '@/store/annotation.store'
import {
  getSessionById,
  getBatchById,
  canAccessBatch,
} from '@/constants/mock-data'
import { MOCK_USERS } from '@/types/user' 
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
import CaptioningTask     from '@/components/annotate/tasks/CaptioningTask'   // ← NOUVEAU

// ─── Utilisateur courant ──────────────────────────────────────────────────────

const CURRENT_USER = MOCK_USERS[0]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { batchId } = useParams<{ batchId: string }>()

  const batch = getBatchById(batchId)
  if (batch && !canAccessBatch(batch, CURRENT_USER.id)) notFound()

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
    toggleLabel(labelId)
    if (!session?.allowMultiple) {
      setTimeout(() => validateCurrent(), 2500)
    }
  }, [toggleLabel, session?.allowMultiple, validateCurrent])

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
        <div className="h-full">
          <BoundingBoxTask
            imageSrc={currentEl.src}
            filename={currentEl.filename}
            index={index}
            total={total}
            labels={session.labels}
            boxes={boundingBoxes}
            allowSkip={session.allowSkip}
            onAddBox={addBox}
            onRemoveBox={removeBox}
            onValidate={validateCurrent}
            onSkip={skipCurrent}
            onPrev={goPrev}
            onNext={goNext}
          />
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
            onTextSelect={setPendingSelection}
          />
        </div>

        <div className="w-full md:w-72 lg:w-80 shrink-0 overflow-y-auto bg-white dark:bg-zinc-900">
          <TaskPane
            session={session}
            selectedLabelIds={selectedLabelIds}
            spans={spans}
            pendingSelection={pendingSelection}
            transcriptionValue={transcriptionValue}
            onToggleLabel={handleToggleLabel}
            onValidate={validateCurrent}
            onSkip={skipCurrent}
            onLabelSelect={applyLabelToSelection}
            onRemoveSpan={removeSpan}
            onClearPending={() => setPendingSelection(null)}
            onTranscriptionChange={setTranscriptionValue}
          />
          <CommentField />
        </div>

      </div>
    </AnnotationShell>
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
      // ImageViewer convient pour bounding_box ET captioning
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
      return <JsonViewer key={element.id} {...commonProps} content={element.src} targetField={session.targetField}  />
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

    // ── NOUVEAU ──────────────────────────────────────────────────────────────
    case 'captioning':
      return (
        <CaptioningTask
          value={transcriptionValue}          // réutilise le même champ du store
          allowSkip={session.allowSkip}
          language={session.transcriptionLanguage}
          onChange={onTranscriptionChange}
          onValidate={onValidate}
          onSkip={onSkip}
        />
      )
    // ─────────────────────────────────────────────────────────────────────────

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

function CommentField() {
  const comment    = useAnnotationStore(s => s.annotationComment)
  const setComment = useAnnotationStore(s => s.setAnnotationComment)
  return (
    <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
        Note (optionnel)
      </p>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Remarque sur cet élément..."
        rows={2}
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
      />
    </div>
  )
}