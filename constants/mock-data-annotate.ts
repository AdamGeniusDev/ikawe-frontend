// constants/mock-data-annotate.ts
// Données mock spécifiques au module annotation (jobs, batches, sessions).
//


import type {
  AnnotationJob,
  AnnotationBatch,
  AnnotationSession,
  JobGroup,
  DatasetElement,
} from '@/types/annotation'

import {
  groupBatchesByJob,
  batchToSession,
  generateInitialAnnotations,   // ← importé, pas redéfini
  findActiveBatch,
} from '@/types/annotation'

// Re-export pour les composants qui en ont besoin depuis ce fichier
export { generateInitialAnnotations, findActiveBatch }


// ─────────────────────────────────────────────────────────────────────────────
// LABELS RÉUTILISABLES
// ─────────────────────────────────────────────────────────────────────────────

const NER_LABELS = [
  { id: 'per', name: 'Personne',     color: '#ef4444', shortcut: '1' },
  { id: 'org', name: 'Organisation', color: '#f97316', shortcut: '2' },
  { id: 'loc', name: 'Lieu',         color: '#22c55e', shortcut: '3' },
  { id: 'dat', name: 'Date',         color: '#8b5cf6', shortcut: '4' },
  { id: 'mon', name: 'Montant',      color: '#06b6d4', shortcut: '5' },
]

const SENTIMENT_LABELS = [
  { id: 'pos', name: 'Positif', color: '#22c55e', shortcut: '1' },
  { id: 'neg', name: 'Négatif', color: '#ef4444', shortcut: '2' },
  { id: 'neu', name: 'Neutre',  color: '#94a3b8', shortcut: '3' },
]

const DEFECT_LABELS = [
  { id: 'crack', name: 'Fissure',   color: '#ef4444', shortcut: '1' },
  { id: 'dust',  name: 'Poussière', color: '#f97316', shortcut: '2' },
  { id: 'ok',    name: 'Correct',   color: '#22c55e', shortcut: '3' },
]


// ─────────────────────────────────────────────────────────────────────────────
// GÉNÉRATEURS D'ÉLÉMENTS
// ─────────────────────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────────────────────
// MOCK_JOBS
// createdBy → userId aligné sur MOCK_USERS ('usr_001' = Jean Dupont / Rid Dev)
// datasetId → aligné sur MOCK_DATASETS de mock-data.ts
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_JOBS: AnnotationJob[] = [
  // ── Job 001 : NER texte, assignations individuelles par batch ──────────────
  {
    id: 'job-001', datasetId: 'ds_001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    createdBy: 'usr_001', createdAt: '2026-04-01T09:00:00Z',
    labels: NER_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 10, batchSize: 5, batchCount: 2,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['usr_001'] },
      { batchIndex: 2, scope: 'batch', userIds: ['usr_004'] },   // Kofi
    ],
    annotatedCount: 3, skippedCount: 1, status: 'in_progress',
  },

  // ── Job 002 : Classification sentiment, 1 batch, 1 annotateur ──────────────
  {
    id: 'job-002', datasetId: 'ds_004', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    createdBy: 'usr_001', createdAt: '2026-04-05T10:00:00Z',
    labels: SENTIMENT_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 5, batchSize: 5, batchCount: 1,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['usr_005'] },   // Aminata
    ],
    annotatedCount: 5, skippedCount: 0, status: 'completed',
  },

  // ── Job 003 : Bounding box images, équipe + override reviewer ──────────────
  {
    id: 'job-003', datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    createdBy: 'usr_001', createdAt: '2026-04-10T08:00:00Z',
    labels: DEFECT_LABELS, allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 2, batchCount: 3,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 0, scope: 'job',   teamId: 'team_001', userIds: ['usr_004', 'usr_005'] },
      { batchIndex: 2, scope: 'batch', userIds: ['usr_003'],
        roleOverrides: { 'usr_003': 'reviewer' } },                // Théo comme reviewer sur batch 2
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },

  // ── Job 004 : Transcription audio, assignation mixte ───────────────────────
  {
    id: 'job-004', datasetId: 'ds_005', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    createdBy: 'usr_001', createdAt: '2026-04-12T11:00:00Z',
    labels: [], allowSkip: true, allowMultiple: false,
    totalElements: 8, batchSize: 4, batchCount: 2,
    distributionMode: 'random',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', teamId: 'team_002', userIds: [] },
      { batchIndex: 2, scope: 'batch', userIds: ['usr_001', 'usr_003'] },  // Théo
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },

  // ── Job 005 : Captioning images ────────────────────────────────────────────
  {
    id: 'job-005', datasetId: 'ds_006', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    createdBy: 'usr_001', createdAt: '2026-05-01T09:00:00Z',
    labels: [], allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 6, batchCount: 1,
    distributionMode: 'sequential',
    batchAssignments: [
      { batchIndex: 1, scope: 'batch', userIds: ['usr_001', 'usr_005'] },  // Aminata
    ],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// MOCK_BATCHES
// assignedTo → userIds alignés sur MOCK_USERS
// teamId     → aligné sur MOCK_TEAMS de mock-data.ts
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BATCHES: AnnotationBatch[] = [
  // ── Job 001 — 2 batches NER ────────────────────────────────────────────────
  {
    id: 'batch-001-1', jobId: 'job-001',
    datasetId: 'ds_001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    batchIndex: 1, batchTotal: 2,
    labels: NER_LABELS, allowSkip: true,
    elements: makeTextElements('b001-1', 5),
    assignedTo: ['usr_001'],
    status: 'in_progress',
    progress: { total: 5, annotated: 3, skipped: 1, remaining: 1 },
  },
  {
    id: 'batch-001-2', jobId: 'job-001',
    datasetId: 'ds_001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    batchIndex: 2, batchTotal: 2,
    labels: NER_LABELS, allowSkip: true,
    elements: makeTextElements('b001-2', 5),
    assignedTo: ['usr_004'],   // Kofi
    status: 'pending',
    progress: { total: 5, annotated: 0, skipped: 0, remaining: 5 },
  },

  // ── Job 002 — 1 batch sentiment ───────────────────────────────────────────
  {
    id: 'batch-002-1', jobId: 'job-002',
    datasetId: 'ds_004', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    batchIndex: 1, batchTotal: 1,
    labels: SENTIMENT_LABELS, allowSkip: true, allowMultiple: false,
    elements: makeTextElements('b002-1', 5),
    assignedTo: ['usr_005'],   // Aminata
    status: 'completed',
    progress: { total: 5, annotated: 5, skipped: 0, remaining: 0 },
  },

  // ── Job 003 — 3 batches bounding box ─────────────────────────────────────
  {
    id: 'batch-003-1', jobId: 'job-003',
    datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 1, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-1', 2),
    assignedTo: ['usr_004', 'usr_005'],   // Kofi + Aminata
    teamId: 'team_001',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },
  {
    id: 'batch-003-2', jobId: 'job-003',
    datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 2, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-2', 2),
    assignedTo: ['usr_004', 'usr_005', 'usr_003'],   // + Théo (reviewer override)
    teamId: 'team_001',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },
  {
    id: 'batch-003-3', jobId: 'job-003',
    datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 3, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-3', 2),
    assignedTo: ['usr_004', 'usr_005'],
    teamId: 'team_001',
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },

  // ── Job 004 — 2 batches transcription audio ───────────────────────────────
  {
    id: 'batch-004-1', jobId: 'job-004',
    datasetId: 'ds_005', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    batchIndex: 1, batchTotal: 2,
    labels: [], allowSkip: true,
    elements: makeAudioElements('b004-1', 4),
    assignedTo: ['usr_004', 'usr_005'],   // équipe team_002
    teamId: 'team_002',
    status: 'pending',
    progress: { total: 4, annotated: 0, skipped: 0, remaining: 4 },
  },
  {
    id: 'batch-004-2', jobId: 'job-004',
    datasetId: 'ds_005', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    batchIndex: 2, batchTotal: 2,
    labels: [], allowSkip: true,
    elements: makeAudioElements('b004-2', 4),
    assignedTo: ['usr_001', 'usr_003'],   // Rid + Théo
    status: 'pending',
    progress: { total: 4, annotated: 0, skipped: 0, remaining: 4 },
  },

  // ── Job 005 — 1 batch captioning ──────────────────────────────────────────
  {
    id: 'batch-005-1', jobId: 'job-005',
    datasetId: 'ds_006', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    batchIndex: 1, batchTotal: 1,
    labels: [], allowSkip: true,
    elements: makeImageElements('b005-1', 6),
    assignedTo: ['usr_001', 'usr_005'],   // Rid + Aminata
    status: 'pending',
    progress: { total: 6, annotated: 0, skipped: 0, remaining: 6 },
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// MOCK_ANNOTATION_SESSIONS
// Générées automatiquement depuis MOCK_BATCHES via batchToSession()
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANNOTATION_SESSIONS: AnnotationSession[] =
  MOCK_BATCHES.map(batchToSession)


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Batches groupés par job pour un utilisateur donné — vue /annotate */
export function getJobGroupsForUser(userId: string): JobGroup[] {
  return groupBatchesByJob(MOCK_JOBS, MOCK_BATCHES, userId)
}

export function getBatchById(batchId: string): AnnotationBatch | undefined {
  return MOCK_BATCHES.find(b => b.id === batchId)
}

export function getSessionById(sessionId: string): AnnotationSession | undefined {
  return MOCK_ANNOTATION_SESSIONS.find(s => s.id === sessionId)
}

export function getBatchesForJob(jobId: string): AnnotationBatch[] {
  return MOCK_BATCHES.filter(b => b.jobId === jobId)
}

export function getJobById(jobId: string): AnnotationJob | undefined {
  return MOCK_JOBS.find(j => j.id === jobId)
}


export function canAccessBatch(batch: AnnotationBatch, userId: string): boolean {
  return batch.assignedTo.includes(userId)
}


export function getActiveBatchForUser(userId: string): AnnotationBatch | null {
  const myBatches = MOCK_BATCHES.filter(b => b.assignedTo.includes(userId))
  return findActiveBatch(myBatches)
}