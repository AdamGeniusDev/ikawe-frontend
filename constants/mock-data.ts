// constants/mock-data.ts


import type { Dataset, DatasetMember }  from '@/types/datasets'
import type { AnnotationSession }        from '@/types/annotation'
import type { Team, TeamMember, PendingInvite } from '@/types/team'


export { MOCK_USERS, CURRENT_MOCK_USER as CURRENT_USER, getUserById } from '@/types/user'


// ─────────────────────────────────────────────────────────────────────────────
// TYPES LOCAUX — uniquement ce qui n'existe nulle part ailleurs
// ─────────────────────────────────────────────────────────────────────────────

export interface MockTask {
  id:           string
  datasetId:    string
  title:        string
  assignedTo:   string[]   // userIds
  status:       'pending' | 'in_progress' | 'completed' | 'blocked'
  priority:     'low' | 'normal' | 'high' | 'urgent'
  totalItems:   number
  completedItems: number
  dueAt:        Date
  createdAt:    Date
  instructions?: string
}

export interface AppliedLabel {
  labelId:    string
  bbox?:      { x: number; y: number; w: number; h: number }
  polygon?:   Array<{ x: number; y: number }>
  span?:      { start: number; end: number }
  timeRange?: { start: number; end: number }
  confidence?: number
}

export interface MockAnnotation {
  id:          string
  datasetId:   string
  taskId:      string
  fileIndex:   number
  annotatedBy: string   // userId
  status:      'pending' | 'validated' | 'rejected'
  labels:      AppliedLabel[]
  createdAt:   Date
  reviewedAt?: Date
  reviewedBy?: string   // userId
  note?:       string
}

export interface MockNotification {
  id:        string
  userId:    string
  type:      'task_assigned' | 'annotation_validated' | 'annotation_rejected'
           | 'dataset_shared' | 'payment_ready' | 'new_member'
  title:     string
  message:   string
  read:      boolean
  createdAt: Date
  link?:     string
}


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
// TEAMS
// Utilise Team et TeamMember de types/teams.ts
// TeamMember.userId référence MOCK_USERS de types/user.ts
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_001',
    name: 'Équipe Cotonou',
    description: 'Équipe principale basée à Cotonou',
    ownerId: 'usr_001',
    createdAt: '2024-01-16',
    datasetIds: ['ds_001', 'ds_004', 'ds_006'],
    members: [
      { userId: 'usr_001', role: 'team_owner', joinedAt: '2024-01-16', annotations: 4820, lastActive: 'Il y a 5 min'  },
      { userId: 'usr_003', role: 'annotator',  joinedAt: '2024-02-20', annotations: 3200, lastActive: 'Hier'          },
      { userId: 'usr_005', role: 'reviewer',   joinedAt: '2024-01-28', annotations: 1120, lastActive: 'Il y a 2h'     },
      { userId: 'usr_008', role: 'annotator',  joinedAt: '2024-04-05', annotations: 120,  lastActive: 'Il y a 3j'     },
    ] satisfies TeamMember[],
  },
  {
    id: 'team_002',
    name: 'Équipe West Africa NLP',
    description: 'Spécialisée NLP multilingue Afrique de l\'Ouest',
    ownerId: 'usr_002',
    createdAt: '2023-12-01',
    datasetIds: ['ds_002', 'ds_005', 'ds_007'],
    members: [
      { userId: 'usr_002', role: 'team_owner', joinedAt: '2023-12-01', annotations: 5480, lastActive: 'Il y a 1h'     },
      { userId: 'usr_004', role: 'annotator',  joinedAt: '2024-03-10', annotations: 2840, lastActive: 'Il y a 30 min' },
      { userId: 'usr_006', role: 'annotator',  joinedAt: '2024-04-01', annotations: 640,  lastActive: 'Il y a 1j'     },
      { userId: 'usr_007', role: 'reviewer',   joinedAt: '2024-03-25', annotations: 980,  lastActive: 'Il y a 4h'     },
    ] satisfies TeamMember[],
  },
]

export const MOCK_PENDING_INVITES: PendingInvite[] = [
  { id: 'p1', email: 'grace.kone@mail.com', sentAt: 'Il y a 2j' },
  { id: 'p2', email: 'serge.akpo@mail.com', sentAt: 'Il y a 5j' },
]


// ─────────────────────────────────────────────────────────────────────────────
// DATASET MEMBERS réutilisables
// name dénormalisé pour éviter un re-fetch au rendu
// ─────────────────────────────────────────────────────────────────────────────

const MEMBER_KOFI: DatasetMember = {
  userId: 'usr_004', name: 'Kofi Boateng',
  role: 'annotator', grantedAt: iso(daysAgo(10)), grantedBy: 'usr_001',
}
const MEMBER_AMINATA: DatasetMember = {
  userId: 'usr_005', name: 'Aminata Diallo',
  role: 'reviewer', grantedAt: iso(daysAgo(8)), grantedBy: 'usr_001',
}
const MEMBER_THEO: DatasetMember = {
  userId: 'usr_003', name: 'Théo Comlan',
  role: 'annotator', grantedAt: iso(daysAgo(5)), grantedBy: 'usr_001',
}
const MEMBER_GRACE: DatasetMember = {
  userId: 'usr_007', name: 'Grace Adeola',
  role: 'annotator', grantedAt: iso(daysAgo(12)), grantedBy: 'usr_001',
}


// ─────────────────────────────────────────────────────────────────────────────
// DATASETS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 'ds_001', title: 'phones_images_batch2',
    description: 'Photos de smartphones usagés collectées au marché Dantokpa. Objectif : détecter les défauts physiques (rayures, écrans cassés, ports endommagés) pour alimenter le score de vérification SafeDeal.',
    tags: ['smartphones', 'défauts', 'bounding-box', 'bénin'],
    language: 'fr', version: '2.0.0', ownerId: 'usr_001',
    visibility: 'team', price: 0, dataType: 'image',
    totalFiles: 2300, sizeMb: 1433.6,
    annotatedFiles: 966, annotationProgress: 42, taskCount: 2,
    status: 'active',
    createdAt: daysAgo(35), updatedAt: hoursAgo(2),
    members: [MEMBER_KOFI, MEMBER_AMINATA], teamAssignments: [],
  },
  {
    id: 'ds_002', title: 'smartphone_listings_v3',
    description: 'Export des annonces smartphones de SafeDeal Côte d\'Ivoire et Bénin. Chaque ligne = une annonce avec prix, état déclaré, modèle, ville.',
    tags: ['marketplace', 'prix', 'classification', 'côte-d-ivoire', 'bénin'],
    language: 'fr', version: '3.1.0', ownerId: 'usr_001',
    visibility: 'team', price: 0, dataType: 'csv',
    totalFiles: 12450, sizeMb: 24.8,
    annotatedFiles: 8466, annotationProgress: 68, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(60), updatedAt: daysAgo(2),
    members: [MEMBER_THEO, MEMBER_AMINATA], teamAssignments: [],
  },
  {
    id: 'ds_003', title: 'produits_telecom_dakar',
    description: 'Catalogue complet de produits télécoms collectés dans les boutiques de Sandaga et HLM Grand Yoff, Dakar. Dataset 100% annoté, publié sur la marketplace.',
    tags: ['télécom', 'catalogue', 'dakar', 'sénégal', 'NER'],
    language: 'fr', version: '1.2.0', ownerId: 'usr_001',
    visibility: 'public', price: 0, dataType: 'json',
    totalFiles: 8900, sizeMb: 18.3,
    annotatedFiles: 8900, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: daysAgo(90), updatedAt: daysAgo(15), completedAt: daysAgo(15),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_004', title: 'reviews_abidjan_corpus',
    description: 'Avis consommateurs collectés sur les réseaux sociaux à Abidjan concernant les achats de smartphones. Analyse de sentiment pour la feature de réputation vendeur.',
    tags: ['sentiment', 'avis', 'abidjan', 'réseaux-sociaux'],
    language: 'fr', version: '1.0.0', ownerId: 'usr_001',
    visibility: 'private', price: 0, dataType: 'text',
    totalFiles: 5100, sizeMb: 8.7,
    annotatedFiles: 255, annotationProgress: 5, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(7), updatedAt: hoursAgo(12),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_005', title: 'audio_beninois_v1',
    description: 'Enregistrements vocaux collectés dans les marchés de Porto-Novo et Cotonou. Locuteurs natifs Fon et Yoruba.',
    tags: ['audio', 'fon', 'yoruba', 'ASR', 'bénin'],
    language: 'fon', version: '1.0.0', ownerId: 'usr_001',
    visibility: 'team', price: 0, dataType: 'audio',
    totalFiles: 80, sizeMb: 640.0,
    annotatedFiles: 30, annotationProgress: 37, taskCount: 1,
    status: 'active',
    createdAt: daysAgo(14), updatedAt: daysAgo(1),
    members: [MEMBER_THEO, MEMBER_GRACE], teamAssignments: [],
  },
  {
    id: 'ds_006', title: 'phones_images_batch3',
    description: 'Nouveau batch collecté lors de l\'opération terrain du 2 avril 2025. En cours de nettoyage avant annotation.',
    tags: ['smartphones', 'bénin', 'batch3'],
    language: 'fr', version: '1.0.0', ownerId: 'usr_001',
    visibility: 'private', price: 0, dataType: 'image',
    totalFiles: 1850, sizeMb: 840.0,
    annotatedFiles: 0, annotationProgress: 0, taskCount: 0,
    status: 'draft',
    createdAt: daysAgo(3), updatedAt: daysAgo(3),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_007', title: 'mobile_prices_west_africa_2024',
    description: 'Prix de smartphones collectés dans 6 pays d\'Afrique de l\'Ouest entre janvier et décembre 2024.',
    tags: ['prix', 'mobile', 'afrique-ouest', 'benchmark'],
    language: 'fr', version: '4.0.0', ownerId: 'usr_004',
    visibility: 'public', price: 0, dataType: 'csv',
    totalFiles: 34000, sizeMb: 67.2,
    annotatedFiles: 34000, annotationProgress: 100, taskCount: 0,
    status: 'completed',
    createdAt: new Date('2024-01-10'), updatedAt: new Date('2025-01-05'),
    completedAt: new Date('2025-01-05'),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_008', title: 'phone_defects_detection_dataset',
    description: '5 000 images annotées de smartphones avec bounding boxes sur les défauts physiques. Collecté en partenariat avec des réparateurs à Dakar.',
    tags: ['défauts', 'bounding-box', 'YOLO', 'dakar', 'payant'],
    language: 'fr', version: '2.1.0', ownerId: 'usr_002',
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
    description: '12 000 avis clients collectés sur des groupes Facebook camerounais. Annotations de sentiment. Testé avec CamemBERT-base, F1-score 0.87.',
    tags: ['sentiment', 'cameroun', 'NLP', 'facebook'],
    language: 'fr', version: '1.0.0', ownerId: 'usr_006',
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
    description: '40 heures d\'enregistrements en Wolof, 2 400 fichiers audio segmentés, transcriptions validées par des locuteurs natifs.',
    tags: ['wolof', 'ASR', 'sénégal', 'corpus', 'payant'],
    language: 'wo', version: '3.0.0', ownerId: 'usr_002',
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
    description: '22 000 annonces e-commerce collectées à Abidjan. Catégories, prix, descriptions.',
    tags: ['e-commerce', 'abidjan', 'côte-d-ivoire', 'pricing'],
    language: 'fr', version: '1.1.0', ownerId: 'usr_005',
    visibility: 'public', price: 0, dataType: 'csv',
    totalFiles: 22000, sizeMb: 43.5,
    annotatedFiles: 14300, annotationProgress: 65, taskCount: 3,
    status: 'active',
    createdAt: new Date('2024-11-20'), updatedAt: daysAgo(4),
    members: [], teamAssignments: [],
  },
  {
    id: 'ds_012', title: 'ner_annonces_telecom_mali',
    description: 'Annonces de vente de téléphones collectées à Bamako et Sikasso. Entités annotées : marque, modèle, prix, lieu, état.',
    tags: ['NER', 'mali', 'bamako', 'télécom'],
    language: 'fr', version: '1.0.0', ownerId: 'usr_006',
    visibility: 'public', price: 0, dataType: 'text',
    totalFiles: 4500, sizeMb: 7.3,
    annotatedFiles: 900, annotationProgress: 20, taskCount: 2,
    status: 'active',
    createdAt: daysAgo(20), updatedAt: daysAgo(6),
    members: [], teamAssignments: [],
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TASKS: MockTask[] = [
  {
    id: 'task_001', datasetId: 'ds_001',
    title: 'Détection objets – smartphones batch2 (tranche A)',
    assignedTo: ['usr_001', 'usr_003'], status: 'in_progress', priority: 'high',
    totalItems: 200, completedItems: 140,
    dueAt: daysFromNow(1), createdAt: daysAgo(7),
    instructions: 'Entourer chaque composant visible avec une bounding box. Labelliser systématiquement les rayures même petites. Ignorer si qualité photo insuffisante (floue).',
  },
  {
    id: 'task_002', datasetId: 'ds_002',
    title: 'Classification texte – annonces Cotonou',
    assignedTo: ['usr_001', 'usr_003', 'usr_004'], status: 'in_progress', priority: 'normal',
    totalItems: 1200, completedItems: 820,
    dueAt: daysFromNow(4), createdAt: daysAgo(10),
    instructions: 'Classer chaque annonce selon la cohérence du prix avec le modèle déclaré. Prix correct = dans la fourchette marché ±15%.',
  },
  {
    id: 'task_003', datasetId: 'ds_005',
    title: 'Transcription audio – corpus Fon vol.1',
    assignedTo: ['usr_001'], status: 'in_progress', priority: 'normal',
    totalItems: 80, completedItems: 30,
    dueAt: daysFromNow(7), createdAt: daysAgo(5),
    instructions: 'Transcrire mot à mot. Indiquer [bruit] ou [inaudible] si nécessaire. Ne pas corriger la grammaire.',
  },
  {
    id: 'task_004', datasetId: 'ds_002',
    title: 'Validation prix – marketplace Afrique',
    assignedTo: ['usr_001'], status: 'blocked', priority: 'urgent',
    totalItems: 500, completedItems: 0,
    dueAt: daysFromNow(2), createdAt: daysAgo(1),
    instructions: 'En attente de la mise à jour du référentiel de prix. Tâche bloquée jusqu\'à nouveau ordre.',
  },
  {
    id: 'task_005', datasetId: 'ds_004',
    title: 'NER – annonces Dakar (lot 1)',
    assignedTo: ['usr_001', 'usr_004'], status: 'pending', priority: 'low',
    totalItems: 600, completedItems: 0,
    dueAt: daysFromNow(14), createdAt: daysAgo(2),
    instructions: 'Annoter les entités : MARQUE, MODELE, PRIX, LIEU, ETAT. Un token peut avoir plusieurs labels.',
  },
  {
    id: 'task_006', datasetId: 'ds_001',
    title: 'Révision annotations batch2 (tranche A)',
    assignedTo: ['usr_005'], status: 'pending', priority: 'normal',
    totalItems: 140, completedItems: 0,
    dueAt: daysFromNow(5), createdAt: daysAgo(1),
    instructions: 'Valider ou rejeter les 140 annotations soumises. Critère de rejet : bounding box chevauchant >30% une zone incorrecte.',
  },
  {
    id: 'task_007', datasetId: 'ds_004',
    title: 'Sentiment – avis Facebook Abidjan (lot 1)',
    assignedTo: ['usr_001', 'usr_006'], status: 'pending', priority: 'normal',
    totalItems: 500, completedItems: 255,
    dueAt: daysFromNow(10), createdAt: daysAgo(7),
    instructions: 'Classifier le sentiment global. En cas de doute entre Positif/Mixte, privilégier Mixte.',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// ANNOTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANNOTATIONS: MockAnnotation[] = [
  {
    id: 'ann_001', datasetId: 'ds_001', taskId: 'task_001', fileIndex: 1,
    annotatedBy: 'usr_001', status: 'validated',
    labels: [
      { labelId: 'lbl_001', bbox: { x: 0.18, y: 0.12, w: 0.36, h: 0.62 }, confidence: 0.95 },
      { labelId: 'lbl_002', bbox: { x: 0.60, y: 0.28, w: 0.16, h: 0.26 }, confidence: 0.88 },
    ],
    createdAt: hoursAgo(48), reviewedAt: hoursAgo(24), reviewedBy: 'usr_005',
  },
  {
    id: 'ann_002', datasetId: 'ds_001', taskId: 'task_001', fileIndex: 2,
    annotatedBy: 'usr_001', status: 'rejected',
    labels: [{ labelId: 'lbl_001', bbox: { x: 0.10, y: 0.05, w: 0.80, h: 0.90 }, confidence: 0.40 }],
    createdAt: hoursAgo(47), reviewedAt: hoursAgo(23), reviewedBy: 'usr_005',
    note: 'Bounding box trop large, ne correspond pas à l\'écran uniquement.',
  },
  {
    id: 'ann_003', datasetId: 'ds_001', taskId: 'task_001', fileIndex: 3,
    annotatedBy: 'usr_003', status: 'validated',
    labels: [
      { labelId: 'lbl_001', bbox: { x: 0.20, y: 0.15, w: 0.34, h: 0.58 } },
      { labelId: 'lbl_006', bbox: { x: 0.35, y: 0.40, w: 0.08, h: 0.06 } },
    ],
    createdAt: hoursAgo(36), reviewedAt: hoursAgo(20), reviewedBy: 'usr_005',
  },
  {
    id: 'ann_004', datasetId: 'ds_002', taskId: 'task_002', fileIndex: 100,
    annotatedBy: 'usr_001', status: 'validated',
    labels: [{ labelId: 'lbl_041' }],
    createdAt: hoursAgo(12), reviewedAt: hoursAgo(6), reviewedBy: 'usr_005',
  },
  {
    id: 'ann_005', datasetId: 'ds_002', taskId: 'task_002', fileIndex: 101,
    annotatedBy: 'usr_001', status: 'pending',
    labels: [{ labelId: 'lbl_040' }],
    createdAt: hoursAgo(2),
  },
  {
    id: 'ann_006', datasetId: 'ds_005', taskId: 'task_003', fileIndex: 1,
    annotatedBy: 'usr_001', status: 'validated',
    labels: [{ labelId: 'lbl_030' }],
    createdAt: daysAgo(3), reviewedAt: daysAgo(2), reviewedBy: 'usr_005',
    note: 'Bonne qualité audio, transcription complète.',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif_001', userId: 'usr_001', type: 'annotation_rejected',
    title: 'Annotation rejetée',
    message: 'Aminata Diallo a rejeté 1 annotation dans phones_images_batch2. Motif : bounding box incorrecte.',
    read: false, createdAt: hoursAgo(23), link: '/annotate/ds_001/task_001/2',
  },
  {
    id: 'notif_002', userId: 'usr_001', type: 'task_assigned',
    title: 'Nouvelle tâche assignée',
    message: 'Tu as été assigné à la tâche \'Validation prix – marketplace Afrique\' (urgente, échéance dans 2 jours).',
    read: false, createdAt: daysAgo(1), link: '/tasks/task_004',
  },
  {
    id: 'notif_003', userId: 'usr_001', type: 'dataset_shared',
    title: 'Dataset accédé',
    message: 'Kofi Boateng a accédé à ton dataset produits_telecom_dakar depuis la marketplace.',
    read: false, createdAt: hoursAgo(38), link: '/datasets/ds_003',
  },
  {
    id: 'notif_004', userId: 'usr_001', type: 'payment_ready',
    title: 'Paiement disponible',
    message: '47 800 F CFA sont disponibles pour retrait sur ton compte MTN MoMo.',
    read: true, createdAt: daysAgo(3), link: '/profile/earnings',
  },
  {
    id: 'notif_005', userId: 'usr_001', type: 'new_member',
    title: 'Nouveau collaborateur',
    message: 'Jean Akpovi a rejoint ton équipe Équipe Cotonou.',
    read: true, createdAt: daysAgo(4), link: '/collaborators',
  },
  {
    id: 'notif_006', userId: 'usr_001', type: 'annotation_validated',
    title: 'Annotations validées',
    message: '47 de tes annotations dans phones_images_batch2 ont été validées par Aminata.',
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
// userId référence MOCK_USERS — lookup via getUserById(entry.userId)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD = [
  { userId: 'usr_002', rank: 1, annotationsThisMonth: 5480, accuracy: 94, badge: 'Top annotateur' },
  { userId: 'usr_003', rank: 2, annotationsThisMonth: 3200, accuracy: 89, badge: 'Régularité'     },
  { userId: 'usr_004', rank: 3, annotationsThisMonth: 2840, accuracy: 92, badge: null             },
  { userId: 'usr_001', rank: 4, annotationsThisMonth: 4820, accuracy: 91, badge: null             },
  { userId: 'usr_005', rank: 5, annotationsThisMonth: 1120, accuracy: 88, badge: null             },
]


// ─────────────────────────────────────────────────────────────────────────────
// ANNOTATION SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANNOTATION_SESSIONS: AnnotationSession[] = [
  {
    id: 'sess_001', datasetId: 'ds_001', datasetName: 'phones_images_batch2',
    dataType: 'image', taskType: 'classification',
    labels: [
      { id: 'l1', name: 'Bon état',     color: '#22c55e' },
      { id: 'l2', name: 'État moyen',   color: '#f97316' },
      { id: 'l3', name: 'Mauvais état', color: '#ef4444' },
    ],
    elements: [],
    allowSkip: true, allowMultiple: false,
    assignedTo: ['usr_001'],
    createdAt: iso(daysAgo(3)),
    progress: { total: 200, annotated: 140, skipped: 0, remaining: 60 },
  },
  {
    id: 'sess_002', datasetId: 'ds_005', datasetName: 'audio_beninois_v1',
    dataType: 'audio', taskType: 'transcription',
    labels: [], elements: [],
    allowSkip: true,
    assignedTo: ['usr_001'],
    createdAt: iso(daysAgo(5)),
    progress: { total: 80, annotated: 30, skipped: 0, remaining: 50 },
  },
  {
    id: 'sess_003', datasetId: 'ds_002', datasetName: 'smartphone_listings_v3',
    dataType: 'csv', taskType: 'classification',
    labels: [
      { id: 'l4', name: 'Prix correct',   color: '#22c55e' },
      { id: 'l5', name: 'Prix suspect',   color: '#ef4444' },
      { id: 'l6', name: 'Prix incomplet', color: '#f59e0b' },
    ],
    elements: [],
    allowSkip: false, allowMultiple: false,
    assignedTo: ['usr_004', 'usr_005'],
    createdAt: iso(daysAgo(2)),
    progress: { total: 1200, annotated: 820, skipped: 0, remaining: 380 },
  },
  {
    id: 'sess_004', datasetId: 'ds_003', datasetName: 'produits_telecom_dakar',
    dataType: 'json', taskType: 'sequence',
    labels: [
      { id: 'l7', name: 'MARQUE', color: '#3b82f6' },
      { id: 'l8', name: 'PRIX',   color: '#22c55e' },
      { id: 'l9', name: 'LIEU',   color: '#f97316' },
    ],
    elements: [],
    allowSkip: false, allowMultiple: true,
    assignedTo: [],
    createdAt: iso(daysAgo(20)),
    progress: { total: 400, annotated: 400, skipped: 0, remaining: 0 },
  },
  {
    id: 'sess_005', datasetId: 'ds_008', datasetName: 'phone_defects_detection_dataset',
    dataType: 'image', taskType: 'bounding_box',
    labels: [
      { id: 'l10', name: 'Écran',  color: '#3b82f6' },
      { id: 'l11', name: 'Rayure', color: '#ef4444' },
      { id: 'l12', name: 'Caméra', color: '#22c55e' },
    ],
    elements: [],
    allowSkip: true, allowMultiple: true,
    assignedTo: ['usr_001'],
    createdAt: iso(hoursAgo(6)),
    progress: { total: 150, annotated: 0, skipped: 0, remaining: 150 },
  },
  {
    id: 'sess_006', datasetId: 'ds_011', datasetName: 'ecommerce_abidjan_listings',
    dataType: 'csv', taskType: 'classification',
    labels: [
      { id: 'l13', name: 'Positif', color: '#22c55e' },
      { id: 'l14', name: 'Négatif', color: '#ef4444' },
      { id: 'l15', name: 'Neutre',  color: '#888780' },
    ],
    elements: [],
    allowSkip: true,
    assignedTo: ['usr_001'],
    createdAt: iso(daysAgo(1)),
    progress: { total: 300, annotated: 0, skipped: 0, remaining: 300 },
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE LOOKUP
// getUserById → importé depuis types/user.ts (re-exporté en haut de ce fichier)
// ─────────────────────────────────────────────────────────────────────────────

export const getDatasetById =
  (id: string) => MOCK_DATASETS.find(d => d.id === id)

export const getTasksByDataset =
  (datasetId: string) => MOCK_TASKS.filter(t => t.datasetId === datasetId)

export const getTasksByUser =
  (userId: string) => MOCK_TASKS.filter(t => t.assignedTo.includes(userId))

export const getAnnotationsByTask =
  (taskId: string) => MOCK_ANNOTATIONS.filter(a => a.taskId === taskId)

export const getUnreadNotifications =
  (userId: string) => MOCK_NOTIFICATIONS.filter(n => n.userId === userId && !n.read)

export const getTeamById =
  (id: string) => MOCK_TEAMS.find(t => t.id === id)

export const getTeamsForUser =
  (userId: string) => MOCK_TEAMS.filter(t => t.members.some(m => m.userId === userId))

export const getAccessibleDatasets = (userId: string): Dataset[] =>
  MOCK_DATASETS.filter(d =>
    d.ownerId === userId ||
    d.visibility === 'public' ||
    d.members.some(m => m.userId === userId) ||
    (d.visibility === 'team' &&
      MOCK_TEAMS.some(t =>
        t.members.some(m => m.userId === userId) &&
        t.datasetIds.includes(d.id)
      )
    )
  )

export const getMyDatasets =
  (userId: string): Dataset[] => MOCK_DATASETS.filter(d => d.ownerId === userId)

export const getPublicDatasets =
  (): Dataset[] => MOCK_DATASETS.filter(d => d.visibility === 'public')

export const getMyAnnotationSessions =
  (userId: string): AnnotationSession[] =>
    MOCK_ANNOTATION_SESSIONS.filter(
      s => s.assignedTo.length === 0 || s.assignedTo.includes(userId)
    )

export const getActiveSessionsForUser =
  (userId: string): AnnotationSession[] =>
    getMyAnnotationSessions(userId).filter(
      s => !s.progress || s.progress.remaining > 0
    )