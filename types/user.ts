// types/user.ts
// SOURCE DE VÉRITÉ pour tout ce qui concerne un utilisateur.
//
// Deux niveaux de rôle dans Ikawe :
//   PlatformRole   → droits globaux sur la plateforme (défini par l'admin système)
//   TeamRole       → droits dans une équipe (défini par le team owner)
//   BatchRole      → droits sur un batch précis (résolu depuis job.pool via distributePool())
//
// Flux de session :
//   Login → JWT signé par le backend → stocké dans cookie httpOnly
//   → useSession() expose SessionUser partout dans l'app (Next.js / Clerk / NextAuth)
//   → Pour les données complètes : GET /api/me → User
//
// Système de collaboration :
//   Un user peut inviter n'importe quel autre user à collaborer.
//   La cible doit accepter → CollaborationRequest passe en 'accepted'.
//   Seulement après, les deux users peuvent se retrouver dans une même équipe.
//   "Collaborateurs disponibles" pour une équipe =
//     collaboratorIds du user courant MINUS membres déjà dans cette équipe.


// ─────────────────────────────────────────────────────────────────────────────
// RÔLES
// ─────────────────────────────────────────────────────────────────────────────

// Niveau 1 — Rôle plateforme
// Défini à la création du compte ('user' par défaut) ou promu par un admin.
// L'utilisateur ne peut pas se l'attribuer lui-même.
// Inclus dans le JWT → disponible dans SessionUser.
//
//   admin → accès à tout : users, settings, billing, toutes les équipes
//   user  → rôle par défaut à l'inscription

export type PlatformRole = 'admin' | 'user'

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  admin: 'Administrateur',
  user:  'Utilisateur',
}

// Niveau 2 — Rôle dans une équipe
// Défini par le team_owner quand il ajoute un collaborateur à son équipe.
// Stocké dans TeamMembership (pas directement sur User).
// Un même utilisateur peut avoir des rôles différents dans des équipes différentes.
//
//   team_owner  → crée datasets + jobs, gère membres, supprime l'équipe
//   team_admin  → gère membres + datasets, ne peut pas supprimer l'équipe
//   annotator   → annote les batches qui lui sont assignés
//   reviewer    → révise et valide/rejette les annotations
//   viewer      → lecture seule, ne peut pas annoter

export type TeamRole = 'team_owner' | 'team_admin' | 'annotator' | 'reviewer' | 'viewer'

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  team_owner: 'Propriétaire',
  team_admin: 'Administrateur',
  annotator:  'Annotateur',
  reviewer:   'Réviseur',
  viewer:     'Observateur',
}

// Niveau 3 — Rôle sur un batch
// Résolu depuis job.pool via distributePool() / resolveBatchUserRole().
// Peut avoir un roleOverride par batch (ex : quelqu'un est annotator dans l'équipe
// mais reviewer sur ce batch précis).

export type BatchRole = 'annotator' | 'reviewer'


// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION
// ─────────────────────────────────────────────────────────────────────────────
// Un user doit d'abord inviter un autre user à collaborer.
// La cible accepte ou refuse. Une fois acceptée, les deux users sont
// collaborateurs et peuvent être ajoutés aux mêmes équipes.
//
// CollaborationRequest est une entité séparée — elle n'est PAS stockée sur User.
// Accessible via GET /api/me/collaboration-requests

export type CollaborationStatus = 'pending' | 'accepted' | 'declined'

export interface CollaborationRequest {
  id:          string
  senderId:    string              // userId de celui qui invite
  receiverId:  string              // userId de la cible
  status:      CollaborationStatus
  sentAt:      string
  resolvedAt?: string              // absent si encore en attente
}


// ─────────────────────────────────────────────────────────────────────────────
// APPARTENANCE À UNE ÉQUIPE
// ─────────────────────────────────────────────────────────────────────────────
// Représente le lien entre un User et une Team, avec son rôle dans cette équipe.
// Un User peut appartenir à plusieurs équipes avec des rôles différents.
// On ne peut ajouter à une équipe que des collaborateurs confirmés.

export interface TeamMembership {
  teamId:   string
  teamName: string   // dénormalisé pour affichage sans re-fetch
  role:     TeamRole
  joinedAt: string
}


// ─────────────────────────────────────────────────────────────────────────────
// PRÉFÉRENCES DE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
// Définit quand et comment l'utilisateur veut être notifié.
// Stocké en base, modifiable dans /settings/notifications.

export interface NotificationPreferences {
  // ── Notifications e-mail ──────────────────────────────────────────────────
  onBatchAssigned:        boolean   // une tâche m'a été assignée
  onAnnotationRejected:   boolean   // mes annotations ont été rejetées
  onJobCompleted:         boolean   // un job que j'ai créé est terminé
  onDatasetValidated:     boolean   // un dataset passe en statut validé
  weeklyReport:           boolean   // résumé d'activité chaque lundi

  // ── Notifications in-app ──────────────────────────────────────────────────
  onAnnotationComment:    boolean   // commentaire sur une de mes annotations
  onDeadlineReminder:     boolean   // rappel 24h avant la date limite d'une tâche
  onCollaborationRequest: boolean   // quelqu'un m'invite à collaborer
}


// ─────────────────────────────────────────────────────────────────────────────
// PRÉFÉRENCES D'ANNOTATION
// ─────────────────────────────────────────────────────────────────────────────
// Workflow et comportement de l'interface d'annotation.
// Stocké en base, modifiable dans /settings/annotation.

export interface AnnotationShortcuts {
  validateAnnotation: string   // défaut : 'Enter'
  nextItem:           string   // défaut : 'ArrowRight'
  previousItem:       string   // défaut : 'ArrowLeft'
  markUncertain:      string   // défaut : ' ' (espace)
  openShortcuts:      string   // défaut : '?'
}

export interface AnnotationPreferences {
  // Flux de travail
  doubleValidation: boolean   // chaque annotation validée par 2 annotateurs
  mandatoryReview:  boolean   // les annotations passent par un réviseur avant validation
  consensusMode:    boolean   // accord majoritaire requis pour valider

  // Langues africaines activées pour l'interface d'annotation
  activeLanguages:  string[]  // ex: ['fon', 'hausa'] — codes ISO 639-3

  // Raccourcis clavier personnalisés
  shortcuts:        AnnotationShortcuts
}


// ─────────────────────────────────────────────────────────────────────────────
// PRÉFÉRENCES DE STOCKAGE
// ─────────────────────────────────────────────────────────────────────────────
// Politique de conservation choisie par l'utilisateur.
// Le quota utilisé (Go) est calculé côté backend — jamais stocké ici.

export type RetentionDuration = '30d' | '60d' | '90d' | '180d' | 'never'

export interface StoragePreferences {
  archiveRetention: RetentionDuration   // durée avant suppression des datasets archivés
  draftRetention:   RetentionDuration   // durée avant suppression des brouillons inactifs
}


// ─────────────────────────────────────────────────────────────────────────────
// PRÉFÉRENCES UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

export type Theme    = 'light' | 'dark' | 'system'
export type Locale   = 'fr' | 'en'
export type Timezone = string   // chaîne IANA — ex: 'Africa/Cotonou', 'Europe/Paris'

export interface UserPreferences {
  // Onglet Profil
  theme:    Theme
  locale:   Locale
  timezone: Timezone

  // Onglet Notifications
  notifications: NotificationPreferences

  // Onglet Annotation
  annotation: AnnotationPreferences

  // Onglet Stockage
  storage: StoragePreferences
}


// ─────────────────────────────────────────────────────────────────────────────
// STATISTIQUES UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────
// Calculées côté backend et mises en cache.
// Affichées dans le profil et le dashboard.
// Lecture seule — jamais modifiable par l'utilisateur.

export interface UserStats {
  totalAnnotations: number   // nb total d'éléments annotés
  totalReviews:     number   // nb total d'annotations révisées
  accuracyRate:     number   // % d'annotations acceptées (0–100)
  activeStreak:     number   // jours consécutifs d'activité
  datasetsContrib:  number   // nb de datasets auxquels il a contribué
}




export interface User {
  // ── Identité ──────────────────────────────────────────────────────────────
  id:         string   // "usr_abc123" — ID universel, immuable
  email:      string
  name:       string   // nom complet affiché
  username?:  string   // identifiant unique lisible (ex: "kofi_boateng")
  avatarUrl?: string   // URL CDN — absent si pas de photo
  bio?:       string   // description courte optionnelle

  // ── Rôle plateforme ───────────────────────────────────────────────────────
  platformRole: PlatformRole   // 'user' par défaut, 'admin' sur promotion

  // ── Collaboration ─────────────────────────────────────────────────────────

  collaboratorIds: string[]

  // ── Appartenance aux équipes ──────────────────────────────────────────────
  // Uniquement des collaborateurs confirmés peuvent figurer ici.
  teamMemberships: TeamMembership[]

  // ── Sécurité (lecture seule — jamais modifiable directement par l'user) ───
  emailVerified:    boolean
  twoFactorEnabled: boolean
  lastLoginAt:      string

  // ── Préférences (modifiables dans /settings) ──────────────────────────────
  preferences: UserPreferences

  // ── Stats (calculées côté backend, lecture seule) ─────────────────────────
  stats?: UserStats

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: string
  updatedAt: string
}


// ─────────────────────────────────────────────────────────────────────────────
// SESSION USER — stocké en cookie/JWT côté client
// ─────────────────────────────────────────────────────────────────────────────


export interface SessionUser {
  id:           string
  email:        string
  name:         string
  avatarUrl?:   string
  platformRole: PlatformRole
}


// ─────────────────────────────────────────────────────────────────────────────
// AVATAR PROPS
// ─────────────────────────────────────────────────────────────────────────────
// Props calculées pour afficher un avatar n'importe où dans l'app.


export interface AvatarProps {
  initials:   string   // "KB" depuis "Kofi Boateng"
  color:      string   // couleur hex déterministe depuis l'id
  avatarUrl?: string   // photo de profil si disponible
}


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#06b6d4', '#3b82f6', '#ef4444',
  '#14b8a6', '#f59e0b',
]

// Couleur déterministe depuis un userId — même id → même couleur toujours
function hashColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Initiales depuis un nom complet
function nameToInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

// Calcule les AvatarProps depuis n'importe quel objet avec id + name.
// Utiliser partout où on affiche un avatar (RevisionEvent, BatchAssignCard, etc.)
export function getAvatarProps(user: {
  id:         string
  name:       string
  avatarUrl?: string
}): AvatarProps {
  return {
    initials:  nameToInitials(user.name),
    color:     hashColor(user.id),
    avatarUrl: user.avatarUrl,
  }
}

// Vérifie si un user peut créer un job sur un dataset appartenant à une équipe.
// → Tout user peut créer un job sur son propre dataset sans vérification.
// → Pour un dataset d'équipe, il faut être admin plateforme, team_owner
//   ou team_admin dans cette équipe spécifique.
export function canCreateJobOnTeamDataset(user: User, teamId: string): boolean {
  if (user.platformRole === 'admin') return true
  return user.teamMemberships.some(
    m => m.teamId === teamId && (m.role === 'team_owner' || m.role === 'team_admin')
  )
}

// Vérifie si un user peut réviser des annotations dans une équipe donnée.
// → Réserver l'interface de révision aux roles qui en ont la responsabilité.
export function canReviewInTeam(user: User, teamId: string): boolean {
  if (user.platformRole === 'admin') return true
  return user.teamMemberships.some(
    m => m.teamId === teamId &&
    (m.role === 'reviewer' || m.role === 'team_owner' || m.role === 'team_admin')
  )
}

// Retourne les collaborateurs confirmés d'un user qui ne sont pas encore
// membres de l'équipe donnée.
// Utiliser pour afficher "Collaborateurs disponibles" sur la page équipe.
export function getAvailableCollaborators(
  currentUser: User,
  allUsers: User[],
  teamId: string
): User[] {
  const alreadyInTeam = new Set(
    allUsers
      .filter(u => u.teamMemberships.some(m => m.teamId === teamId))
      .map(u => u.id)
  )
  return allUsers.filter(
    u => currentUser.collaboratorIds.includes(u.id) && !alreadyInTeam.has(u.id)
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// VALEURS PAR DÉFAUT
// ─────────────────────────────────────────────────────────────────────────────
// Utiliser à la création d'un nouveau compte pour initialiser les préférences.

export const DEFAULT_ANNOTATION_SHORTCUTS: AnnotationShortcuts = {
  validateAnnotation: 'Enter',
  nextItem:           'ArrowRight',
  previousItem:       'ArrowLeft',
  markUncertain:      ' ',
  openShortcuts:      '?',
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme:    'system',
  locale:   'fr',
  timezone: 'Africa/Abidjan',

  notifications: {
    onBatchAssigned:        true,
    onAnnotationRejected:   true,
    onJobCompleted:         true,
    onDatasetValidated:     true,
    weeklyReport:           false,
    onAnnotationComment:    true,
    onDeadlineReminder:     true,
    onCollaborationRequest: true,
  },

  annotation: {
    doubleValidation: false,
    mandatoryReview:  false,
    consensusMode:    false,
    activeLanguages:  [],
    shortcuts:        DEFAULT_ANNOTATION_SHORTCUTS,
  },

  storage: {
    archiveRetention: '90d',
    draftRetention:   '30d',
  },
}


// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
// Source unique pour tous les mocks qui ont besoin d'un utilisateur.

export const MOCK_USERS: User[] = [
  {
    id: 'user-owner', email: 'jean@example.com',
    name: 'Jean Dupont', username: 'jean_dupont',
    platformRole: 'user',
    collaboratorIds: ['user-kofi', 'user-aminata', 'user-marie', 'user-theo'],
    teamMemberships: [
      { teamId: 'team_001', teamName: 'Équipe Cotonou',         role: 'team_owner', joinedAt: '2024-01-16' },
      { teamId: 'team_002', teamName: 'Équipe West Africa NLP', role: 'team_owner', joinedAt: '2023-12-01' },
    ],
    emailVerified: true, twoFactorEnabled: false,
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'system', locale: 'fr', timezone: 'Africa/Cotonou',
      notifications: {
        onBatchAssigned: true,  onAnnotationRejected: true,
        onJobCompleted: true,   onDatasetValidated: true,
        weeklyReport: false,    onAnnotationComment: true,
        onDeadlineReminder: true, onCollaborationRequest: true,
      },
      annotation: {
        doubleValidation: true, mandatoryReview: true, consensusMode: false,
        activeLanguages: ['fon', 'hausa'],
        shortcuts: DEFAULT_ANNOTATION_SHORTCUTS,
      },
      storage: { archiveRetention: '90d', draftRetention: '30d' },
    },
    stats: { totalAnnotations: 4200, totalReviews: 0, accuracyRate: 94, activeStreak: 12, datasetsContrib: 6 },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-kofi', email: 'kofi@example.com',
    name: 'Kofi Boateng', username: 'kofi_boateng',
    platformRole: 'user',
    collaboratorIds: ['user-owner', 'user-aminata'],
    teamMemberships: [
      { teamId: 'team_001', teamName: 'Équipe Cotonou',         role: 'annotator', joinedAt: '2024-04-05' },
      { teamId: 'team_002', teamName: 'Équipe West Africa NLP', role: 'annotator', joinedAt: '2024-03-10' },
    ],
    emailVerified: true, twoFactorEnabled: false,
    lastLoginAt: '2026-05-18T14:30:00Z',
    preferences: {
      theme: 'dark', locale: 'fr', timezone: 'Africa/Accra',
      notifications: {
        onBatchAssigned: true,  onAnnotationRejected: true,
        onJobCompleted: false,  onDatasetValidated: true,
        weeklyReport: false,    onAnnotationComment: true,
        onDeadlineReminder: true, onCollaborationRequest: true,
      },
      annotation: {
        doubleValidation: false, mandatoryReview: true, consensusMode: false,
        activeLanguages: ['fon'],
        shortcuts: DEFAULT_ANNOTATION_SHORTCUTS,
      },
      storage: { archiveRetention: '60d', draftRetention: '30d' },
    },
    stats: { totalAnnotations: 2840, totalReviews: 0, accuracyRate: 88, activeStreak: 5, datasetsContrib: 3 },
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-05-18T14:30:00Z',
  },
  {
    id: 'user-aminata', email: 'aminata@example.com',
    name: 'Aminata Diallo', username: 'aminata_diallo',
    platformRole: 'user',
    collaboratorIds: ['user-owner', 'user-kofi'],
    teamMemberships: [
      { teamId: 'team_002', teamName: 'Équipe West Africa NLP', role: 'annotator', joinedAt: '2024-04-01' },
    ],
    emailVerified: true, twoFactorEnabled: false,
    lastLoginAt: '2026-05-17T09:00:00Z',
    preferences: {
      theme: 'light', locale: 'fr', timezone: 'Africa/Dakar',
      notifications: {
        onBatchAssigned: true,  onAnnotationRejected: true,
        onJobCompleted: false,  onDatasetValidated: false,
        weeklyReport: false,    onAnnotationComment: true,
        onDeadlineReminder: true, onCollaborationRequest: true,
      },
      annotation: {
        doubleValidation: false, mandatoryReview: false, consensusMode: false,
        activeLanguages: ['wolof'],
        shortcuts: DEFAULT_ANNOTATION_SHORTCUTS,
      },
      storage: { archiveRetention: '90d', draftRetention: '30d' },
    },
    stats: { totalAnnotations: 1120, totalReviews: 0, accuracyRate: 91, activeStreak: 3, datasetsContrib: 2 },
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-05-17T09:00:00Z',
  },
  {
    id: 'user-marie', email: 'marie@example.com',
    name: 'Marie Kone', username: 'marie_kone',
    platformRole: 'user',
    collaboratorIds: ['user-owner', 'user-theo'],
    teamMemberships: [
      { teamId: 'team_001', teamName: 'Équipe Cotonou',         role: 'reviewer', joinedAt: '2024-01-28' },
      { teamId: 'team_002', teamName: 'Équipe West Africa NLP', role: 'reviewer', joinedAt: '2024-03-25' },
    ],
    emailVerified: true, twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    preferences: {
      theme: 'system', locale: 'fr', timezone: 'Africa/Abidjan',
      notifications: {
        onBatchAssigned: false, onAnnotationRejected: false,
        onJobCompleted: true,   onDatasetValidated: true,
        weeklyReport: true,     onAnnotationComment: false,
        onDeadlineReminder: true, onCollaborationRequest: true,
      },
      annotation: {
        doubleValidation: true, mandatoryReview: true, consensusMode: false,
        activeLanguages: ['fon', 'hausa', 'yoruba'],
        shortcuts: DEFAULT_ANNOTATION_SHORTCUTS,
      },
      storage: { archiveRetention: '180d', draftRetention: '60d' },
    },
    stats: { totalAnnotations: 560, totalReviews: 3400, accuracyRate: 97, activeStreak: 20, datasetsContrib: 4 },
    createdAt: '2026-01-12T00:00:00Z', updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-theo', email: 'theo@example.com',
    name: 'Théo Comlan', username: 'theo_comlan',
    platformRole: 'user',
    collaboratorIds: ['user-owner', 'user-marie'],
    teamMemberships: [
      { teamId: 'team_001', teamName: 'Équipe Cotonou', role: 'annotator', joinedAt: '2024-02-20' },
    ],
    emailVerified: true, twoFactorEnabled: false,
    lastLoginAt: '2026-05-16T11:00:00Z',
    preferences: {
      theme: 'dark', locale: 'fr', timezone: 'Africa/Cotonou',
      notifications: {
        onBatchAssigned: true,  onAnnotationRejected: true,
        onJobCompleted: true,   onDatasetValidated: true,
        weeklyReport: false,    onAnnotationComment: true,
        onDeadlineReminder: true, onCollaborationRequest: true,
      },
      annotation: {
        doubleValidation: false, mandatoryReview: true, consensusMode: false,
        activeLanguages: ['fon', 'hausa'],
        shortcuts: DEFAULT_ANNOTATION_SHORTCUTS,
      },
      storage: { archiveRetention: '90d', draftRetention: '30d' },
    },
    stats: { totalAnnotations: 3200, totalReviews: 1200, accuracyRate: 93, activeStreak: 8, datasetsContrib: 5 },
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-05-16T11:00:00Z',
  },
]

// Accès rapide par ID
export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id)
}

// Utilisateur courant simulé — remplacer par useSession() en production
export const CURRENT_MOCK_USER: SessionUser = {
  id:           'user-owner',
  email:        'jean@example.com',
  name:         'Jean Dupont',
  platformRole: 'user',
}