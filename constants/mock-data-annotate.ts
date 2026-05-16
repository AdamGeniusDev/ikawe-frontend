// constants/mock-data-annotate.ts

import type {
  AnnotationJob,
  AnnotationBatch,
  AnnotationSession,
  JobGroup,
  DatasetElement,
  ElementAnnotation,
} from '@/types/annotation'
import { groupBatchesByJob, batchToSession } from '@/types/annotation'

// ─── Utilisateurs mock ────────────────────────────────────────────────────────

export interface MockAnnotationUser {
  userId: string
  name:   string
  role:   'owner' | 'annotator' | 'reviewer'
}

export const MOCK_USERS: MockAnnotationUser[] = [
  { userId: 'user-owner',   name: 'Jean Dupont',   role: 'owner'     },
  { userId: 'user-kofi',    name: 'Kofi Boateng',  role: 'annotator' },
  { userId: 'user-aminata', name: 'Aminata Diallo', role: 'annotator' },
  { userId: 'user-theo',    name: 'Théo Comlan',   role: 'reviewer'  },
]

// ─── generateInitialAnnotations ───────────────────────────────────────────────

export function generateInitialAnnotations(
  elements: DatasetElement[]
): Record<string, ElementAnnotation> {
  return Object.fromEntries(
    elements.map(el => [
      el.id,
      { elementId: el.id, status: 'pending' as const, appliedLabels: [] },
    ])
  )
}

// ─── Labels réutilisables ─────────────────────────────────────────────────────

const NER_LABELS = [
  { id: 'per', name: 'Personne',     color: '#ef4444' },
  { id: 'org', name: 'Organisation', color: '#f97316' },
  { id: 'loc', name: 'Lieu',         color: '#22c55e' },
  { id: 'dat', name: 'Date',         color: '#8b5cf6' },
  { id: 'mon', name: 'Montant',      color: '#06b6d4' },
]

const SENTIMENT_LABELS = [
  { id: 'pos', name: 'Positif', color: '#22c55e' },
  { id: 'neg', name: 'Négatif', color: '#ef4444' },
  { id: 'neu', name: 'Neutre',  color: '#94a3b8' },
]

const DEFECT_LABELS = [
  { id: 'crack', name: 'Fissure',   color: '#ef4444' },
  { id: 'dust',  name: 'Poussière', color: '#f97316' },
  { id: 'ok',    name: 'Correct',   color: '#22c55e' },
]

// ─── Générateurs d'éléments ───────────────────────────────────────────────────

function makeTextElements(prefix: string, count: number): DatasetElement[] {
  return Array.from({ length: count }, (_, i) => ({
    id:       `${prefix}-el-${i + 1}`,
    src:      `Le marché de Dantokpa est le plus grand marché en plein air d'Afrique de l'Ouest. Chaque jour, des milliers de commerçants et d'acheteurs s'y retrouvent. Document numéro ${i + 1}.`,
    filename: `document_${String(i + 1).padStart(2, '0')}.txt`,
  }))
}

function makeImageElements(prefix: string, count: number): DatasetElement[] {
  return Array.from({ length: count }, (_, i) => ({
    id:       `${prefix}-img-${i + 1}`,
    src:      `https://placehold.co/400x300/e2e8f0/94a3b8?text=Image+${i + 1}`,
    filename: `photo_${String(i + 1).padStart(2, '0')}.jpg`,
  }))
}

// ── Éléments audio avec de vraies URLs MP3 publiques ─────────────────────────
function makeAudioElements(prefix: string, count: number): DatasetElement[] {
  const AUDIO_URLS = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id:       `${prefix}-aud-${i + 1}`,
    src:      AUDIO_URLS[i % AUDIO_URLS.length],
    filename: `audio_${String(i + 1).padStart(2, '0')}.mp3`,
  }))
}

// ─── MOCK_JOBS ────────────────────────────────────────────────────────────────

export const MOCK_JOBS: AnnotationJob[] = [
  // ── Job 001 : assignations individuelles par batch ──
  {
    id: 'job-001', datasetId: 'ds-001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    createdBy: 'user-owner', createdAt: '2026-04-01T09:00:00Z',
    labels: NER_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 10, batchSize: 5, batchCount: 2,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['user-owner'] },
      { batchIndex: 2, scope: 'batch', userIds: ['user-kofi']  },
    ],
    annotatedCount: 3, skippedCount: 1, status: 'in_progress',
  },

  // ── Job 002 : 1 seul batch, assigné à 1 annotateur ──
  {
    id: 'job-002', datasetId: 'ds-002', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    createdBy: 'user-owner', createdAt: '2026-04-05T10:00:00Z',
    labels: SENTIMENT_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 5, batchSize: 5, batchCount: 1,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['user-aminata'] },
    ],
    annotatedCount: 5, skippedCount: 0, status: 'completed',
  },

  // ── Job 003 : assignation via équipe + override reviewer ──
  {
    id: 'job-003', datasetId: 'ds-003', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    createdBy: 'user-owner', createdAt: '2026-04-10T08:00:00Z',
    labels: DEFECT_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 2, batchCount: 3,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 0, scope: 'job', teamId: 'team-1', userIds: ['user-kofi', 'user-aminata'] },
      { batchIndex: 2, scope: 'batch', userIds: ['user-theo'], roleOverrides: { 'user-theo': 'reviewer' } },
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },

  // ── Job 004 : assignation mixte (équipe batch 1, individus batch 2) ──
  {
    id: 'job-004', datasetId: 'ds-004', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    createdBy: 'user-owner', createdAt: '2026-04-12T11:00:00Z',
    labels: [], allowSkip: true, allowMultiple: false,
    totalElements: 8, batchSize: 4, batchCount: 2,
    distributionMode: 'random',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', teamId: 'team-2', userIds: [] },
      { batchIndex: 2, scope: 'batch', userIds: ['user-owner', 'user-theo'] },
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },

  // ── Job 005 : captioning images ──
  {
    id: 'job-005', datasetId: 'ds-005', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    createdBy: 'user-owner', createdAt: '2026-05-01T09:00:00Z',
    labels: [], allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 6, batchCount: 1,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['user-owner', 'user-aminata'] },
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },
]

// ─── MOCK_BATCHES ─────────────────────────────────────────────────────────────

export const MOCK_BATCHES: AnnotationBatch[] = [
  // Job 001 — 2 batches
  {
    id: 'batch-001-1', jobId: 'job-001',
    datasetId: 'ds-001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    batchIndex: 1, batchTotal: 2,
    labels: NER_LABELS, allowSkip: true,
    elements: makeTextElements('b001-1', 5),
    assignedTo: ['user-owner'], status: 'in_progress',
    progress: { total: 5, annotated: 3, skipped: 1, remaining: 1 },
  },
  {
    id: 'batch-001-2', jobId: 'job-001',
    datasetId: 'ds-001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    batchIndex: 2, batchTotal: 2,
    labels: NER_LABELS, allowSkip: true,
    elements: makeTextElements('b001-2', 5),
    assignedTo: ['user-kofi'], status: 'pending',
    progress: { total: 5, annotated: 0, skipped: 0, remaining: 5 },
  },

  // Job 002 — 1 batch
  {
    id: 'batch-002-1', jobId: 'job-002',
    datasetId: 'ds-002', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    batchIndex: 1, batchTotal: 1,
    labels: SENTIMENT_LABELS, allowSkip: true, allowMultiple: false,
    elements: makeTextElements('b002-1', 5),
    assignedTo: ['user-aminata'], status: 'completed',
    progress: { total: 5, annotated: 5, skipped: 0, remaining: 0 },
  },

  // Job 003 — 3 batches
  {
    id: 'batch-003-1', jobId: 'job-003',
    datasetId: 'ds-003', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 1, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-1', 2),
    assignedTo: ['user-kofi', 'user-aminata'],
    teamId: 'team-1',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },
  {
    id: 'batch-003-2', jobId: 'job-003',
    datasetId: 'ds-003', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 2, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-2', 2),
    assignedTo: ['user-kofi', 'user-aminata', 'user-theo'],
    teamId: 'team-1',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },
  {
    id: 'batch-003-3', jobId: 'job-003',
    datasetId: 'ds-003', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 3, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-3', 2),
    assignedTo: ['user-kofi', 'user-aminata'],
    teamId: 'team-1',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },

  // Job 004 — 2 batches audio (vraies URLs MP3)
  {
    id: 'batch-004-1', jobId: 'job-004',
    datasetId: 'ds-004', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    batchIndex: 1, batchTotal: 2,
    labels: [], allowSkip: true,
    elements: makeAudioElements('b004-1', 4),
    assignedTo: ['user-kofi', 'user-aminata'],
    teamId: 'team-2',
    status: 'pending',
    progress: { total: 4, annotated: 0, skipped: 0, remaining: 4 },
  },
  {
    id: 'batch-004-2', jobId: 'job-004',
    datasetId: 'ds-004', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    batchIndex: 2, batchTotal: 2,
    labels: [], allowSkip: true,
    elements: makeAudioElements('b004-2', 4),
    assignedTo: ['user-owner', 'user-theo'],
    status: 'pending',
    progress: { total: 4, annotated: 0, skipped: 0, remaining: 4 },
  },

  // Job 005 — 1 batch captioning
  {
    id: 'batch-005-1', jobId: 'job-005',
    datasetId: 'ds-005', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    batchIndex: 1, batchTotal: 1,
    labels: [], allowSkip: true,
    elements: makeImageElements('b005-1', 6),
    assignedTo: ['user-owner', 'user-aminata'],
    status: 'pending',
    progress: { total: 6, annotated: 0, skipped: 0, remaining: 6 },
  },
]

// ─── MOCK_ANNOTATION_SESSIONS ─────────────────────────────────────────────────

export const MOCK_ANNOTATION_SESSIONS: AnnotationSession[] =
  MOCK_BATCHES.map(batchToSession)

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getJobGroupsForUser(userId: string): JobGroup[] {
  return groupBatchesByJob(MOCK_JOBS, MOCK_BATCHES, userId)
}

export function getBatchById(batchId: string): AnnotationBatch | undefined {
  return MOCK_BATCHES.find(b => b.id === batchId)
}

export function getSessionById(id: string): AnnotationSession | undefined {
  return MOCK_ANNOTATION_SESSIONS.find(s => s.id === id)
}

export function getBatchesForJob(jobId: string): AnnotationBatch[] {
  return MOCK_BATCHES.filter(b => b.jobId === jobId)
}

export function canAccessBatch(batch: AnnotationBatch, userId: string): boolean {
  const job = MOCK_JOBS.find(j => j.id === batch.jobId)
  if (!job) return false
  return batch.assignedTo.includes(userId)
}