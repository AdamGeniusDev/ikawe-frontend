import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SettingsTab =
  | 'profil'
  | 'annotation'
  | 'notifications'
  | 'stockage'
  | 'securite'

export interface ProfileState {
  fullName: string
  email: string
  language: string
  timezone: string
}

/**
 * Les valeurs de shortcuts correspondent aux valeurs réelles de `e.key`
 * (et non des labels visuels). La conversion visuelle se fait dans ShortcutsPanel.
 *
 * Référence e.key :
 *   Entrée    → 'Enter'
 *   Suppr     → 'Delete'
 *   Espace    → ' '
 *   Flèche ←  → 'ArrowLeft'
 *   Flèche →  → 'ArrowRight'
 */
export type ShortcutKey = keyof AnnotationState['shortcuts']

export interface AnnotationState {
  doubleValidation: boolean
  mandatoryReview: boolean
  consensusMode: boolean
  enabledLanguages: string[]
  shortcuts: {
    validate: string
    next: string
    prev: string
    skip: string
    openHelp: string
  }
}

export interface NotificationsState {
  email: {
    newTaskAssigned: boolean
    annotationRejected: boolean
    datasetValidated: boolean
    weeklyReport: boolean
  }
  inApp: {
    annotationComments: boolean
    deadlineReminders: boolean
    teamInvitations: boolean
  }
}

export interface StorageState {
  usedGb: number
  totalGb: number
  breakdown: {
    audio: number
    images: number
    text: number
  }
  retentionArchived: '90j' | '180j' | '1an' | 'illimitee'
  retentionDrafts: '30j' | '60j' | 'jamais'
}

export interface SecurityState {
  twoFactorEnabled: boolean
  activeSessions: number
  lastPasswordChange: string
  activityLog: Array<{
    id: string
    description: string
    timestamp: string
  }>
}

export interface SettingsStore {
  activeTab: SettingsTab

  profile: ProfileState
  annotation: AnnotationState
  notifications: NotificationsState
  storage: StorageState
  security: SecurityState

  // Actions
  setActiveTab: (tab: SettingsTab) => void

  updateProfile: (data: Partial<ProfileState>) => void
  updateAnnotation: (data: Partial<AnnotationState>) => void
  updateNotifications: (data: Partial<NotificationsState>) => void
  updateStorage: (data: Partial<StorageState>) => void
  updateSecurity: (data: Partial<SecurityState>) => void

  updateShortcut: (key: ShortcutKey, value: string) => void
  /** Remet les raccourcis à leurs valeurs par défaut */
  resetShortcuts: () => void

  toggleAnnotationLanguage: (lang: string) => void
  toggleEmailNotification: (key: keyof NotificationsState['email']) => void
  toggleInAppNotification: (key: keyof NotificationsState['inApp']) => void
}

// ─── Default shortcuts ────────────────────────────────────────────────────────
// Toujours les vraies valeurs e.key — jamais de labels français ici.

export const DEFAULT_SHORTCUTS: AnnotationState['shortcuts'] = {
  validate:  'Enter',
  next:      'ArrowRight',
  prev:      'ArrowLeft',
  skip:      ' ',
  openHelp:  '?',
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState = {
  activeTab: 'profil' as SettingsTab,

  profile: {
    fullName: 'Jean Dupont',
    email: 'jean@example.com',
    language: 'Français',
    timezone: 'Africa/Cotonou (UTC+1)',
  },

  annotation: {
    doubleValidation: true,
    mandatoryReview: true,
    consensusMode: false,
    enabledLanguages: ['Fon', 'Hausa'],
    shortcuts: { ...DEFAULT_SHORTCUTS },
  },

  notifications: {
    email: {
      newTaskAssigned: true,
      annotationRejected: true,
      datasetValidated: true,
      weeklyReport: false,
    },
    inApp: {
      annotationComments: true,
      deadlineReminders: true,
      teamInvitations: true,
    },
  },

  storage: {
    usedGb: 14.2,
    totalGb: 100,
    breakdown: {
      audio: 8.1,
      images: 4.3,
      text: 1.8,
    },
    retentionArchived: '90j' as const,
    retentionDrafts: '30j' as const,
  },

  security: {
    twoFactorEnabled: false,
    activeSessions: 2,
    lastPasswordChange: 'Il y a 3 mois',
    activityLog: [
      {
        id: '1',
        description: 'Connexion depuis Cotonou, BJ',
        timestamp: "Aujourd'hui, 09:14",
      },
      {
        id: '2',
        description: 'Export dataset "Fon-Audio-v2"',
        timestamp: 'Hier, 16:32',
      },
      {
        id: '3',
        description: 'Invitation envoyée à fatou@example.com',
        timestamp: 'Il y a 2 jours',
      },
    ],
  },
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveTab: (tab) => set({ activeTab: tab }),

      updateProfile: (data) =>
        set((state) => ({ profile: { ...state.profile, ...data } })),

      updateAnnotation: (data) =>
        set((state) => ({ annotation: { ...state.annotation, ...data } })),

      updateNotifications: (data) =>
        set((state) => ({
          notifications: { ...state.notifications, ...data },
        })),

      updateStorage: (data) =>
        set((state) => ({ storage: { ...state.storage, ...data } })),

      updateSecurity: (data) =>
        set((state) => ({ security: { ...state.security, ...data } })),

      updateShortcut: (key, value) =>
        set((state) => ({
          annotation: {
            ...state.annotation,
            shortcuts: {
              ...state.annotation.shortcuts,
              [key]: value,
            },
          },
        })),

      resetShortcuts: () =>
        set((state) => ({
          annotation: {
            ...state.annotation,
            shortcuts: { ...DEFAULT_SHORTCUTS },
          },
        })),

      toggleAnnotationLanguage: (lang) =>
        set((state) => {
          const langs = state.annotation.enabledLanguages
          return {
            annotation: {
              ...state.annotation,
              enabledLanguages: langs.includes(lang)
                ? langs.filter((l) => l !== lang)
                : [...langs, lang],
            },
          }
        }),

      toggleEmailNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            email: {
              ...state.notifications.email,
              [key]: !state.notifications.email[key],
            },
          },
        })),

      toggleInAppNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            inApp: {
              ...state.notifications.inApp,
              [key]: !state.notifications.inApp[key],
            },
          },
        })),
    }),
    {
      name: 'ikawe-settings',
      // Deep merge : les clés présentes dans initialState mais absentes du
      // localStorage (ajout de nouvelles clés comme 'openHelp') sont comblées
      // par les valeurs par défaut. Sans ça, une ancienne version persistée
      // peut avoir des champs undefined qui crashent displayKey et le hook.
      merge: (persisted, current) => {
        const p = persisted as typeof current
        return {
          ...current,
          ...p,
          annotation: {
            ...current.annotation,
            ...(p.annotation ?? {}),
            shortcuts: {
              ...DEFAULT_SHORTCUTS,
              ...(p.annotation?.shortcuts ?? {}),
            },
          },
        }
      },
    }
  )
)
