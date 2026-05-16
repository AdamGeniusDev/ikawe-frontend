'use client'

import { useSettingsStore } from '@/store/settings.store'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { NotificationsState } from '@/store/settings.store'
import { Mail, Bell, LucideIcon } from 'lucide-react'

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {children}
    </div>
  )
}

function CardHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
      <Icon size={13} className="text-zinc-400" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
    </div>
  )
}

function SwitchRow({
  id,
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  desc?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-6">
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
          {label}
        </Label>
        {desc && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-amber-500"
      />
    </div>
  )
}

export default function NotificationSettings() {
  const { notifications, toggleEmailNotification, toggleInAppNotification } = useSettingsStore()

  const emailItems: {
    key: keyof NotificationsState['email']
    label: string
    desc?: string
  }[] = [
    { key: 'newTaskAssigned', label: 'Nouvelle tâche assignée' },
    {
      key: 'annotationRejected',
      label: 'Annotation rejetée',
      desc: 'Quand un réviseur rejette votre annotation',
    },
    {
      key: 'datasetValidated',
      label: 'Dataset validé',
      desc: 'Quand un dataset passe en statut validé',
    },
    {
      key: 'weeklyReport',
      label: 'Rapport hebdomadaire',
      desc: 'Résumé de vos activités chaque lundi',
    },
  ]

  const inAppItems: {
    key: keyof NotificationsState['inApp']
    label: string
    desc?: string
  }[] = [
    { key: 'annotationComments', label: 'Commentaires sur annotations' },
    {
      key: 'deadlineReminders',
      label: 'Rappels de délai',
      desc: "24h avant la date limite d'une tâche",
    },
    { key: 'teamInvitations', label: "Invitations d'équipe" },
  ]

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard>
        <CardHeader title="Notifications e-mail" icon={Mail} />
        {emailItems.map(({ key, label, desc }) => (
          <SwitchRow
            key={key}
            id={`email-${key}`}
            label={label}
            desc={desc}
            checked={notifications.email[key]}
            onCheckedChange={() => toggleEmailNotification(key)}
          />
        ))}
      </SettingsCard>

      <SettingsCard>
        <CardHeader title="Notifications in-app" icon={Bell} />
        {inAppItems.map(({ key, label, desc }) => (
          <SwitchRow
            key={key}
            id={`inapp-${key}`}
            label={label}
            desc={desc}
            checked={notifications.inApp[key]}
            onCheckedChange={() => toggleInAppNotification(key)}
          />
        ))}
      </SettingsCard>
    </div>
  )
}