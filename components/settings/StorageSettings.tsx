'use client'

import { useSettingsStore, StorageState } from '@/store/settings.store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {children}
    </div>
  )
}

function CardHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
    </div>
  )
}

const BREAKDOWN_COLORS = {
  audio: { bar: 'bg-amber-400', dot: 'bg-amber-400' },
  images: { bar: 'bg-blue-400', dot: 'bg-blue-400' },
  text: { bar: 'bg-emerald-400', dot: 'bg-emerald-400' },
}

const BREAKDOWN_LABELS: Record<string, string> = {
  audio: 'Audio',
  images: 'Images',
  text: 'Texte & CSV',
}

export default function StorageSettings() {
  const { storage, updateStorage } = useSettingsStore()

  const usedPct = Math.round((storage.usedGb / storage.totalGb) * 100)
  const availableGb = +(storage.totalGb - storage.usedGb).toFixed(1)

  return (
    <div className="flex flex-col gap-5">
      {/* Gauge */}
      <SettingsCard>
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Numbers */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {storage.usedGb} <span className="text-sm font-normal text-zinc-400">Go utilisés</span>
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {availableGb} Go disponibles sur {storage.totalGb} Go
              </p>
            </div>
            <span
              className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                usedPct > 80
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : usedPct > 60
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}
            >
              {usedPct}%
            </span>
          </div>

          {/* Multi-segment bar */}
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
            {Object.entries(storage.breakdown).map(([key, gb]) => {
              const pct = (gb / storage.totalGb) * 100
              return (
                <div
                  key={key}
                  className={`h-full ${BREAKDOWN_COLORS[key as keyof typeof BREAKDOWN_COLORS].bar} first:rounded-l-full`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5">
            {Object.entries(storage.breakdown).map(([key, gb]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${BREAKDOWN_COLORS[key as keyof typeof BREAKDOWN_COLORS].dot}`}
                />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {BREAKDOWN_LABELS[key]} — {gb} Go
                </span>
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* Retention */}
      <SettingsCard>
        <CardHeader title="Politique de conservation" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Datasets archivés
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Durée avant suppression automatique
            </p>
          </div>
          <Select
            value={storage.retentionArchived}
            onValueChange={(v) =>
              updateStorage({ retentionArchived: v as StorageState['retentionArchived'] })
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90j">90 jours</SelectItem>
              <SelectItem value="180j">180 jours</SelectItem>
              <SelectItem value="1an">1 an</SelectItem>
              <SelectItem value="illimitee">Illimitée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Brouillons inactifs
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Suppression automatique après inactivité
            </p>
          </div>
          <Select
            value={storage.retentionDrafts}
            onValueChange={(v) =>
              updateStorage({ retentionDrafts: v as StorageState['retentionDrafts'] })
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30j">30 jours</SelectItem>
              <SelectItem value="60j">60 jours</SelectItem>
              <SelectItem value="jamais">Jamais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>
    </div>
  )
}