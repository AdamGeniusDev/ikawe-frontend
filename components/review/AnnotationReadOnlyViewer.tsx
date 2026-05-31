'use client'

// components/review/AnnotationReadOnlyViewer.tsx

// ce composant injecte :
//   - des valeurs neutres pour les props de navigation (index=1, total=1, noop)
//   - les données annotées (appliedLabels) converties dans le format attendu
//   - des handlers vides pour les callbacks de mutation
//   - un wrapper CSS `pointer-events-none` sur les zones interactives inutiles
//
// On ne modifie PAS les composants existants — zero régression sur l'annotation.

import { cn } from '@/lib/utils'

// Viewers
import ImageViewer  from '@/components/annotate/viewers/ImageViewer'
import AudioViewer  from '@/components/annotate/viewers/AudioViewer'
import TextViewer   from '@/components/annotate/viewers/TextViewer'
import CsvViewer    from '@/components/annotate/viewers/CsvViewer'
import JsonViewer   from '@/components/annotate/viewers/JsonViewer'

// Tasks
import ClassificationTask from '@/components/annotate/tasks/ClassificationTask'
import BoundingBoxTask    from '@/components/annotate/tasks/BoundingboxTask'
import TranscriptionTask  from '@/components/annotate/tasks/TranscriptionTask'
import SequenceTask       from '@/components/annotate/tasks/SequenceTask'
import CaptioningTask     from '@/components/annotate/tasks/CaptioningTask'

// Types
import type { ReviewItem, ReviewSession } from '@/types/review'
import type { BoundingBox, SpanAnnotation } from '@/types/annotation'

// ─── Noop constants (évite de recréer une fonction à chaque render) ───────────

const NOOP       = () => {}
const NOOP_STR   = (_: string) => {}

// ─── Wrapper "read-only" ──────────────────────────────────────────────────────
// Superpose une div transparente sur la zone interactive pour bloquer
// toute interaction souris sans casser le rendu visuel.
// On désactive aussi tabIndex pour l'accessibilité.

function ReadOnlyOverlay({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {/* Overlay transparent — bloque clics / hover sans masquer le contenu */}
      <div
        className="absolute inset-0 z-10"
        style={{ cursor: 'default' }}
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Sous-composants par type de tâche ───────────────────────────────────────

// ── Classification ─────────────────────────────────────────────────────────

function ReadOnlyClassification({ item, session }: {
  item: ReviewItem; session: ReviewSession
}) {
  const selectedIds = item.appliedLabels.map(a => a.labelId)

  return (
    <div className="flex flex-col gap-3">
      {/* Viewer du média */}
      <ReadOnlyViewer item={item} session={session} />

      {/* Labels sélectionnés — rendu figé */}
      <ReadOnlyOverlay>
        <ClassificationTask
          labels={session.labels}
          selectedIds={selectedIds}
          allowMultiple={selectedIds.length > 1}
          allowSkip={false}
          onToggle={NOOP_STR}
          onValidate={NOOP}
          onSkip={NOOP}
        />
      </ReadOnlyOverlay>
    </div>
  )
}

// ── Bounding Box ────────────────────────────────────────────────────────────
// BoundingBoxTask gère lui-même l'affichage de l'image + les boxes.
// On lui passe les boxes annotées et des handlers vides.

function ReadOnlyBoundingBox({ item, session }: {
  item: ReviewItem; session: ReviewSession
}) {
  // Convertit AppliedLabel[] → BoundingBox[] (format interne de BoundingboxTask)
  const boxes: BoundingBox[] = item.appliedLabels
    .filter(a => a.bbox)
    .map((a, i) => ({
      id:      `ro-${i}`,
      x:       a.bbox!.x,
      y:       a.bbox!.y,
      w:       a.bbox!.w,
      h:       a.bbox!.h,
      labelId: a.labelId,
    }))

  return (
    <ReadOnlyOverlay className="h-120">
      <BoundingBoxTask
        imageSrc={item.element.src}
        filename={item.element.filename}
        index={1}
        total={1}
        labels={session.labels}
        boxes={boxes}
        allowSkip={false}
        onAddBox={NOOP}
        onRemoveBox={NOOP_STR}
        onValidate={NOOP}
        onSkip={NOOP}
        onPrev={NOOP}
        onNext={NOOP}
      />
    </ReadOnlyOverlay>
  )
}

// ── Transcription ───────────────────────────────────────────────────────────

function ReadOnlyTranscription({ item , session }: {
  item: ReviewItem; session: ReviewSession
}) {
  const transcription = item.appliedLabels[0]?.transcription ?? ''

  return (
    <div className="flex flex-col gap-3">
      {/* Player audio (read-only via overlay) */}
      <ReadOnlyOverlay>
        <AudioViewer
          src={item.element.src}
          filename={item.element.filename}
          index={1}
          total={1}
          onPrev={NOOP}
          onNext={NOOP}
        />
      </ReadOnlyOverlay>

      {/* Transcription soumise — champ figé */}
      <ReadOnlyOverlay>
        <TranscriptionTask
          value={transcription}
          allowSkip={false}
          onChange={NOOP_STR}
          onValidate={NOOP}
          onSkip={NOOP}
        />
      </ReadOnlyOverlay>
    </div>
  )
}

// ── Sequence (NER) ──────────────────────────────────────────────────────────

function ReadOnlySequence({ item, session }: {
  item: ReviewItem; session: ReviewSession
}) {
  // Convertit AppliedLabel[] → SpanAnnotation[]
  const spans: SpanAnnotation[] = item.appliedLabels
    .filter(a => a.span)
    .map((a, i) => ({
      id:      `ro-${i}`,
      start:   a.span!.start,
      end:     a.span!.end,
      text:    a.span!.text,
      labelId: a.labelId,
    }))

  // Highlights pour le TextViewer
  const highlights = spans.map(span => {
    const label = session.labels.find(l => l.id === span.labelId)
    return {
      start:     span.start,
      end:       span.end,
      label:     label?.name ?? span.labelId,
      color:     label?.color ?? '#888',
      textColor: label?.color ?? '#888',
    }
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Texte avec highlights (pas d'onTextSelect → pas de sélection possible) */}
      <ReadOnlyOverlay>
        <TextViewer
          content={item.element.src}
          filename={item.element.filename}
          readonly
          index={1}
          total={1}
          highlights={highlights}
        />
      </ReadOnlyOverlay>

      {/* Liste des spans — SequenceTask figé */}
      <ReadOnlyOverlay>
        <SequenceTask
          labels={session.labels}
          spans={spans}
          pendingSelection={null}
          allowSkip={false}
          onLabelSelect={NOOP_STR}
          onRemoveSpan={NOOP_STR}
          onValidate={NOOP}
          onSkip={NOOP}
          onClearPending={NOOP}
        />
      </ReadOnlyOverlay>
    </div>
  )
}

// ── Captioning ──────────────────────────────────────────────────────────────

function ReadOnlyCaptioning({ item, session }: {
  item: ReviewItem; session: ReviewSession
}) {
  const caption = item.appliedLabels[0]?.transcription ?? ''

  return (
    <div className="flex flex-col gap-3">
      {/* Image */}
      <ReadOnlyOverlay>
        <ImageViewer
          src={item.element.src}
          filename={item.element.filename}
          index={1}
          total={1}
        />
      </ReadOnlyOverlay>

      {/* Légende soumise — champ figé */}
      <ReadOnlyOverlay>
        <CaptioningTask
          value={caption}
          allowSkip={false}
          onChange={NOOP_STR}
          onValidate={NOOP}
          onSkip={NOOP}
        />
      </ReadOnlyOverlay>
    </div>
  )
}

// ─── Viewer générique du média (pour les tâches qui séparent média et task) ──
// Utilisé par Classification (texte/image/csv/json) et éventuellement d'autres.

function ReadOnlyViewer({ item, session }: {
  item: ReviewItem; session: ReviewSession
}) {
  const { element } = item
  const { dataType } = session

  switch (dataType) {
    case 'image':
      return (
        <ReadOnlyOverlay>
          <ImageViewer
            src={element.src}
            filename={element.filename}
            index={1}
            total={1}
          />
        </ReadOnlyOverlay>
      )
    case 'audio':
      // Audio sans classification → afficher le player seul
      return (
        <ReadOnlyOverlay>
          <AudioViewer
            src={element.src}
            filename={element.filename}
            index={1}
            total={1}
          />
        </ReadOnlyOverlay>
      )
    case 'csv':
      return (
        <ReadOnlyOverlay>
          <CsvViewer
            content={element.src}
            filename={element.filename}
            index={1}
            total={1}
          />
        </ReadOnlyOverlay>
      )
    case 'json':
      return (
        <ReadOnlyOverlay>
          <JsonViewer
            content={element.src}
            filename={element.filename}
            index={1}
            total={1}
          />
        </ReadOnlyOverlay>
      )
    default:
      return (
        <ReadOnlyOverlay>
          <TextViewer
            content={element.src}
            filename={element.filename}
            readonly
            index={1}
            total={1}
          />
        </ReadOnlyOverlay>
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function AnnotationReadOnlyViewer({
  item,
  session,
}: {
  item:    ReviewItem
  session: ReviewSession
}) {
  switch (session.taskType) {
    case 'classification':
      return <ReadOnlyClassification item={item} session={session} />
    case 'bounding_box':
      return <ReadOnlyBoundingBox    item={item} session={session} />
    case 'transcription':
      return <ReadOnlyTranscription  item={item} session={session} />
    case 'sequence':
      return <ReadOnlySequence       item={item} session={session} />
    case 'captioning':
      return <ReadOnlyCaptioning     item={item} session={session} />
    default:
      return (
        <div className="text-sm text-muted-foreground italic px-4 py-3">
          Type de tâche non supporté en révision.
        </div>
      )
  }
}