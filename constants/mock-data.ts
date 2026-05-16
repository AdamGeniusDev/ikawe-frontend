

import {
  Dataset, DatasetMember, LabelDefinition,
} from "@/types/datasets"
import { AnnotationSession } from "@/types/annotation"


// On importe les types qu'on va aussi mocker
// (définis inline ici pour être autonome)

// ─────────────────────────────────────────────────────────────
// TYPES LOCAUX (si pas encore dans /types)
// ─────────────────────────────────────────────────────────────

export interface MockUser {
  id: string
  name: string
  email: string
  avatarInitials: string
  avatarColor: string
  role: "annotator" | "reviewer" | "admin"
  country: string
  joinedAt: Date
  totalAnnotations: number
  accuracy: number        // 0-100
  earningsThisMonth: number  // FCFA
  totalEarnings: number
  badges: string[]
}

export interface MockTeam {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  createdAt: Date
}

export interface MockTask {
  id: string
  datasetId: string
  title: string
  assignedTo: string[]    // userIds
  status: "pending" | "in_progress" | "completed" | "blocked"
  priority: "low" | "normal" | "high" | "urgent"
  totalItems: number
  completedItems: number
  dueAt: Date
  createdAt: Date
  instructions?: string
}

export interface AppliedLabel {
  labelId: string

  // Object detection / segmentation
  bbox?: { x: number; y: number; w: number; h: number }
  polygon?: Array<{ x: number; y: number }>

  // NER (texte)
  span?: { start: number; end: number }

  // Transcription (audio/video)
  timeRange?: { start: number; end: number }

  // Score de confiance (IA assistée)
  confidence?: number
  // ↑ 0 à 1. Si null = annoté manuellement.
  //   Si 0.95 = l'IA était sûre à 95%, l'humain a juste validé.
}

export interface MockAnnotation {
  id: string
  datasetId: string
  taskId: string
  fileIndex: number
  annotatedBy: string
  status: "pending" | "validated" | "rejected"
  labels: AppliedLabel[]   // ← utilise AppliedLabel au lieu de l'inline
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  note?: string
}

export interface MockNotification {
  id: string
  userId: string
  type: "task_assigned" | "annotation_validated" | "annotation_rejected" | "dataset_shared" | "payment_ready" | "new_member"
  title: string
  message: string
  read: boolean
  createdAt: Date
  link?: string
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAgo(n: number): Date {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ─────────────────────────────────────────────────────────────
// USERS  (8 utilisateurs)
// ─────────────────────────────────────────────────────────────

export const MOCK_USERS: MockUser[] = [
  {
    id: "usr_001",
    name: "Rid Dev",
    email: "rid@dataannot.io",
    avatarInitials: "RD",
    avatarColor: "#185FA5",
    role: "admin",
    country: "Bénin",
    joinedAt: new Date("2024-01-15"),
    totalAnnotations: 4820,
    accuracy: 91,
    earningsThisMonth: 47800,
    totalEarnings: 186400,
    badges: ["Top 10%", "Précision+", "100 tâches", "Image Expert"],
  },
  {
    id: "usr_002",
    name: "Fatou Mbaye",
    email: "fatou@dataannot.io",
    avatarInitials: "FM",
    avatarColor: "#D85A30",
    role: "admin",
    country: "Sénégal",
    joinedAt: new Date("2023-11-03"),
    totalAnnotations: 5480,
    accuracy: 94,
    earningsThisMonth: 54800,
    totalEarnings: 223600,
    badges: ["Top annotateur", "MVP", "Audio Expert"],
  },
  {
    id: "usr_003",
    name: "Théo Comlan",
    email: "theo@dataannot.io",
    avatarInitials: "TC",
    avatarColor: "#534AB7",
    role: "annotator",
    country: "Bénin",
    joinedAt: new Date("2024-02-20"),
    totalAnnotations: 3200,
    accuracy: 89,
    earningsThisMonth: 32000,
    totalEarnings: 98400,
    badges: ["Régularité", "NER Expert"],
  },
  {
    id: "usr_004",
    name: "Kofi Boateng",
    email: "kofi@dataannot.io",
    avatarInitials: "KB",
    avatarColor: "#1D9E75",
    role: "annotator",
    country: "Ghana",
    joinedAt: new Date("2024-03-10"),
    totalAnnotations: 2840,
    accuracy: 92,
    earningsThisMonth: 28400,
    totalEarnings: 71200,
    badges: ["Précision+"],
  },
  {
    id: "usr_005",
    name: "Aminata Diallo",
    email: "aminata@dataannot.io",
    avatarInitials: "AD",
    avatarColor: "#0F6E56",
    role: "reviewer",
    country: "Côte d'Ivoire",
    joinedAt: new Date("2024-01-28"),
    totalAnnotations: 1120,
    accuracy: 88,
    earningsThisMonth: 11200,
    totalEarnings: 42600,
    badges: ["Réviseur Senior"],
  },
  {
    id: "usr_006",
    name: "Moussa Touré",
    email: "moussa@dataannot.io",
    avatarInitials: "MT",
    avatarColor: "#BA7517",
    role: "annotator",
    country: "Mali",
    joinedAt: new Date("2024-04-01"),
    totalAnnotations: 640,
    accuracy: 85,
    earningsThisMonth: 6400,
    totalEarnings: 12800,
    badges: [],
  },
  {
    id: "usr_007",
    name: "Grace Adeola",
    email: "grace@dataannot.io",
    avatarInitials: "GA",
    avatarColor: "#993556",
    role: "annotator",
    country: "Nigeria",
    joinedAt: new Date("2024-03-25"),
    totalAnnotations: 980,
    accuracy: 90,
    earningsThisMonth: 9800,
    totalEarnings: 24500,
    badges: ["Audio Expert"],
  },
  {
    id: "usr_008",
    name: "Jean Akpovi",
    email: "jean@example.com",
    avatarInitials: "JA",
    avatarColor: "#888780",
    role: "annotator",
    country: "Bénin",
    joinedAt: new Date("2024-04-05"),
    totalAnnotations: 120,
    accuracy: 82,
    earningsThisMonth: 1200,
    totalEarnings: 1200,
    badges: [],
  },
]

// Utilisateur courant (celui connecté)
export const CURRENT_USER = MOCK_USERS[0]   // Rid Dev

// ─────────────────────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────────────────────

export const MOCK_TEAMS: MockTeam[] = [
  {
    id: "team_001",
    name: "Équipe Cotonou",
    ownerId: "usr_001",
    memberIds: ["usr_001", "usr_003", "usr_005", "usr_008"],
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "team_002",
    name: "Équipe West Africa NLP",
    ownerId: "usr_002",
    memberIds: ["usr_002", "usr_004", "usr_006", "usr_007"],
    createdAt: new Date("2023-12-01"),
  },
]

// ─────────────────────────────────────────────────────────────
// LABEL SCHEMAS (réutilisables)
// ─────────────────────────────────────────────────────────────

const LABELS_SMARTPHONE_PARTS: LabelDefinition[] = [
  { id: "lbl_001", name: "Écran", color: "#185FA5", shortcut: "E", description: "Surface d'affichage" },
  { id: "lbl_002", name: "Caméra", color: "#1D9E75", shortcut: "C", description: "Objectif(s) photo" },
  { id: "lbl_003", name: "Bouton power", color: "#BA7517", shortcut: "P" },
  { id: "lbl_004", name: "Port de charge", color: "#534AB7", shortcut: "U" },
  { id: "lbl_005", name: "Coque", color: "#888780", shortcut: "K" },
  { id: "lbl_006", name: "Rayure / défaut", color: "#E24B4A", shortcut: "R", description: "Dommage visible" },
]

const LABELS_SENTIMENT: LabelDefinition[] = [
  { id: "lbl_010", name: "Positif", color: "#1D9E75", shortcut: "P" },
  { id: "lbl_011", name: "Négatif", color: "#E24B4A", shortcut: "N" },
  { id: "lbl_012", name: "Neutre", color: "#888780", shortcut: "U" },
  { id: "lbl_013", name: "Mixte", color: "#BA7517", shortcut: "M" },
]

const LABELS_NER_TELECOM: LabelDefinition[] = [
  { id: "lbl_020", name: "MARQUE", color: "#185FA5", shortcut: "M", description: "Ex: Samsung, Apple, Tecno" },
  { id: "lbl_021", name: "MODELE", color: "#534AB7", shortcut: "O", description: "Ex: Galaxy A54, iPhone 13" },
  { id: "lbl_022", name: "PRIX", color: "#1D9E75", shortcut: "P", description: "Montant en FCFA" },
  { id: "lbl_023", name: "LIEU", color: "#D85A30", shortcut: "L", description: "Ville, quartier" },
  { id: "lbl_024", name: "ETAT", color: "#BA7517", shortcut: "E", description: "Neuf, occasion, reconditionné" },
]

const LABELS_AUDIO_TRANSCRIPTION: LabelDefinition[] = [
  { id: "lbl_030", name: "Parole", color: "#185FA5", shortcut: "S" },
  { id: "lbl_031", name: "Bruit de fond", color: "#888780", shortcut: "B" },
  { id: "lbl_032", name: "Silence", color: "#D3D1C7", shortcut: "X" },
  { id: "lbl_033", name: "Musique", color: "#534AB7", shortcut: "M" },
]

// ─────────────────────────────────────────────────────────────
// DATASETS  (12 datasets — mix privé/team/public)
// ─────────────────────────────────────────────────────────────

const MEMBER_KOFI: DatasetMember = {
  userId: "usr_004",
  role: "annotator",
  grantedAt: daysAgo(10),
  grantedBy: "usr_001",
}

const MEMBER_AMINATA: DatasetMember = {
  userId: "usr_005",
  role: "reviewer",
  grantedAt: daysAgo(8),
  grantedBy: "usr_001",
}

const MEMBER_THEO: DatasetMember = {
  userId: "usr_003",
  role: "annotator",
  grantedAt: daysAgo(5),
  grantedBy: "usr_001",
}

export const MOCK_DATASETS: Dataset[] = [
  // ── 1. Dataset Image — détection défauts ──────────────────
  {
    id: "ds_001",
    title: "phones_images_batch2",
    description: "Photos de smartphones usagés collectées au marché Dantokpa. Objectif : détecter les défauts physiques (rayures, écrans cassés, ports endommagés) pour alimenter le score de vérification SafeDeal.",
    tags: ["smartphones", "défauts", "bounding-box", "bénin"],
    language: "fr",
    version: "2.0.0",
    ownerId: "usr_001",
    visibility: "team",
    price: 0,
    dataType: "image",
    taskType: "object_detection",
    totalFiles: 2300,
    annotatedFiles: 966,
    sizeMb: 1433.6,
    labelSchema: LABELS_SMARTPHONE_PARTS,
    taskCount: 2,
    annotationProgress: 42,
    status: "active",
    createdAt: daysAgo(35),
    updatedAt: hoursAgo(2),
    completedAt: undefined,
    members: [MEMBER_KOFI, MEMBER_AMINATA],
  },

  // ── 2. Dataset CSV — annonces marketplace ─────────────────
  {
    id: "ds_002",
    title: "smartphone_listings_v3",
    description: "Export des annonces smartphones de SafeDeal Côte d'Ivoire et Bénin. Chaque ligne = une annonce avec prix, état déclaré, modèle, ville. À utiliser pour entraîner le modèle de détection de prix aberrants.",
    tags: ["marketplace", "prix", "classification", "côte-d-ivoire", "bénin"],
    language: "fr",
    version: "3.1.0",
    ownerId: "usr_001",
    visibility: "team",
    price: 0,
    dataType: "csv",
    taskType: "classification",
    totalFiles: 12450,
    annotatedFiles: 8466,
    sizeMb: 24.8,
    labelSchema: [
      { id: "lbl_040", name: "Prix correct", color: "#1D9E75", shortcut: "C" },
      { id: "lbl_041", name: "Prix suspect", color: "#E24B4A", shortcut: "S" },
      { id: "lbl_042", name: "Prix incomplet", color: "#BA7517", shortcut: "I" },
    ],
    taskCount: 1,
    annotationProgress: 68,
    status: "active",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
    completedAt: undefined,
    members: [MEMBER_THEO, MEMBER_AMINATA],
  },

  // ── 3. Dataset JSON — catalogue télécom Dakar ─────────────
  {
    id: "ds_003",
    title: "produits_telecom_dakar",
    description: "Catalogue complet de produits télécoms collectés dans les boutiques de Sandaga et HLM Grand Yoff, Dakar. Specs techniques + prix + disponibilité. Dataset 100% annoté, publié sur la marketplace.",
    tags: ["télécom", "catalogue", "dakar", "sénégal", "NER"],
    language: "fr",
    version: "1.2.0",
    ownerId: "usr_001",
    visibility: "public",
    price: 0,
    dataType: "json",
    taskType: "ner",
    totalFiles: 8900,
    annotatedFiles: 8900,
    sizeMb: 18.3,
    labelSchema: LABELS_NER_TELECOM,
    taskCount: 0,
    annotationProgress: 100,
    status: "completed",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(15),
    completedAt: daysAgo(15),
    members: [],
  },

  // ── 4. Dataset Texte — avis consommateurs ─────────────────
  {
    id: "ds_004",
    title: "reviews_abidjan_corpus",
    description: "Avis consommateurs collectés sur les réseaux sociaux (Facebook groups, WhatsApp forwards) à Abidjan concernant les achats de smartphones. Analyse de sentiment pour la feature de réputation vendeur.",
    tags: ["sentiment", "avis", "abidjan", "réseaux-sociaux"],
    language: "fr",
    version: "1.0.0",
    ownerId: "usr_001",
    visibility: "private",
    price: 0,
    dataType: "text",
    taskType: "sentiment",
    totalFiles: 5100,
    annotatedFiles: 255,
    sizeMb: 8.7,
    labelSchema: LABELS_SENTIMENT,
    taskCount: 1,
    annotationProgress: 5,
    status: "active",
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(12),
    completedAt: undefined,
    members: [],
  },

  // ── 5. Dataset Audio — corpus vocal Fon/Yoruba ────────────
  {
    id: "ds_005",
    title: "audio_beninois_v1",
    description: "Enregistrements vocaux collectés dans les marchés de Porto-Novo et Cotonou. Locuteurs natifs Fon et Yoruba. Objectif : créer un corpus pour ASR (reconnaissance vocale) adapté au contexte Afrique de l'Ouest.",
    tags: ["audio", "fon", "yoruba", "ASR", "bénin"],
    language: "fon",
    version: "1.0.0",
    ownerId: "usr_001",
    visibility: "team",
    price: 0,
    dataType: "audio",
    taskType: "transcription",
    totalFiles: 80,
    annotatedFiles: 30,
    sizeMb: 640.0,
    labelSchema: LABELS_AUDIO_TRANSCRIPTION,
    taskCount: 1,
    annotationProgress: 37,
    status: "active",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1),
    completedAt: undefined,
    members: [MEMBER_THEO, { userId: "usr_007", role: "annotator", grantedAt: daysAgo(12), grantedBy: "usr_001" }],
  },

  // ── 6. Dataset Image — nouveau batch (draft) ──────────────
  {
    id: "ds_006",
    title: "phones_images_batch3",
    description: "Nouveau batch collecté lors de l'opération terrain du 2 avril 2025. En cours de nettoyage avant annotation.",
    tags: ["smartphones", "bénin", "batch3"],
    language: "fr",
    version: "1.0.0",
    ownerId: "usr_001",
    visibility: "private",
    price: 0,
    dataType: "image",
    taskType: "object_detection",
    totalFiles: 1850,
    annotatedFiles: 0,
    sizeMb: 840.0,
    labelSchema: LABELS_SMARTPHONE_PARTS,
    taskCount: 0,
    annotationProgress: 0,
    status: "draft",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    completedAt: undefined,
    members: [],
  },

  // ── 7 à 12. Datasets BIBLIOTHÈQUE (autres users) ──────────

  {
    id: "ds_007",
    title: "mobile_prices_west_africa_2024",
    description: "Prix de smartphones collectés dans 6 pays d'Afrique de l'Ouest (CI, SN, BJ, CM, ML, GN) entre janvier et décembre 2024. Le dataset de référence pour la comparaison de prix mobile en Afrique francophone.",
    tags: ["prix", "mobile", "afrique-ouest", "benchmark"],
    language: "fr",
    version: "4.0.0",
    ownerId: "usr_004",   // Kofi
    visibility: "public",
    price: 0,
    dataType: "csv",
    taskType: "classification",
    totalFiles: 34000,
    annotatedFiles: 34000,
    sizeMb: 67.2,
    labelSchema: [],
    taskCount: 0,
    annotationProgress: 100,
    status: "completed",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2025-01-05"),
    completedAt: new Date("2025-01-05"),
    members: [],
  },

  {
    id: "ds_008",
    title: "phone_defects_detection_dataset",
    description: "5 000 images annotées de smartphones avec bounding boxes sur les défauts physiques. Collecté en partenariat avec des réparateurs à Dakar. Idéal pour fine-tuner YOLO ou Detectron2.",
    tags: ["défauts", "bounding-box", "YOLO", "dakar", "payant"],
    language: "fr",
    version: "2.1.0",
    ownerId: "usr_002",   // Fatou
    visibility: "public",
    price: 2500,
    dataType: "image",
    taskType: "object_detection",
    totalFiles: 5000,
    annotatedFiles: 5000,
    sizeMb: 1228.8,
    labelSchema: LABELS_SMARTPHONE_PARTS,
    taskCount: 0,
    annotationProgress: 100,
    status: "completed",
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2025-02-20"),
    completedAt: new Date("2025-02-20"),
    members: [],
  },

  {
    id: "ds_009",
    title: "avis_consommateurs_cameroun",
    description: "12 000 avis clients collectés sur des groupes Facebook camerounais. Annotations de sentiment (positif/négatif/neutre/mixte). Testé avec CamemBERT-base, F1-score 0.87.",
    tags: ["sentiment", "cameroun", "NLP", "facebook"],
    language: "fr",
    version: "1.0.0",
    ownerId: "usr_006",   // Moussa
    visibility: "public",
    price: 0,
    dataType: "text",
    taskType: "sentiment",
    totalFiles: 12000,
    annotatedFiles: 12000,
    sizeMb: 22.1,
    labelSchema: LABELS_SENTIMENT,
    taskCount: 0,
    annotationProgress: 100,
    status: "completed",
    createdAt: new Date("2024-08-01"),
    updatedAt: new Date("2024-12-10"),
    completedAt: new Date("2024-12-10"),
    members: [],
  },

  {
    id: "ds_010",
    title: "corpus_audio_wolof_40h",
    description: "40 heures d'enregistrements en Wolof, 2 400 fichiers audio segmentés, transcriptions validées par des locuteurs natifs. Le plus grand corpus Wolof publiquement disponible à ce jour.",
    tags: ["wolof", "ASR", "sénégal", "corpus", "payant"],
    language: "wo",
    version: "3.0.0",
    ownerId: "usr_002",   // Fatou
    visibility: "public",
    price: 8000,
    dataType: "audio",
    taskType: "transcription",
    totalFiles: 2400,
    annotatedFiles: 2400,
    sizeMb: 8192.0,
    labelSchema: LABELS_AUDIO_TRANSCRIPTION,
    taskCount: 0,
    annotationProgress: 100,
    status: "completed",
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2024-10-15"),
    completedAt: new Date("2024-10-15"),
    members: [],
  },

  {
    id: "ds_011",
    title: "ecommerce_abidjan_listings",
    description: "22 000 annonces e-commerce collectées à Abidjan (Jumia, Facebook Marketplace, groupes WhatsApp). Catégories, prix, descriptions. Utile pour tout modèle de pricing ou classification produit.",
    tags: ["e-commerce", "abidjan", "côte-d-ivoire", "pricing"],
    language: "fr",
    version: "1.1.0",
    ownerId: "usr_005",   // Aminata
    visibility: "public",
    price: 0,
    dataType: "csv",
    taskType: "classification",
    totalFiles: 22000,
    annotatedFiles: 14300,
    sizeMb: 43.5,
    labelSchema: [],
    taskCount: 3,
    annotationProgress: 65,
    status: "active",
    createdAt: new Date("2024-11-20"),
    updatedAt: daysAgo(4),
    completedAt: undefined,
    members: [],
  },

  {
    id: "ds_012",
    title: "ner_annonces_telecom_mali",
    description: "Annonces de vente de téléphones collectées à Bamako et Sikasso. Entités annotées : marque, modèle, prix, lieu, état. En cours de complétion.",
    tags: ["NER", "mali", "bamako", "télécom"],
    language: "fr",
    version: "1.0.0",
    ownerId: "usr_006",   // Moussa
    visibility: "public",
    price: 0,
    dataType: "text",
    taskType: "ner",
    totalFiles: 4500,
    annotatedFiles: 900,
    sizeMb: 7.3,
    labelSchema: LABELS_NER_TELECOM,
    taskCount: 2,
    annotationProgress: 20,
    status: "active",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(6),
    completedAt: undefined,
    members: [],
  },
]

// ─────────────────────────────────────────────────────────────
// TASKS  (7 tâches assignées à Rid Dev)
// ─────────────────────────────────────────────────────────────

export const MOCK_TASKS: MockTask[] = [
  {
    id: "task_001",
    datasetId: "ds_001",
    title: "Détection objets – smartphones batch2 (tranche A)",
    assignedTo: ["usr_001", "usr_003"],
    status: "in_progress",
    priority: "high",
    totalItems: 200,
    completedItems: 140,
    dueAt: daysFromNow(1),
    createdAt: daysAgo(7),
    instructions: "Entourer chaque composant visible avec une bounding box. Labelliser systématiquement les rayures même petites. Ignorer si qualité photo insuffisante (floue).",
  },
  {
    id: "task_002",
    datasetId: "ds_002",
    title: "Classification texte – annonces Cotonou",
    assignedTo: ["usr_001", "usr_003", "usr_004"],
    status: "in_progress",
    priority: "normal",
    totalItems: 1200,
    completedItems: 820,
    dueAt: daysFromNow(4),
    createdAt: daysAgo(10),
    instructions: "Classer chaque annonce selon la cohérence du prix avec le modèle déclaré. Prix correct = dans la fourchette marché ±15%.",
  },
  {
    id: "task_003",
    datasetId: "ds_005",
    title: "Transcription audio – corpus Fon vol.1",
    assignedTo: ["usr_001"],
    status: "in_progress",
    priority: "normal",
    totalItems: 80,
    completedItems: 30,
    dueAt: daysFromNow(7),
    createdAt: daysAgo(5),
    instructions: "Transcrire mot à mot. Indiquer [bruit] ou [inaudible] si nécessaire. Ne pas corriger la grammaire.",
  },
  {
    id: "task_004",
    datasetId: "ds_002",
    title: "Validation prix – marketplace Afrique",
    assignedTo: ["usr_001"],
    status: "blocked",
    priority: "urgent",
    totalItems: 500,
    completedItems: 0,
    dueAt: daysFromNow(2),
    createdAt: daysAgo(1),
    instructions: "En attente de la mise à jour du référentiel de prix. Tâche bloquée jusqu'à nouveau ordre.",
  },
  {
    id: "task_005",
    datasetId: "ds_004",
    title: "NER – annonces Dakar (lot 1)",
    assignedTo: ["usr_001", "usr_004"],
    status: "pending",
    priority: "low",
    totalItems: 600,
    completedItems: 0,
    dueAt: daysFromNow(14),
    createdAt: daysAgo(2),
    instructions: "Annoter les entités : MARQUE, MODELE, PRIX, LIEU, ETAT. Un token peut avoir plusieurs labels.",
  },
  {
    id: "task_006",
    datasetId: "ds_001",
    title: "Révision annotations batch2 (tranche A)",
    assignedTo: ["usr_005"],   // Aminata = réviseur
    status: "pending",
    priority: "normal",
    totalItems: 140,
    completedItems: 0,
    dueAt: daysFromNow(5),
    createdAt: daysAgo(1),
    instructions: "Valider ou rejeter les 140 annotations soumises. Critère de rejet : bounding box chevauchant >30% une zone incorrecte.",
  },
  {
    id: "task_007",
    datasetId: "ds_004",
    title: "Sentiment – avis Facebook Abidjan (lot 1)",
    assignedTo: ["usr_001", "usr_006"],
    status: "pending",
    priority: "normal",
    totalItems: 500,
    completedItems: 255,
    dueAt: daysFromNow(10),
    createdAt: daysAgo(7),
    instructions: "Classifier le sentiment global. En cas de doute entre Positif/Mixte, privilégier Mixte.",
  },
]

// ─────────────────────────────────────────────────────────────
// ANNOTATIONS  (échantillon de 10)
// ─────────────────────────────────────────────────────────────

export const MOCK_ANNOTATIONS: MockAnnotation[] = [
  {
    id: "ann_001",
    datasetId: "ds_001",
    taskId: "task_001",
    fileIndex: 1,
    annotatedBy: "usr_001",
    status: "validated",
    labels: [
      { labelId: "lbl_001", bbox: { x: 0.18, y: 0.12, w: 0.36, h: 0.62 }, confidence: 0.95 },
      { labelId: "lbl_002", bbox: { x: 0.60, y: 0.28, w: 0.16, h: 0.26 }, confidence: 0.88 },
    ],
    createdAt: hoursAgo(48),
    reviewedAt: hoursAgo(24),
    reviewedBy: "usr_005",
  },
  {
    id: "ann_002",
    datasetId: "ds_001",
    taskId: "task_001",
    fileIndex: 2,
    annotatedBy: "usr_001",
    status: "rejected",
    labels: [
      { labelId: "lbl_001", bbox: { x: 0.10, y: 0.05, w: 0.80, h: 0.90 }, confidence: 0.40 },
    ],
    createdAt: hoursAgo(47),
    reviewedAt: hoursAgo(23),
    reviewedBy: "usr_005",
    note: "Bounding box trop large, ne correspond pas à l'écran uniquement.",
  },
  {
    id: "ann_003",
    datasetId: "ds_001",
    taskId: "task_001",
    fileIndex: 3,
    annotatedBy: "usr_003",
    status: "validated",
    labels: [
      { labelId: "lbl_001", bbox: { x: 0.20, y: 0.15, w: 0.34, h: 0.58 } },
      { labelId: "lbl_006", bbox: { x: 0.35, y: 0.40, w: 0.08, h: 0.06 } },
    ],
    createdAt: hoursAgo(36),
    reviewedAt: hoursAgo(20),
    reviewedBy: "usr_005",
  },
  {
    id: "ann_004",
    datasetId: "ds_002",
    taskId: "task_002",
    fileIndex: 100,
    annotatedBy: "usr_001",
    status: "validated",
    labels: [{ labelId: "lbl_041" }],   // Prix suspect
    createdAt: hoursAgo(12),
    reviewedAt: hoursAgo(6),
    reviewedBy: "usr_005",
  },
  {
    id: "ann_005",
    datasetId: "ds_002",
    taskId: "task_002",
    fileIndex: 101,
    annotatedBy: "usr_001",
    status: "pending",
    labels: [{ labelId: "lbl_040" }],   // Prix correct
    createdAt: hoursAgo(2),
  },
  {
    id: "ann_006",
    datasetId: "ds_005",
    taskId: "task_003",
    fileIndex: 1,
    annotatedBy: "usr_001",
    status: "validated",
    labels: [{ labelId: "lbl_030" }],   // Parole
    createdAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    reviewedBy: "usr_005",
    note: "Bonne qualité audio, transcription complète.",
  },
]

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS  (pour Rid Dev, usr_001)
// ─────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif_001",
    userId: "usr_001",
    type: "annotation_rejected",
    title: "Annotation rejetée",
    message: "Aminata Diallo a rejeté 1 annotation dans phones_images_batch2. Motif : bounding box incorrecte.",
    read: false,
    createdAt: hoursAgo(23),
    link: "/annotate/ds_001/task_001/2",
  },
  {
    id: "notif_002",
    userId: "usr_001",
    type: "task_assigned",
    title: "Nouvelle tâche assignée",
    message: "Tu as été assigné à la tâche 'Validation prix – marketplace Afrique' (urgente, échéance dans 2 jours).",
    read: false,
    createdAt: daysAgo(1),
    link: "/tasks/task_004",
  },
  {
    id: "notif_003",
    userId: "usr_001",
    type: "dataset_shared",
    title: "Dataset accédé",
    message: "Kofi Boateng a accédé à ton dataset produits_telecom_dakar depuis la marketplace.",
    read: false,
    createdAt: hoursAgo(38),
    link: "/datasets/ds_003",
  },
  {
    id: "notif_004",
    userId: "usr_001",
    type: "payment_ready",
    title: "Paiement disponible",
    message: "47 800 F CFA sont disponibles pour retrait sur ton compte MTN MoMo.",
    read: true,
    createdAt: daysAgo(3),
    link: "/profile/earnings",
  },
  {
    id: "notif_005",
    userId: "usr_001",
    type: "new_member",
    title: "Nouveau collaborateur",
    message: "Jean Akpovi a rejoint ton équipe Équipe Cotonou.",
    read: true,
    createdAt: daysAgo(4),
    link: "/collaborators",
  },
  {
    id: "notif_006",
    userId: "usr_001",
    type: "annotation_validated",
    title: "Annotations validées",
    message: "47 de tes annotations dans phones_images_batch2 ont été validées par Aminata.",
    read: true,
    createdAt: hoursAgo(12),
    link: "/datasets/ds_001",
  },
]

// ─────────────────────────────────────────────────────────────
// STATS GLOBALES  (pour le dashboard home)
// ─────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  annotationsToday: 284,
  annotationsTodayDelta: 18,           // % vs hier
  tasksInProgress: 7,
  tasksUrgent: 3,
  totalDatasets: 12,
  datasetsShared: 4,
  earningsThisMonth: 47800,
  earningsDelta: 12,                   // % vs mois dernier
  accuracyGlobal: 91,
  interAnnotatorAgreement: 78,
  autoValidationRate: 63,
  rejectionRate: 4,
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD  (top 5, ce mois)
// ─────────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD = [
  { userId: "usr_002", rank: 1, annotationsThisMonth: 5480, accuracy: 94, badge: "Top annotateur" },
  { userId: "usr_003", rank: 2, annotationsThisMonth: 3200, accuracy: 89, badge: "Régularité" },
  { userId: "usr_004", rank: 3, annotationsThisMonth: 2840, accuracy: 92, badge: null },
  { userId: "usr_001", rank: 4, annotationsThisMonth: 4820, accuracy: 91, badge: null },  // current user
  { userId: "usr_005", rank: 5, annotationsThisMonth: 1120, accuracy: 88, badge: null },
]

// ─────────────────────────────────────────────────────────────
// HELPERS DE LOOKUP  (pour éviter les .find() partout)
// ─────────────────────────────────────────────────────────────

export const getUserById = (id: string) =>
  MOCK_USERS.find((u) => u.id === id)

export const getDatasetById = (id: string) =>
  MOCK_DATASETS.find((d) => d.id === id)

export const getTasksByDataset = (datasetId: string) =>
  MOCK_TASKS.filter((t) => t.datasetId === datasetId)

export const getTasksByUser = (userId: string) =>
  MOCK_TASKS.filter((t) => t.assignedTo.includes(userId))

export const getAnnotationsByTask = (taskId: string) =>
  MOCK_ANNOTATIONS.filter((a) => a.taskId === taskId)

export const getUnreadNotifications = (userId: string) =>
  MOCK_NOTIFICATIONS.filter((n) => n.userId === userId && !n.read)

/** Datasets que l'utilisateur peut voir (propres + accès explicite + public) */
export const getAccessibleDatasets = (userId: string): Dataset[] =>
  MOCK_DATASETS.filter(
    (d) =>
      d.ownerId === userId ||
      d.visibility === "public" ||
      d.members.some((m) => m.userId === userId) ||
      (d.visibility === "team" &&
        MOCK_TEAMS.some(
          (t) =>
            t.memberIds.includes(userId) &&
            t.memberIds.includes(d.ownerId)
        ))
  )

/** Datasets appartenant à l'utilisateur */
export const getMyDatasets = (userId: string): Dataset[] =>
  MOCK_DATASETS.filter((d) => d.ownerId === userId)

/** Datasets publics (marketplace) */
export const getPublicDatasets = (): Dataset[] =>
  MOCK_DATASETS.filter((d) => d.visibility === "public")


export const MOCK_ANNOTATION_SESSIONS: AnnotationSession[] = [

  // Session solo en cours — images batch2
  {
    id: "sess_001",
    datasetId: "ds_001",
    datasetTitle: "phones_images_batch2",
    datasetType: "image",
    taskType: "classification",
    taskName: "Classification",
    labels: [
      { id: "l1", name: "Bon état",    color: "#22c55e" },
      { id: "l2", name: "État moyen",  color: "#f97316" },
      { id: "l3", name: "Mauvais état",color: "#ef4444" },
    ],
    status: "in_progress",
    allowMultiple: false,
    allowSkip: true,
    createdBy: "usr_001",
    createdAt: daysAgo(3),
    assignedTo: [],               // solo
    totalElements: 200,
    completedElements: 140,
    dueAt: daysFromNow(1),
  },

  // Session solo en cours — audio
  {
    id: "sess_002",
    datasetId: "ds_005",
    datasetTitle: "audio_beninois_v1",
    datasetType: "audio",
    taskType: "transcription",
    taskName: "Transcription",
    labels: [],
    status: "in_progress",
    allowMultiple: false,
    allowSkip: true,
    createdBy: "usr_001",
    createdAt: daysAgo(5),
    assignedTo: [],               // solo
    totalElements: 80,
    completedElements: 30,
  },

  // Session déléguée à Kofi + Aminata — CSV
  {
    id: "sess_003",
    datasetId: "ds_002",
    datasetTitle: "smartphone_listings_v3",
    datasetType: "csv",
    taskType: "classification",
    taskName: "Classification de lignes",
    labels: [
      { id: "l4", name: "Prix correct",   color: "#22c55e" },
      { id: "l5", name: "Prix suspect",   color: "#ef4444" },
      { id: "l6", name: "Prix incomplet", color: "#f59e0b" },
    ],
    status: "in_progress",
    allowMultiple: false,
    allowSkip: false,
    createdBy: "usr_001",
    createdAt: daysAgo(2),
    assignedTo: ["usr_004", "usr_005"],
    totalElements: 1200,
    completedElements: 820,
    dueAt: daysFromNow(4),
  },

  // Session terminée
  {
    id: "sess_004",
    datasetId: "ds_003",
    datasetTitle: "produits_telecom_dakar",
    datasetType: "json",
    taskType: "ner",
    taskName: "NER",
    labels: [
      { id: "l7", name: "MARQUE", color: "#3b82f6" },
      { id: "l8", name: "PRIX",   color: "#22c55e" },
      { id: "l9", name: "LIEU",   color: "#f97316" },
    ],
    status: "completed",
    allowMultiple: true,
    allowSkip: false,
    createdBy: "usr_001",
    createdAt: daysAgo(20),
    assignedTo: [],
    totalElements: 400,
    completedElements: 400,
  },

  // ── Sessions ASSIGNÉES à Rid par d'autres owners ──────────

  // Assignée par Fatou (usr_002)
  {
    id: "sess_005",
    datasetId: "ds_008",
    datasetTitle: "phone_defects_detection_dataset",
    datasetType: "image",
    taskType: "bounding_box",
    taskName: "Bounding Box",
    labels: [
      { id: "l10", name: "Écran",   color: "#3b82f6" },
      { id: "l11", name: "Rayure",  color: "#ef4444" },
      { id: "l12", name: "Caméra",  color: "#22c55e" },
    ],
    status: "pending",
    allowMultiple: true,
    allowSkip: true,
    createdBy: "usr_002",          // Fatou
    createdAt: hoursAgo(6),
    assignedTo: ["usr_001"],
    totalElements: 150,
    completedElements: 0,
    dueAt: daysFromNow(3),
  },

  // Assignée par Aminata (usr_005)
  {
    id: "sess_006",
    datasetId: "ds_011",
    datasetTitle: "ecommerce_abidjan_listings",
    datasetType: "csv",
    taskType: "sentiment",
    taskName: "Sentiment",
    labels: [
      { id: "l13", name: "Positif", color: "#22c55e" },
      { id: "l14", name: "Négatif", color: "#ef4444" },
      { id: "l15", name: "Neutre",  color: "#888780" },
    ],
    status: "pending",
    allowMultiple: false,
    allowSkip: true,
    createdBy: "usr_005",          // Aminata
    createdAt: daysAgo(1),
    assignedTo: ["usr_001"],
    totalElements: 300,
    completedElements: 0,
  },
]

// ── Helpers ──────────────────────────────────────────────────

/** Sessions que l'utilisateur doit annoter lui-même (solo ou assignées à lui) */
export const getMyAnnotationSessions = (userId: string): AnnotationSession[] =>
  MOCK_ANNOTATION_SESSIONS.filter(
    (s) =>
      (s.createdBy === userId && s.assignedTo.length === 0) ||
      s.assignedTo.includes(userId)
  )

/** Sessions créées par l'utilisateur et déléguées à d'autres */
export const getDelegatedSessions = (userId: string): AnnotationSession[] =>
  MOCK_ANNOTATION_SESSIONS.filter(
    (s) => s.createdBy === userId && s.assignedTo.length > 0
  )

/** Sessions en cours pour un utilisateur */
export const getActiveSessionsForUser = (userId: string): AnnotationSession[] =>
  getMyAnnotationSessions(userId).filter(
    (s) => s.status === "in_progress" || s.status === "pending"
  )