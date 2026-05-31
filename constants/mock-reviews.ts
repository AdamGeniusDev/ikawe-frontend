// constants/mock-reviews.ts
// Fixtures de sessions de revue — déplacées hors de types/review.ts.
// Les types (ReviewSession, ReviewItem...) + computeReviewProgress restent dans types/review.ts.

import type { ReviewSession } from '@/types/review'
import type { SessionLabel, AppliedLabel } from '@/types/annotation'

//helpers pour calculer les spans a partir du texte source

function mkSpan(
  text:    string,
  src:     string,
  labelId: string,
): AppliedLabel {
  const start = src.indexOf(text)
  if (start === -1) throw new Error(`mkSpan: "${text}" introuvable dans la source`)
  return { labelId, span: { start, end: start + text.length, text } }
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const NER_LABELS: SessionLabel[] = [
  { id: 'per', name: 'Personne',     color: '#ef4444', shortcut: '1' },
  { id: 'org', name: 'Organisation', color: '#f97316', shortcut: '2' },
  { id: 'loc', name: 'Lieu',         color: '#22c55e', shortcut: '3' },
  { id: 'dat', name: 'Date',         color: '#8b5cf6', shortcut: '4' },
]

const DEFECT_LABELS: SessionLabel[] = [
  { id: 'crack', name: 'Fissure',   color: '#ef4444', shortcut: '1' },
  { id: 'dust',  name: 'Poussière', color: '#f97316', shortcut: '2' },
  { id: 'ok',    name: 'Correct',   color: '#22c55e', shortcut: '3' },
]

const SENTIMENT_LABELS: SessionLabel[] = [
  { id: 'pos', name: 'Positif', color: '#22c55e', shortcut: '1' },
  { id: 'neg', name: 'Négatif', color: '#ef4444', shortcut: '2' },
  { id: 'neu', name: 'Neutre',  color: '#94a3b8', shortcut: '3' },
]

// ─── Mock : NER / séquence — texte avec spans ─────────────────────────────────

// Textes sources — définis une seule fois pour que mkSpan puisse les parcourir
const NER_SRC_1 = 'Le président Patrice Talon a inauguré le nouveau marché de Dantokpa à Cotonou le 15 mars 2026, en présence du maire Luc Sètondji Atrokpo.'
const NER_SRC_2 = 'La Banque Africaine de Développement (BAD) a accordé un prêt de 50 milliards de FCFA au gouvernement du Bénin pour financer des infrastructures routières.'
const NER_SRC_3 = 'MTN Bénin a lancé une nouvelle offre de téléphonie mobile à Parakou, ciblant les jeunes entrepreneurs de la région de Borgou.'
const NER_SRC_4 = "L'Université d'Abomey-Calavi a accueilli en janvier 2026 plus de 12 000 nouveaux étudiants."
const NER_SRC_5 = 'Le Festival International du Vodoun de Ouidah attire chaque année des milliers de visiteurs venus du monde entier.'

export const MOCK_REVIEW_NER: ReviewSession = {
  batchId:     'batch-001-1',
  jobId:       'job-001',
  datasetName: 'Actualités Bénin — NER',
  dataType:    'text',
  taskType:    'sequence',
  labels:      NER_LABELS,
  reviewerId:  'user-marie',
  totalItems:  5,
  instructions: [
    'Vérifiez que chaque entité nommée est correctement typée.',
    '',
    '• Les prénoms seuls sans contexte → Personne',
    '• Les organisations gouvernementales → Organisation',
    '• En cas de doute, rejeter avec commentaire explicite',
  ].join('\n'),
  items: [
    {
      elementId: 'b001-1-el-1',
      element: { id: 'b001-1-el-1', filename: 'document_01.txt', src: NER_SRC_1 },
      appliedLabels: [
        mkSpan('Patrice Talon',        NER_SRC_1, 'per'),
        mkSpan('Dantokpa',             NER_SRC_1, 'loc'),
        mkSpan('Cotonou',              NER_SRC_1, 'loc'),
        mkSpan('15 mars 2026',         NER_SRC_1, 'dat'),
        mkSpan('Luc Sètondji Atrokpo', NER_SRC_1, 'per'),
      ],
      annotatedBy: 'user-kofi',
      annotatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b001-1-el-2',
      element: { id: 'b001-1-el-2', filename: 'document_02.txt', src: NER_SRC_2 },
      appliedLabels: [
        mkSpan('Banque Africaine de Développement', NER_SRC_2, 'org'),
        mkSpan('BAD',                               NER_SRC_2, 'org'),
        mkSpan('Bénin',                             NER_SRC_2, 'loc'),
      ],
      annotatedBy: 'user-kofi',
      annotatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b001-1-el-3',
      element: { id: 'b001-1-el-3', filename: 'document_03.txt', src: NER_SRC_3 },
      appliedLabels: [
        mkSpan('MTN Bénin', NER_SRC_3, 'org'),
        mkSpan('Parakou',   NER_SRC_3, 'loc'),
        mkSpan('Borgou',    NER_SRC_3, 'loc'),
      ],
      annotatedBy: 'user-kofi',
      annotatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b001-1-el-4',
      element: { id: 'b001-1-el-4', filename: 'document_04.txt', src: NER_SRC_4 },
      appliedLabels: [
        mkSpan("Université d'Abomey-Calavi", NER_SRC_4, 'org'),
        mkSpan('janvier 2026',               NER_SRC_4, 'dat'),
      ],
      annotatedBy: 'user-kofi',
      annotatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b001-1-el-5',
      element: { id: 'b001-1-el-5', filename: 'document_05.txt', src: NER_SRC_5 },
      appliedLabels: [
        mkSpan('Festival International du Vodoun', NER_SRC_5, 'org'),
        mkSpan('Ouidah',                           NER_SRC_5, 'loc'),
      ],
      annotatedBy: 'user-kofi',
      annotatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      reviewStatus: 'pending',
      comment: "Incertain sur le type de Festival — peut-être Événement plutôt qu'Organisation ?",
    },
  ],
}

// ─── Mock : Bounding box — images ─────────────────────────────────────────────

export const MOCK_REVIEW_BBOX: ReviewSession = {
  batchId:     'batch-003-1',
  jobId:       'job-003',
  datasetName: 'SafeDeal — Détection défauts',
  dataType:    'image',
  taskType:    'bounding_box',
  labels:      DEFECT_LABELS,
  reviewerId:  'user-marie',
  totalItems:  2,
  instructions: [
    'Vérifiez que les bounding boxes sont bien ajustées sur les défauts.',
    '',
    '• Box trop grande (>20% de marge) → Rejeter',
    '• Défaut manquant visible → Rejeter',
    '• Double annotation du même défaut → Rejeter',
  ].join('\n'),
  items: [
    {
      elementId: 'b003-1-img-1',
      element: {
        id: 'b003-1-img-1',
        filename: 'photo_01.jpg',
        src: 'https://picsum.photos/seed/phone1/640/480',
      },
      appliedLabels: [
        { labelId: 'crack', bbox: { x: 0.18, y: 0.12, w: 0.22, h: 0.18 } },
        { labelId: 'dust',  bbox: { x: 0.60, y: 0.55, w: 0.15, h: 0.12 } },
      ],
      annotatedBy:  'user-kofi',
      annotatedAt:  new Date(Date.now() - 5 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b003-1-img-2',
      element: {
        id: 'b003-1-img-2',
        filename: 'photo_02.jpg',
        src: 'https://picsum.photos/seed/phone2/640/480',
      },
      appliedLabels: [
        { labelId: 'ok', bbox: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } },
      ],
      annotatedBy:  'user-kofi',
      annotatedAt:  new Date(Date.now() - 4 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
  ],
}

// ─── Mock : Classification sentiment — texte ──────────────────────────────────

export const MOCK_REVIEW_CLASSIFICATION: ReviewSession = {
  batchId:     'batch-002-1',
  jobId:       'job-002',
  datasetName: 'Avis clients Sénégal',
  dataType:    'text',
  taskType:    'classification',
  labels:      SENTIMENT_LABELS,
  reviewerId:  'user-marie',
  totalItems:  3,
  items: [
    {
      elementId: 'b002-el-1',
      element: {
        id: 'b002-el-1',
        filename: 'avis_001.txt',
        src: 'Excellent service, livraison rapide et produit conforme à la description. Je recommande vivement ce vendeur !',
      },
      appliedLabels: [{ labelId: 'pos' }],
      annotatedBy:  'user-aminata',
      annotatedAt:  new Date(Date.now() - 6 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b002-el-2',
      element: {
        id: 'b002-el-2',
        filename: 'avis_002.txt',
        src: "Commande reçue avec 3 semaines de retard. Le téléphone fonctionne mais l'emballage était abîmé. Pas satisfait.",
      },
      appliedLabels: [{ labelId: 'neg' }],
      annotatedBy:  'user-aminata',
      annotatedAt:  new Date(Date.now() - 5 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b002-el-3',
      element: {
        id: 'b002-el-3',
        filename: 'avis_003.txt',
        src: 'Prix correct, rien de spécial à signaler. Produit reçu dans les délais.',
      },
      appliedLabels: [{ labelId: 'neu' }],
      annotatedBy:  'user-aminata',
      annotatedAt:  new Date(Date.now() - 4 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
  ],
}

// ─── Mock : Transcription audio ───────────────────────────────────────────────

export const MOCK_REVIEW_TRANSCRIPTION: ReviewSession = {
  batchId:     'batch-004-1',
  jobId:       'job-004',
  datasetName: 'Audio Fon / Yoruba',
  dataType:    'audio',
  taskType:    'transcription',
  labels:      [],
  reviewerId:  'user-marie',
  totalItems:  2,
  instructions: [
    'Vérifiez la précision de la transcription.',
    '',
    '• Mots manquants ou incorrects → Rejeter',
    '• [inaudible] accepté si la qualité audio le justifie',
    '• Ponctuation non évaluée',
  ].join('\n'),
  items: [
    {
      elementId: 'b004-1-aud-1',
      element: {
        id: 'b004-1-aud-1',
        filename: 'audio_01.mp3',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      appliedLabels: [{
        labelId: 'transcription',
        transcription: 'Emi ni ọmọ Yoruba, mo fẹ́ kọ ẹ̀kọ́ nípa ède wa.',
      }],
      annotatedBy:  'user-kofi',
      annotatedAt:  new Date(Date.now() - 7 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b004-1-aud-2',
      element: {
        id: 'b004-1-aud-2',
        filename: 'audio_02.mp3',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      appliedLabels: [{
        labelId: 'transcription',
        transcription: 'Vodun gbɔ nyi ce... [inaudible] ...Cotonou mɛ.',
      }],
      annotatedBy:  'user-kofi',
      annotatedAt:  new Date(Date.now() - 6 * 3600000).toISOString(),
      reviewStatus: 'pending',
      comment: "Passage difficile à entendre vers 0:42 — j'ai mis [inaudible]",
    },
  ],
}

// ─── Mock : Captioning — images avec légendes ─────────────────────────────────

export const MOCK_REVIEW_CAPTIONING: ReviewSession = {
  batchId:     'batch-005-1',
  jobId:       'job-005',
  datasetName: 'SafeDeal — Descriptions produits',
  dataType:    'image',
  taskType:    'captioning',
  labels:      [],
  reviewerId:  'user-marie',
  totalItems:  2,
  instructions: [
    "Vérifiez que la légende décrit fidèlement le contenu de l'image.",
    '',
    '• Légende trop vague ou incorrecte → Rejeter',
    '• Fautes orthographiques majeures → Rejeter',
    '• Longueur minimale : 10 mots',
  ].join('\n'),
  items: [
    {
      elementId: 'b005-1-img-1',
      element: {
        id: 'b005-1-img-1',
        filename: 'product_01.jpg',
        src: 'https://picsum.photos/seed/product1/640/480',
      },
      appliedLabels: [{
        // labelId 'captioning' est une valeur de convention pour TaskType='captioning'.
        // Le champ transcription porte la légende (voir AppliedLabel dans annotation.ts).
        labelId: 'captioning',
        transcription: "Smartphone noir avec écran fissuré sur la partie inférieure droite, vendu en l'état.",
      }],
      annotatedBy:  'user-aminata',
      annotatedAt:  new Date(Date.now() - 2 * 3600000).toISOString(),
      reviewStatus: 'pending',
    },
    {
      elementId: 'b005-1-img-2',
      element: {
        id: 'b005-1-img-2',
        filename: 'product_02.jpg',
        src: 'https://picsum.photos/seed/product2/640/480',
      },
      appliedLabels: [{
        labelId: 'captioning',
        transcription: 'Téléphone portable blanc en bon état général, batterie et accessoires inclus.',
      }],
      annotatedBy:  'user-aminata',
      annotatedAt:  new Date(Date.now() - 1 * 3600000).toISOString(),
      reviewStatus: 'pending',
      comment: "Pas sûr de la couleur exacte, j'ai mis blanc mais ça pourrait être gris clair.",
    },
  ],
}

// ─── Index pour accès par batchId ─────────────────────────────────────────────

export const MOCK_REVIEW_SESSIONS: Record<string, ReviewSession> = {
  'batch-001-1': MOCK_REVIEW_NER,
  'batch-002-1': MOCK_REVIEW_CLASSIFICATION,
  'batch-003-1': MOCK_REVIEW_BBOX,
  'batch-004-1': MOCK_REVIEW_TRANSCRIPTION,
  'batch-005-1': MOCK_REVIEW_CAPTIONING,
}