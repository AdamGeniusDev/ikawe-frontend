'use client'
import { useState } from 'react'
import ProfileSettings from '@/components/settings/ProfileSettings'
import AnnotationSettings from '@/components/settings/AnnotationSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import StorageSettings from '@/components/settings/StorageSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'
import {
  User, PencilLine, Bell, HardDrive, ShieldCheck,
  ArrowLeft, ExternalLink, ArrowRight,
  UserMinus, Trash2, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    id: 'profil',
    label: 'Informations personnelles',
    shortLabel: 'Profil',
    description: "Nom, photo, email et langues d'annotation déclarées",
    icon: User,
    color: 'bg-amber-50 text-amber-700',
    component: <ProfileSettings />,
  },
  {
    id: 'securite',
    label: 'Connexion & sécurité',
    shortLabel: 'Sécurité',
    description: 'Mot de passe, sessions actives et double authentification',
    icon: ShieldCheck,
    color: 'bg-blue-50 text-blue-700',
    component: <SecuritySettings />,
  },
  {
    id: 'annotation',
    label: "Préférences d'annotation",
    shortLabel: 'Annotation',
    description: 'Raccourcis clavier, workflow par défaut et validations auto',
    icon: PencilLine,
    color: 'bg-teal-50 text-teal-700',
    component: <AnnotationSettings />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    shortLabel: 'Notifs',
    description: "Alertes email, in-app et rappels d'assignation de tâches",
    icon: Bell,
    color: 'bg-amber-50 text-amber-700',
    component: <NotificationSettings />,
  },
  {
    id: 'stockage',
    label: 'Stockage & fichiers',
    shortLabel: 'Stockage',
    description: 'Quota utilisé, politique de rétention des données',
    icon: HardDrive,
    color: 'bg-purple-50 text-purple-700',
    component: <StorageSettings />,
  },
] as const

type SectionId = (typeof SECTIONS)[number]['id']


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)

  const activeData = SECTIONS.find((s) => s.id === activeSection)

  const handleSelect = (id: SectionId) => setActiveSection(id)
  const handleBack = () => setActiveSection(null)

  
  if (!activeSection) {
    return (
      <div className="flex flex-col w-full min-h-screen dark:bg-zinc-950">
        <div className="px-8 py-5 border-b bg-white dark:bg-zinc-900">
          <h1 className="font-semibold text-2xl text-secondary">Paramètres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez votre compte et vos préférences
          </p>
          <div className="flex items-center gap-4 mt-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-sm font-semibold text-amber-800 border-2 border-amber-200 shrink-0">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Jean Dupont</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                jeandupont@example.com
              </p>
            </div>
            <button className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors">
              <ExternalLink size={12} />
              Voir le profil
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {SECTIONS.map(({ id, label, description, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="group text-left p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-4', color)}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={12} />
                  Modifier
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-10 mb-5 max-w-4xl">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-medium text-zinc-400 tracking-widest">
              Zone critique - Attention
            </span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            {[
              { icon: UserMinus, label: 'Désactiver le compte', desc: 'Suspendre temporairement votre accès' },
              { icon: Trash2, label: 'Supprimer le compte', desc: 'Effacement définitif de vos données' },
            ].map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                className="text-left p-5 bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 rounded-2xl hover:border-red-200 dark:hover:border-red-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <Icon size={16} className="text-red-500" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Detail view ───────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full min-h-screen dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-white dark:bg-zinc-900">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Paramètres
        </button>
        <ChevronRight size={13} className="text-zinc-300" />
        <span className="text-sm font-medium text-foreground">{activeData?.label}</span>
      </div>

      {/* Content */}
      <main className="flex-1 px-8 py-7 pb-24 w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">{activeData?.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">{activeData?.description}</p>
        </div>

        <div className="h-px bg-linear-to-r from-amber-400 via-amber-200 to-transparent dark:from-amber-600 dark:via-amber-900 mb-7" />

        <div className="w-full">
          {activeData?.component ?? (
            <p className="text-sm text-muted-foreground">Section en cours de développement.</p>
          )}
        </div>
      </main>

      <nav
        aria-label="Navigation des paramètres"
        className="settings-nav"
      >
        <div className="flex items-center gap-2 px-2 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg shadow-black/5">

          {SECTIONS.map(({ id, shortLabel, icon: Icon }) => {
            const isActive = activeSection === id
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                aria-label={shortLabel}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-150',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                <Icon size={18} strokeWidth={1.75} />

                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
                    'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
                    'text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-sm',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
                    'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
                    'after:border-4 after:border-transparent after:border-t-zinc-900 dark:after:border-t-zinc-100',
                  )}
                >
                  {shortLabel}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}