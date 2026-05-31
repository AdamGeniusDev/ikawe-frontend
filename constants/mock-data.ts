// constants/mock-data.ts
// source unique de toutes les données mock d'Ikawe.
//
// ⚠️  IDs alignés sur types/user.ts :
//     'user-owner' = Jean Dupont (CURRENT_USER)
//     'user-kofi'  = Kofi Boateng
//     'user-aminata' = Aminata Diallo
//     'user-marie' = Marie Kone
//     'user-theo'  = Théo Comlan

import type { Dataset, DatasetMember, TeamAssignment } from '@/types/datasets'
import type { Team, TeamMember, PendingInvite, DatasetRef } from '@/types/team'
import type { AppNotification }                         from '@/types/notification'
import type {
  AnnotationJob,
  AnnotationBatch,
  AnnotationSession,
  DatasetElement,
  JobGroup,
  JobPool,
} from '@/types/annotation'

import {
  batchToSession,
  groupBatchesByJob,
  findActiveBatch,
  generateInitialAnnotations,
} from '@/types/annotation'

// Re-exports — constants/mock-data.ts est la surface d'import UNIQUE des mocks.
export { generateInitialAnnotations, findActiveBatch }
export { MOCK_USERS, CURRENT_MOCK_USER as CURRENT_USER, getUserById } from '@/types/user'
export { MOCK_TASKS }            from './mock-tasks'
export * from './mock-reviews'   // MOCK_REVIEW_* + MOCK_REVIEW_SESSIONS


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE DATE
// ─────────────────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d
}
function hoursAgo(n: number): Date {
  const d = new Date(); d.setHours(d.getHours() - n); return d
}
function daysFromNow(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() + n); return d
}
function iso(date: Date): string {
  return date.toISOString()
}


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
// TEAMS
// IDs membres alignés sur MOCK_USERS dans types/user.ts
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_001',
    name: 'Équipe Cotonou',
    description: 'Équipe principale basée à Cotonou',
    ownerId: 'user-owner',
    createdAt: '2024-01-16',
    datasetIds: ['ds_001', 'ds_004', 'ds_006'],
    members: [
      { userId: 'user-owner', role: 'team_owner', joinedAt: '2024-01-16', annotations: 4820, lastActive: 'Il y a 5 min' },
      { userId: 'user-theo',  role: 'annotator',  joinedAt: '2024-02-20', annotations: 3200, lastActive: 'Hier'         },
      { userId: 'user-marie', role: 'reviewer',   joinedAt: '2024-01-28', annotations: 1120, lastActive: 'Il y a 2h'    },
      { userId: 'user-kofi',  role: 'annotator',  joinedAt: '2024-04-05', annotations: 120,  lastActive: 'Il y a 3j'    },
    ] satisfies TeamMember[],
  },
  {
    id: 'team_002',
    name: 'Équipe West Africa NLP',
    description: "Spécialisée NLP multilingue Afrique de l'Ouest",
    ownerId: 'user-owner',
    createdAt: '2023-12-01',
    datasetIds: ['ds_002', 'ds_005', 'ds_007'],
    members: [
      { userId: 'user-owner',   role: 'team_owner', joinedAt: '2023-12-01', annotations: 5480, lastActive: "Il y a 1h"     },
      { userId: 'user-kofi',    role: 'annotator',  joinedAt: '2024-03-10', annotations: 2840, lastActive: 'Il y a 30 min' },
      { userId: 'user-aminata', role: 'annotator',  joinedAt: '2024-04-01', annotations: 640,  lastActive: 'Il y a 1j'     },
      { userId: 'user-marie',   role: 'reviewer',   joinedAt: '2024-03-25', annotations: 980,  lastActive: 'Il y a 4h'     },
    ] satisfies TeamMember[],
  },
]

export const MOCK_PENDING_INVITES: PendingInvite[] = [
  { id: 'p1', email: 'grace.kone@mail.com', sentAt: 'Il y a 2j' },
  { id: 'p2', email: 'serge.akpo@mail.com', sentAt: 'Il y a 5j' },
]


// ─────────────────────────────────────────────────────────────────────────────
// DATASET MEMBERS réutilisables
// userId alignés sur MOCK_USERS
// ─────────────────────────────────────────────────────────────────────────────

const MEMBER_KOFI: DatasetMember = {
  userId: 'user-kofi', name: 'Kofi Boateng',
  role: 'annotator', grantedAt: iso(daysAgo(10)), grantedBy: 'user-owner',
}
const MEMBER_AMINATA: DatasetMember = {
  userId: 'user-aminata', name: 'Aminata Diallo',
  role: 'reviewer', grantedAt: iso(daysAgo(8)), grantedBy: 'user-owner',
}
const MEMBER_THEO: DatasetMember = {
  userId: 'user-theo', name: 'Théo Comlan',
  role: 'annotator', grantedAt: iso(daysAgo(5)), grantedBy: 'user-owner',
}
const MEMBER_MARIE: DatasetMember = {
  userId: 'user-marie', name: 'Marie Kone',
  role: 'annotator', grantedAt: iso(daysAgo(12)), grantedBy: 'user-owner',
}

// ─── TeamAssignments ─────────────────────────────────────────────────────────

const TEAM_001_ASSIGNMENT: TeamAssignment = {
  teamId: 'team_001', teamName: 'Équipe Cotonou',
  assignedAt: iso(daysAgo(30)), assignedBy: 'user-owner',
}
const TEAM_002_ASSIGNMENT: TeamAssignment = {
  teamId: 'team_002', teamName: 'Équipe West Africa NLP',
  assignedAt: iso(daysAgo(25)), assignedBy: 'user-owner',
}


// ─────────────────────────────────────────────────────────────────────────────
// DATASETS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 'ds_001', title: 'phones_images_batch2',
    description: "Photos de smartphones usagés collectées au marché Dantokpa. Objectif : détecter les défauts physiques (rayures, écrans cassés, ports endommagés) pour alimenter le score de vérification SafeDeal.",
    tags: ['smartphones', 'défauts', 'bounding-box', 'bénin'],
    language: 'fr', version: '2.0.0', ownerId: 'user-owner',
    visibility: 'team', price: 0, dataType: 'image',
    totalFiles: 2300, sizeMb: 1433.6,
    annotatedFiles: 966, annotationProgress: 42, taskCount: 2,
    status: 'active',
    createdAt: daysAgo(35), updatedAt: hoursAgo(2),
    members: [MEMBER_KOFI, MEMBER_AMINATA],
    teamAssignments: [TEAM_001_ASSIGNMENT],
    // Collaborateurs visibles dans jobAssignmentConfigurator :
    //   - MEMBER_KOFI (user-kofi) + MEMBER_AMINATA (user-aminata) → membres individuels
    //   - team_001 → user-theo + user-marie + user-kofi (via équipe)
    //   Total résolu par resolveDatasetAccess : user-kofi, user-aminata, user-theo, user-marie
  },
  {
    id: 'ds_002', title: 'smartphone_listings_v3',
    description: "Export des annonces smartphones de SafeDeal Côte d'Ivoire et Bénin. Chaque ligne = une annonce avec prix, état déclaré, modèle, ville.",
    tags: ['marketplace', 'prix', 'classification', 'côte-d-ivoire', 'bénin'],
    language: 'fr', version: '3.1.0', ownerId: 'user-owner',
    visibility: 'team', price: 0, dataType: 'csv',
    totalFiles: 12450, sizeMb: 24.8,
    annotatedFiles: 8466, annotationProgress: 68, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(60), updatedAt: daysAgo(2),
    members: [MEMBER_THEO, MEMBER_AMINATA],
    teamAssignments: [TEAM_002_ASSIGNMENT],
  },
  {
    id: 'ds_003', title: 'produits_telecom_dakar',
    description: "Catalogue complet de produits télécoms collectés dans les boutiques de Sandaga et HLM Grand Yoff, Dakar. Dataset 100% annoté, publié sur la marketplace.",
    tags: ['télécom', 'catalogue', 'dakar', 'sénégal', 'NER'],
    language: 'fr', version: '1.2.0', ownerId: 'user-owner',
    visibility: 'public', price: 0, dataType: 'json',
    totalFiles: 8900, sizeMb: 18.3,
    annotatedFiles: 8900, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: daysAgo(90), updatedAt: daysAgo(15), completedAt: daysAgo(15),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_004', title: 'reviews_abidjan_corpus',
    description: "Avis consommateurs collectés sur les réseaux sociaux à Abidjan concernant les achats de smartphones. Analyse de sentiment pour la feature de réputation vendeur.",
    tags: ['sentiment', 'avis', 'abidjan', 'réseaux-sociaux'],
    language: 'fr', version: '1.0.0', ownerId: 'user-owner',
    visibility: 'private', price: 0, dataType: 'text',
    totalFiles: 5100, sizeMb: 8.7,
    annotatedFiles: 255, annotationProgress: 5, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(7), updatedAt: hoursAgo(12),
    members: [],
    teamAssignments: [TEAM_001_ASSIGNMENT],
  },
  {
    id: 'ds_005', title: 'audio_beninois_v1',
    description: "Enregistrements vocaux collectés dans les marchés de Porto-Novo et Cotonou. Locuteurs natifs Fon et Yoruba.",
    tags: ['audio', 'fon', 'yoruba', 'ASR', 'bénin'],
    language: 'fon', version: '1.0.0', ownerId: 'user-owner',
    visibility: 'team', price: 0, dataType: 'audio',
    totalFiles: 80, sizeMb: 640.0,
    annotatedFiles: 30, annotationProgress: 37, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(14), updatedAt: daysAgo(1),
    members: [MEMBER_THEO, MEMBER_MARIE],
    teamAssignments: [TEAM_002_ASSIGNMENT],
  },
  {
    id: 'ds_006', title: 'phones_images_batch3',
    description: "Nouveau batch collecté lors de l'opération terrain du 2 avril 2025. En cours de nettoyage avant annotation.",
    tags: ['smartphones', 'bénin', 'batch3'],
    language: 'fr', version: '1.0.0', ownerId: 'user-owner',
    visibility: 'private', price: 0, dataType: 'image',
    totalFiles: 1850, sizeMb: 840.0,
    annotatedFiles: 0, annotationProgress: 0, taskCount: 0,
    status: 'draft',
    createdAt: daysAgo(3), updatedAt: daysAgo(3),
    members: [],
    teamAssignments: [TEAM_001_ASSIGNMENT],
  },
  {
    id: 'ds_007', title: 'mobile_prices_west_africa_2024',
    description: "Prix de smartphones collectés dans 6 pays d'Afrique de l'Ouest entre janvier et décembre 2024.",
    tags: ['prix', 'mobile', 'afrique-ouest', 'benchmark'],
    language: 'fr', version: '4.0.0', ownerId: 'user-kofi',
    visibility: 'public', price: 0, dataType: 'csv',
    totalFiles: 34000, sizeMb: 67.2,
    annotatedFiles: 34000, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: new Date('2024-01-10'), updatedAt: new Date('2025-01-05'),
    completedAt: new Date('2025-01-05'),
    members: [],
    teamAssignments: [TEAM_002_ASSIGNMENT],
  },
  {
    id: 'ds_008', title: 'phone_defects_detection_dataset',
    description: "5 000 images annotées de smartphones avec bounding boxes sur les défauts physiques. Collecté en partenariat avec des réparateurs à Dakar.",
    tags: ['défauts', 'bounding-box', 'YOLO', 'dakar', 'payant'],
    language: 'fr', version: '2.1.0', ownerId: 'user-aminata',
    visibility: 'public', price: 2500, dataType: 'image',
    totalFiles: 5000, sizeMb: 1228.8,
    annotatedFiles: 5000, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: new Date('2024-06-15'), updatedAt: new Date('2025-02-20'),
    completedAt: new Date('2025-02-20'),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_009', title: 'avis_consommateurs_cameroun',
    description: "12 000 avis clients collectés sur des groupes Facebook camerounais. Annotations de sentiment. Testé avec CamemBERT-base, F1-score 0.87.",
    tags: ['sentiment', 'cameroun', 'NLP', 'facebook'],
    language: 'fr', version: '1.0.0', ownerId: 'user-theo',
    visibility: 'public', price: 0, dataType: 'text',
    totalFiles: 12000, sizeMb: 22.1,
    annotatedFiles: 12000, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: new Date('2024-08-01'), updatedAt: new Date('2024-12-10'),
    completedAt: new Date('2024-12-10'),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_010', title: 'corpus_audio_wolof_40h',
    description: "40 heures d'enregistrements en Wolof, 2 400 fichiers audio segmentés, transcriptions validées par des locuteurs natifs.",
    tags: ['wolof', 'ASR', 'sénégal', 'corpus', 'payant'],
    language: 'wo', version: '3.0.0', ownerId: 'user-aminata',
    visibility: 'public', price: 8000, dataType: 'audio',
    totalFiles: 2400, sizeMb: 8192.0,
    annotatedFiles: 2400, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: new Date('2023-09-01'), updatedAt: new Date('2024-10-15'),
    completedAt: new Date('2024-10-15'),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_011', title: 'ecommerce_abidjan_listings',
    description: "22 000 annonces e-commerce collectées à Abidjan. Catégories, prix, descriptions.",
    tags: ['e-commerce', 'abidjan', 'côte-d-ivoire', 'pricing'],
    language: 'fr', version: '1.1.0', ownerId: 'user-marie',
    visibility: 'public', price: 0, dataType: 'csv',
    totalFiles: 22000, sizeMb: 43.5,
    annotatedFiles: 14300, annotationProgress: 65, taskCount: 3,
    status: 'active',
    createdAt: new Date('2024-11-20'), updatedAt: daysAgo(4),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_012', title: 'ner_annonces_telecom_mali',
    description: "Annonces de vente de téléphones collectées à Bamako et Sikasso. Entités annotées : marque, modèle, prix, lieu, état.",
    tags: ['NER', 'mali', 'bamako', 'télécom'],
    language: 'fr', version: '1.0.0', ownerId: 'user-theo',
    visibility: 'public', price: 0, dataType: 'text',
    totalFiles: 4500, sizeMb: 7.3,
    annotatedFiles: 900, annotationProgress: 20, taskCount: 2,
    status: 'active',
    createdAt: daysAgo(20), updatedAt: daysAgo(6),
    members: [], teamAssignments: [],
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// DATASET REFS (vue légère { id, name, status })
// Dérivés de MOCK_DATASETS → toujours cohérents, jamais à maintenir en double.
// Remplace l'ancien MOCK_DATASETS: DatasetRef[] qui vivait dans types/team.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DATASET_REFS: DatasetRef[] = MOCK_DATASETS.map(d => ({
  id:     d.id,
  name:   d.title,
  status: d.status,
}))


// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_001', userId: 'user-owner', type: 'annotation_rejected',
    title: 'Annotation rejetée',
    message: 'Aminata Diallo a rejeté 1 annotation dans phones_images_batch2. Motif : bounding box incorrecte.',
    read: false, createdAt: hoursAgo(23), link: '/annotate/ds_001/task_001/2',
  },
  {
    id: 'notif_002', userId: 'user-owner', type: 'task_assigned',
    title: 'Nouvelle tâche assignée',
    message: "Tu as été assigné à la tâche 'Validation prix – marketplace Afrique' (urgente, échéance dans 2 jours).",
    read: false, createdAt: daysAgo(1), link: '/tasks/job_004',
  },
  {
    id: 'notif_003', userId: 'user-owner', type: 'dataset_shared',
    title: 'Dataset accédé',
    message: 'Kofi Boateng a accédé à ton dataset produits_telecom_dakar depuis la marketplace.',
    read: false, createdAt: hoursAgo(38), link: '/datasets/ds_003',
  },
  {
    id: 'notif_004', userId: 'user-owner', type: 'payment_ready',
    title: 'Paiement disponible',
    message: '47 800 F CFA sont disponibles pour retrait sur ton compte MTN MoMo.',
    read: true, createdAt: daysAgo(3), link: '/profile/earnings',
  },
  {
    id: 'notif_005', userId: 'user-owner', type: 'new_member',
    title: 'Nouveau collaborateur',
    message: "Jean Akpovi a rejoint ton équipe Équipe Cotonou.",
    read: true, createdAt: daysAgo(4), link: '/collaborators',
  },
  {
    id: 'notif_006', userId: 'user-owner', type: 'annotation_validated',
    title: 'Annotations validées',
    message: "47 de tes annotations dans phones_images_batch2 ont été validées par Aminata.",
    read: true, createdAt: hoursAgo(12), link: '/datasets/ds_001',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// STATS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  annotationsToday:         284,
  annotationsTodayDelta:    18,
  tasksInProgress:          7,
  tasksUrgent:              3,
  totalDatasets:            12,
  datasetsShared:           4,
  earningsThisMonth:        47800,
  earningsDelta:            12,
  accuracyGlobal:           91,
  interAnnotatorAgreement:  78,
  autoValidationRate:       63,
  rejectionRate:            4,
}


// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD = [
  { userId: 'user-aminata', rank: 1, annotationsThisMonth: 5480, accuracy: 94, badge: 'Top annotateur' },
  { userId: 'user-theo',    rank: 2, annotationsThisMonth: 3200, accuracy: 89, badge: 'Régularité'     },
  { userId: 'user-kofi',    rank: 3, annotationsThisMonth: 2840, accuracy: 92, badge: null             },
  { userId: 'user-owner',   rank: 4, annotationsThisMonth: 4820, accuracy: 91, badge: null             },
  { userId: 'user-marie',   rank: 5, annotationsThisMonth: 1120, accuracy: 88, badge: null             },
]


// ─────────────────────────────────────────────────────────────────────────────
// JOBS D'ANNOTATION
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_JOBS: AnnotationJob[] = [
  {
    id: 'job-001', datasetId: 'ds_001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    createdBy: 'user-owner', createdAt: iso(daysAgo(7)),
    labels: NER_LABELS,
    instructions: "Annoter les entités : PERSONNE, ORGANISATION, LIEU, DATE, MONTANT. Un token peut avoir plusieurs labels.",
    allowSkip: true, allowMultiple: false,
    totalElements: 10, batchSize: 5, batchCount: 2,
    distributionMode: 'sequential',
    pool: { mode: 'individuals', annotatorIds: ['user-owner', 'user-kofi'], teamIds: [], reviewMode: 'none' },
    batchOverrides: [],
    annotatedCount: 3, skippedCount: 1, status: 'in_progress',
  },
  {
    id: 'job-002', datasetId: 'ds_004', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    createdBy: 'user-owner', createdAt: iso(daysAgo(10)),
    labels: SENTIMENT_LABELS,
    instructions: "Classifier le sentiment global. En cas de doute entre Positif/Mixte, privilégier Mixte.",
    allowSkip: true, allowMultiple: false,
    totalElements: 5, batchSize: 5, batchCount: 1,
    distributionMode: 'sequential',
    pool: { mode: 'individuals', annotatorIds: ['user-marie'], teamIds: [], reviewMode: 'none' },
    batchOverrides: [],
    annotatedCount: 5, skippedCount: 0, status: 'completed',
  },
  {
    id: 'job-003', datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    createdBy: 'user-owner', createdAt: iso(daysAgo(5)),
    labels: DEFECT_LABELS,
    instructions: "Entourer chaque défaut visible. Labelliser systématiquement les rayures même petites.",
    allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 2, batchCount: 3,
    distributionMode: 'sequential',
    pool: { mode: 'teams', annotatorIds: [], teamIds: ['team_001'], reviewMode: 'none' },
    batchOverrides: [],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },
  {
    id: 'job-004', datasetId: 'ds_005', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    createdBy: 'user-owner', createdAt: iso(daysAgo(2)),
    labels: [],
    instructions: "Transcrire mot à mot. Indiquer [bruit] ou [inaudible] si nécessaire. Ne pas corriger la grammaire.",
    allowSkip: true, allowMultiple: false,
    totalElements: 8, batchSize: 4, batchCount: 2,
    distributionMode: 'random',
    pool: { mode: 'teams', annotatorIds: [], teamIds: ['team_002'], reviewMode: 'none' },
    batchOverrides: [],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },
  {
    id: 'job-005', datasetId: 'ds_006', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    createdBy: 'user-owner', createdAt: iso(daysAgo(1)),
    labels: [],
    instructions: "Décrire la scène en 1-2 phrases. Mentionner les éléments africains caractéristiques.",
    allowSkip: true, allowMultiple: false,
    totalElements: 6, batchSize: 6, batchCount: 1,
    distributionMode: 'sequential',
    pool: { mode: 'individuals', annotatorIds: ['user-owner', 'user-marie'], teamIds: [], reviewMode: 'none' },
    batchOverrides: [],
    annotatedCount: 0, skippedCount: 0, status: 'pending',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// BATCHES
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BATCHES: AnnotationBatch[] = [
  {
    id: 'batch-001-1', jobId: 'job-001',
    datasetId: 'ds_001', datasetName: 'Actualités Bénin — NER',
    dataType: 'text', taskType: 'sequence',
    batchIndex: 1, batchTotal: 2,
    labels: NER_LABELS, allowSkip: true,
    instructions: "Annoter les entités nommées. Raccourcis : 1-5.",
    elements: makeTextElements('b001-1', 5),
    assignedTo: 'user-owner', reviewMode: 'none', isOverride: false,
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
    assignedTo: 'user-kofi', reviewMode: 'none', isOverride: false,
    status: 'pending',
    progress: { total: 5, annotated: 0, skipped: 0, remaining: 5 },
  },
  {
    id: 'batch-002-1', jobId: 'job-002',
    datasetId: 'ds_004', datasetName: 'Avis clients Sénégal',
    dataType: 'text', taskType: 'classification',
    batchIndex: 1, batchTotal: 1,
    labels: SENTIMENT_LABELS, allowSkip: true, allowMultiple: false,
    elements: makeTextElements('b002-1', 5),
    assignedTo: 'user-marie', reviewMode: 'none', isOverride: false,
    status: 'completed',
    progress: { total: 5, annotated: 5, skipped: 0, remaining: 0 },
  },
  {
    id: 'batch-003-1', jobId: 'job-003',
    datasetId: 'ds_001', datasetName: 'SafeDeal — Détection défauts',
    dataType: 'image', taskType: 'bounding_box',
    batchIndex: 1, batchTotal: 3,
    labels: DEFECT_LABELS, allowSkip: true,
    elements: makeImageElements('b003-1', 2),
    assignedTo: 'team:team_001', teamId: 'team_001', reviewMode: 'none', isOverride: false,
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
    assignedTo: 'team:team_001', teamId: 'team_001', reviewMode: 'none', isOverride: false,
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
    assignedTo: 'team:team_001', teamId: 'team_001', reviewMode: 'none', isOverride: false,
    status: 'pending',
    progress: { total: 2, annotated: 0, skipped: 0, remaining: 2 },
  },
  {
    id: 'batch-004-1', jobId: 'job-004',
    datasetId: 'ds_005', datasetName: 'Audio Fon / Yoruba',
    dataType: 'audio', taskType: 'transcription',
    batchIndex: 1, batchTotal: 2,
    labels: [], allowSkip: true,
    elements: makeAudioElements('b004-1', 4),
    assignedTo: 'team:team_002', teamId: 'team_002', reviewMode: 'none', isOverride: false,
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
    assignedTo: 'team:team_002', teamId: 'team_002', reviewMode: 'none', isOverride: false,
    status: 'pending',
    progress: { total: 4, annotated: 0, skipped: 0, remaining: 4 },
  },
  {
    id: 'batch-005-1', jobId: 'job-005',
    datasetId: 'ds_006', datasetName: 'Marchés & Scènes urbaines Bénin',
    dataType: 'image', taskType: 'captioning',
    batchIndex: 1, batchTotal: 1,
    labels: [], allowSkip: true,
    elements: makeImageElements('b005-1', 6),
    assignedTo: 'user-owner', reviewMode: 'none', isOverride: false,
    status: 'pending',
    progress: { total: 6, annotated: 0, skipped: 0, remaining: 6 },
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// ANNOTATION SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANNOTATION_SESSIONS: AnnotationSession[] =
  MOCK_BATCHES.map(batchToSession)


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

export const getDatasetById =
  (id: string) => MOCK_DATASETS.find(d => d.id === id)

export const getMyDatasets =
  (userId: string) => MOCK_DATASETS.filter(d => d.ownerId === userId)

export const getPublicDatasets =
  () => MOCK_DATASETS.filter(d => d.visibility === 'public')

export const getAccessibleDatasets = (userId: string): Dataset[] =>
  MOCK_DATASETS.filter(d => {
    if (d.ownerId === userId)                             return true
    if (d.visibility === 'public')                       return true
    if (d.members.some(m => m.userId === userId))        return true
    return d.teamAssignments.some(ta => {
      const team = MOCK_TEAMS.find(t => t.id === ta.teamId)
      return team?.members.some(m => m.userId === userId) ?? false
    })
  })

export const getJobById =
  (id: string) => MOCK_JOBS.find(j => j.id === id)

export const getJobsForDataset =
  (datasetId: string) => MOCK_JOBS.filter(j => j.datasetId === datasetId)

// ─── Résolution d'accès (modèle canonique : 1 batch → 1 user ou 1 équipe) ────
// Un batch d'équipe a assignedTo = "team:<teamId>" (et teamId rempli).

const isMemberOfTeam = (teamId: string, userId: string): boolean =>
  MOCK_TEAMS.find(t => t.id === teamId)?.members.some(m => m.userId === userId) ?? false

function batchTeamId(b: { assignedTo: string; teamId?: string }): string | null {
  if (b.teamId) return b.teamId
  if (b.assignedTo.startsWith('team:')) return b.assignedTo.slice('team:'.length)
  return null
}

// Un user fait-il partie du pool d'un job ?
function userInPool(pool: JobPool, userId: string): boolean {
  if (pool.mode === 'individuals') {
    return pool.annotatorIds.includes(userId) || pool.reviewerId === userId
  }
  return pool.teamIds.some(tid => isMemberOfTeam(tid, userId))
}

export const getJobsForUser =
  (userId: string) => MOCK_JOBS.filter(j => userInPool(j.pool, userId))

export const getBatchById =
  (id: string) => MOCK_BATCHES.find(b => b.id === id)

export const getBatchesForJob =
  (jobId: string) => MOCK_BATCHES.filter(b => b.jobId === jobId)

export const canAccessBatch =
  (batch: AnnotationBatch, userId: string): boolean => {
    if (batch.assignedTo === userId) return true
    const tid = batchTeamId(batch)
    return tid ? isMemberOfTeam(tid, userId) : false
  }

export const getActiveBatchForUser = (userId: string): AnnotationBatch | null => {
  const myBatches = MOCK_BATCHES.filter(b => canAccessBatch(b, userId))
  return findActiveBatch(myBatches)
}

export const getSessionById =
  (id: string) => MOCK_ANNOTATION_SESSIONS.find(s => s.id === id)

export const getMyAnnotationSessions = (userId: string): AnnotationSession[] =>
  MOCK_ANNOTATION_SESSIONS.filter(s => {
    if (s.assignedTo === userId) return true
    const tid = batchTeamId(s)
    return tid ? isMemberOfTeam(tid, userId) : false
  })

export const getActiveSessionsForUser = (userId: string): AnnotationSession[] =>
  getMyAnnotationSessions(userId).filter(
    s => !s.progress || s.progress.remaining > 0
  )

export const getJobGroupsForUser = (userId: string): JobGroup[] =>
  groupBatchesByJob(MOCK_JOBS, MOCK_BATCHES, userId, canAccessBatch)

export const getTeamById =
  (id: string) => MOCK_TEAMS.find(t => t.id === id)

export const getTeamsForUser =
  (userId: string) => MOCK_TEAMS.filter(t => t.members.some(m => m.userId === userId))

export const getUnreadNotifications =
  (userId: string) => MOCK_NOTIFICATIONS.filter(n => n.userId === userId && !n.read)