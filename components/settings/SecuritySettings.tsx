'use client'

import { useSettingsStore } from '@/store/settings.store'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ShieldCheck, ShieldAlert, Monitor, KeyRound, Activity, LucideIcon } from 'lucide-react'

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {children}
    </div>
  )
}

function CardHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon: LucideIcon
}) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
      <Icon size={13} className="text-zinc-400" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
    </div>
  )
}

export default function SecuritySettings() {
  const { security, updateSecurity } = useSettingsStore()

  return (
    <div className="flex flex-col gap-5">
      {/* Auth */}
      <SettingsCard>
        <CardHeader title="Authentification" icon={ShieldCheck} />

        {/* 2FA */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 gap-6">
          <div className="flex items-center gap-3">
            {security.twoFactorEnabled ? (
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            )}
            <div>
              <Label
                htmlFor="2fa-switch"
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                Authentification à deux facteurs
              </Label>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Protéger le compte avec un code OTP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                security.twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {security.twoFactorEnabled ? 'Actif' : 'Inactif'}
            </span>
            <Switch
              id="2fa-switch"
              checked={security.twoFactorEnabled}
              onCheckedChange={(v) => updateSecurity({ twoFactorEnabled: v })}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        {/* Sessions */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 gap-6">
          <div className="flex items-center gap-3">
            <Monitor size={18} className="text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Sessions actives
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {security.activeSessions > 0
                  ? `${security.activeSessions} appareil${security.activeSessions > 1 ? 's' : ''} connecté${security.activeSessions > 1 ? 's' : ''}`
                  : 'Aucune session active'}
              </p>
            </div>
          </div>
          {security.activeSessions > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSecurity({ activeSessions: 0 })}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              Révoquer toutes
            </Button>
          )}
        </div>

        {/* Password */}
        <div className="flex items-center justify-between px-5 py-4 gap-6">
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Mot de passe
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Dernière modification : {security.lastPasswordChange}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Modifier
          </Button>
        </div>
      </SettingsCard>

      {/* Activity log */}
      <SettingsCard>
        <CardHeader title="Journal d'activité" icon={Activity} />
        {security.activityLog.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <div className="flex items-center gap-3">
              {/* Timeline dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  i === 0 ? 'bg-emerald-400' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {entry.description}
              </p>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 ml-4">
              {entry.timestamp}
            </p>
          </div>
        ))}
      </SettingsCard>
    </div>
  )
}