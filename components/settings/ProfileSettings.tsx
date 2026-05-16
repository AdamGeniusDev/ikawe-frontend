'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/store/settings.store'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Check, Camera } from 'lucide-react'

const LANGUAGES = ['Français', 'English', 'Fon', 'Hausa', 'Wolof', 'Bambara']
const TIMEZONES = [
  'Africa/Cotonou (UTC+1)',
  'Africa/Lagos (UTC+1)',
  'Africa/Dakar (UTC+0)',
  'Africa/Nairobi (UTC+3)',
  'UTC',
]

// ─── Shared primitives ────────────────────────────────────────────────────────

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {children}
    </div>
  )
}

function SettingsRow({
  label,
  desc,
  children,
}: {
  label: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
        {desc && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSettings() {
  const { profile, updateProfile } = useSettingsStore()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)

  const initials = form.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = () => {
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <SettingsCard>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="relative group">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-semibold text-lg select-none">
              {initials}
            </div>
            <button 
             aria-label="Changer la photo de profil"
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {form.fullName}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{form.email}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto text-xs">
            Changer la photo
          </Button>
        </div>
      </SettingsCard>

      {/* Fields */}
      <SettingsCard>
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Informations personnelles
          </p>
        </div>

        <SettingsRow label="Nom complet">
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-56 h-8 text-sm focus-visible:ring-amber-500"
          />
        </SettingsRow>

        <SettingsRow label="Adresse e-mail">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-56 h-8 text-sm focus-visible:ring-amber-500"
          />
        </SettingsRow>

        <SettingsRow label="Langue">
          <Select
            value={form.language}
            onValueChange={(v) => setForm({ ...form, language: v })}
          >
            <SelectTrigger className="w-56 h-8 text-sm focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l} className="text-sm">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Fuseau horaire">
          <Select
            value={form.timezone}
            onValueChange={(v) => setForm({ ...form, timezone: v })}
          >
            <SelectTrigger className="w-56 h-8 text-sm focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((t) => (
                <SelectItem key={t} value={t} className="text-sm">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsCard>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          size="sm"
          className={
            saved
              ? 'bg-secondary hover:bg-secondary text-white'
              : 'bg-primary hover:bg-secondary text-white'
          }
        >
          {saved ? (
            <>
              <Check size={14} className="mr-1.5" /> Enregistré
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>
    </div>
  )
}