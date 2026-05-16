import { create } from 'zustand'
import type {
  AnnotationSession,
  ElementAnnotation,
  AppliedLabel,
  AnnotationStatus,
} from '@/types/annotation'
import type { BoundingBox } from '@/components/annotate/tasks/BoundingboxTask'
import type { SpanAnnotation } from '@/components/annotate/tasks/SequenceTask'
import { generateInitialAnnotations } from '@/constants/mock-data-annotate'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnotationMode = 'manual' | 'ai' | 'hybrid'

// ─── State ────────────────────────────────────────────────────────────────────

interface AnnotationState {
  session:            AnnotationSession | null
  annotations:        Record<string, ElementAnnotation>
  currentIdx:         number
  isComplete:         boolean
  selectedLabelIds:   string[]
  boundingBoxes:      BoundingBox[]
  spans:              SpanAnnotation[]
  pendingSelection:   { text: string; start: number; end: number } | null
  transcriptionValue: string
  annotationComment: string
  mode:               AnnotationMode   // ← nouveau
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface AnnotationActions {
  loadSession:            (session: AnnotationSession) => void
  clearSession:           () => void
  goTo:                   (idx: number) => void
  goNext:                 () => void
  goPrev:                 () => void
  toggleLabel:            (labelId: string) => void
  addBox:                 (box: Omit<BoundingBox, 'id'>) => void
  removeBox:              (boxId: string) => void
  setPendingSelection:    (sel: { text: string; start: number; end: number } | null) => void
  applyLabelToSelection:  (labelId: string) => void
  removeSpan:             (spanId: string) => void
  setTranscriptionValue:  (value: string) => void
  validateCurrent:        () => void
  markUncertain:          () => void
  skipCurrent:            () => void
  setAnnotationComment:   (comment: string) => void
  setMode:                (mode: AnnotationMode) => void  // ← nouveau
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASK_RESET: Pick<
  AnnotationState,
  'selectedLabelIds' | 'boundingBoxes' | 'spans' | 'pendingSelection' | 'transcriptionValue' | 'annotationComment'
> = {
  selectedLabelIds:   [],
  boundingBoxes:      [],
  spans:              [],
  pendingSelection:   null,
  transcriptionValue: '',
  annotationComment: '',
}

function computeIsComplete(annotations: Record<string, ElementAnnotation>): boolean {
  const values = Object.values(annotations)
  if (values.length === 0) return false
  return values.every((a) => a.status === 'annotated' || a.status === 'skipped')
}

let _boxCounter  = 0
let _spanCounter = 0


function restoreTaskState(
  taskType: AnnotationSession['taskType'],
  appliedLabels: AppliedLabel[]
): Partial<AnnotationState> {

  switch (taskType) {

    case 'classification':
      return {
        selectedLabelIds: appliedLabels.map((a) => a.labelId).filter(Boolean),
      }

    case 'bounding_box':
      return {
        boundingBoxes: appliedLabels
          .filter((a) => a.bbox)
          .map((a, i) => ({
            id:      `box-restored-${i}`,
            labelId: a.labelId,
            x:       a.bbox!.x,
            y:       a.bbox!.y,
            w:       a.bbox!.w,
            h:       a.bbox!.h,
          })),
      }

    case 'sequence':
      return {
        spans: appliedLabels
          .filter((a) => a.span)
          .map((a, i) => ({
            id:      `span-restored-${i}`,
            labelId: a.labelId,
            start:   a.span!.start,
            end:     a.span!.end,
            text:    a.span!.text,
          })),
      }

    case 'transcription':
      return {
        transcriptionValue: appliedLabels[0]?.transcription ?? '',
      }

    default:
      return {}
  }
}

export const useAnnotationStore = create<AnnotationState & AnnotationActions>()((set, get) => ({

  // ── Initial state ────────────────────────────────────────────────────────────
  session:            null,
  annotations:        {},
  currentIdx:         0,
  isComplete:         false,
  mode:               'manual',  // ← nouveau
  ...TASK_RESET,

  // ── Session lifecycle ────────────────────────────────────────────────────────

    loadSession: (session, existingAnnotations?: Record<string, ElementAnnotation>) => {
    const annotations = existingAnnotations 
      ?? generateInitialAnnotations(session.elements)
    
    // Trouver le premier élément 'pending'
    const firstPendingIdx = session.elements.findIndex(
      el => (annotations[el.id]?.status ?? 'pending') === 'pending'
    )
    
    set({
      session,
      annotations,
      currentIdx:  firstPendingIdx >= 0 ? firstPendingIdx : 0,
      isComplete:  firstPendingIdx === -1,
      mode:        'manual',
      ...TASK_RESET,
    })
  },

  clearSession: () => set({
    session:     null,
    annotations: {},
    currentIdx:  0,
    isComplete:  false,
    mode:        'manual',
    ...TASK_RESET,
  }),

  // ── Mode ─────────────────────────────────────────────────────────────────────

  setMode: (mode) => set({ mode }),

  // ── Navigation ───────────────────────────────────────────────────────────────

    goTo: (idx) => {
    const { session, annotations } = get()
    if (!session) return

    const max     = session.elements.length - 1
    const nextIdx = Math.max(0, Math.min(idx, max))
    const element = session.elements[nextIdx]
    const ann     = element ? annotations[element.id] : undefined

    // Si l'élément a déjà été annoté → restaurer son état
    // Si l'élément est pending ou skipped → reset propre
    if (ann?.status === 'annotated' && ann.appliedLabels.length > 0) {
      const restored = restoreTaskState(session.taskType, ann.appliedLabels)
      set({ currentIdx: nextIdx, ...TASK_RESET, ...restored })
    } else {
      set({ currentIdx: nextIdx, ...TASK_RESET })
    }
  },

  goNext: () => {
    const { currentIdx, session } = get()
    if (!session) return
    if (currentIdx < session.elements.length - 1) get().goTo(currentIdx + 1)
  },

  goPrev: () => {
    const { currentIdx } = get()
    if (currentIdx > 0) get().goTo(currentIdx - 1)
  },

  // ── Classification ───────────────────────────────────────────────────────────

  toggleLabel: (labelId) => {
    const { session, selectedLabelIds } = get()
    if (!session) return

    if (session.allowMultiple) {
      const already = selectedLabelIds.includes(labelId)
      set({
        selectedLabelIds: already
          ? selectedLabelIds.filter((id) => id !== labelId)
          : [...selectedLabelIds, labelId],
      })
    } else {
      set({ selectedLabelIds: [labelId] })
    }
  },

  // ── Bounding Boxes ───────────────────────────────────────────────────────────

  addBox: (box) => {
    _boxCounter++
    set((s) => ({
      boundingBoxes: [...s.boundingBoxes, { ...box, id: `box-${_boxCounter}` }],
    }))
  },

  removeBox: (boxId) =>
    set((s) => ({ boundingBoxes: s.boundingBoxes.filter((b) => b.id !== boxId) })),

  // ── Sequence / NER ───────────────────────────────────────────────────────────

  setPendingSelection: (sel) => set({ pendingSelection: sel }),

  applyLabelToSelection: (labelId) => {
  const { pendingSelection, spans, session, currentIdx } = get()
  if (!pendingSelection) return

  const element = session?.elements[currentIdx]
  if (!element) return

  const content = element.src
  const { text }  = pendingSelection

  // Trouver toutes les occurrences du mot sélectionné dans le texte
  const newSpans: SpanAnnotation[] = []
  let searchFrom = 0

  while (true) {
    const idx = content.indexOf(text, searchFrom)
    if (idx === -1) break

    // Ne pas recréer un span déjà existant au même endroit avec le même label
    const alreadyExists = spans.some(
      (s) => s.start === idx && s.end === idx + text.length && s.labelId === labelId
    )

    if (!alreadyExists) {
      _spanCounter++
      newSpans.push({
        id:      `span-${_spanCounter}`,
        labelId,
        text,
        start:   idx,
        end:     idx + text.length,
      })
    }

    searchFrom = idx + 1
  }

  set({
    spans:            [...spans, ...newSpans],
    pendingSelection: null,
  })
  },

  removeSpan: (spanId) =>
    set((s) => ({ spans: s.spans.filter((sp) => sp.id !== spanId) })),

  // ── Transcription ────────────────────────────────────────────────────────────

  setTranscriptionValue: (value) => set({ transcriptionValue: value }),

  // ── Validate ─────────────────────────────────────────────────────────────────

  validateCurrent: () => {
    const { session, currentIdx, annotations, selectedLabelIds, boundingBoxes, spans, transcriptionValue } = get()
    if (!session) return

    const element = session.elements[currentIdx]
    if (!element) return

    const appliedLabels: AppliedLabel[] = (() => {
      switch (session.taskType) {
        case 'classification':
          return selectedLabelIds.map((labelId) => ({ labelId }))
        case 'bounding_box':
          return boundingBoxes.map((box) => ({
            labelId: box.labelId,
            bbox:    { x: box.x, y: box.y, w: box.w, h: box.h },
          }))
        case 'sequence':
          return spans.map((span) => ({
            labelId: span.labelId,
            span:    { start: span.start, end: span.end, text: span.text },
          }))
        case 'transcription':
          return [{ labelId: '', transcription: transcriptionValue }]
      }
    })()

    const elementAnnotation: ElementAnnotation = {
    elementId:     element.id,
    status:        'annotated',
    appliedLabels,
    updatedAt:     new Date().toISOString(),
    comment: get().annotationComment ||undefined,
    }

    const nextAnnotations: Record<string, ElementAnnotation> = {
      ...annotations,
      [element.id]: elementAnnotation,
    }

    const isComplete = computeIsComplete(nextAnnotations)

    let nextIdx = currentIdx
    if (!isComplete) {
      const total = session.elements.length
      for (let i = currentIdx + 1; i < total; i++) {
        if (nextAnnotations[session.elements[i].id]?.status === 'pending') { nextIdx = i; break }
      }
      if (nextIdx === currentIdx) {
        for (let i = 0; i < currentIdx; i++) {
          if (nextAnnotations[session.elements[i].id]?.status === 'pending') { nextIdx = i; break }
        }
      }
    }

    set({ annotations: nextAnnotations, isComplete, currentIdx: nextIdx, ...TASK_RESET })
  },

    markUncertain: () => {
    const { session, currentIdx, annotations } = get()
    if (!session) return
    const element = session.elements[currentIdx]
    if (!element) return

    const nextAnnotations = {
      ...annotations,
      [element.id]: {
        elementId:     element.id,
        status:        'uncertain' as AnnotationStatus,
        appliedLabels: [],
        updatedAt:     new Date().toISOString(),
        comment: get().annotationComment || undefined,
      },
    }
    const nextIdx = currentIdx < session.elements.length - 1 ? currentIdx + 1 : currentIdx
    set({ annotations: nextAnnotations, currentIdx: nextIdx, ...TASK_RESET })
  },

  setAnnotationComment: (comment) => set({ annotationComment: comment }),

  // ── Skip ─────────────────────────────────────────────────────────────────────

  skipCurrent: () => {
    const { session, currentIdx, annotations } = get()
    if (!session) return

    const element = session.elements[currentIdx]
    if (!element) return

    const nextAnnotations: Record<string, ElementAnnotation> = {
      ...annotations,
      [element.id]: {
        elementId:     element.id,
        status:        'skipped',
        appliedLabels: [],
        updatedAt:     new Date().toISOString(),
        comment: get().annotationComment || undefined,
      },
    }

    const isComplete = computeIsComplete(nextAnnotations)
    const nextIdx    = !isComplete && currentIdx < session.elements.length - 1
      ? currentIdx + 1
      : currentIdx

    set({ annotations: nextAnnotations, isComplete, currentIdx: nextIdx, ...TASK_RESET })
  },
}))

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectCurrentElement(state: AnnotationState) {
  if (!state.session) return null
  return state.session.elements[state.currentIdx] ?? null
}

export function selectCurrentAnnotation(state: AnnotationState) {
  const el = selectCurrentElement(state)
  if (!el) return null
  return state.annotations[el.id] ?? null
}

export function selectSessionProgress(state: AnnotationState) {
  const values    = Object.values(state.annotations)
  const total     = values.length
  const annotated = values.filter((a) => a.status === 'annotated').length
  const skipped   = values.filter((a) => a.status === 'skipped').length
  return { total, annotated, skipped, remaining: total - annotated - skipped }
}

export function selectCurrentOutputJson(state: AnnotationState): string {
  const el  = selectCurrentElement(state)
  const ann = el ? state.annotations[el.id] : null
  const payload = {
    elementId:     el?.id ?? null,
    status:        ann?.status ?? 'pending',
    appliedLabels: ann?.appliedLabels ?? [],
    updatedAt:     ann?.updatedAt ?? null,
  }
  return JSON.stringify(payload, null, 2)
}