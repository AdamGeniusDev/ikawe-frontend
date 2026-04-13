"use client"

import { Dataset } from "@/types/datasets"
import { CURRENT_USER } from "@/constants/mock-data"

export type DatasetFilter = "all" | "mine" | "shared"

interface DatasetFiltersProps {
  active: DatasetFilter
  onChange: (filter: DatasetFilter) => void
  datasets: Dataset[]
}

export function DatasetFilters({ active, onChange, datasets }: DatasetFiltersProps) {
  const counts = {
    all:    datasets.length,
    mine:   datasets.filter(d => d.ownerId === CURRENT_USER.id).length,
    shared: datasets.filter(d => d.ownerId !== CURRENT_USER.id).length,
  }

  const filters: { key: DatasetFilter; label: string }[] = [
    { key: "all",    label: "Tous" },
    { key: "mine",   label: "Créés par moi" },
    { key: "shared", label: "Partagés avec moi" },
  ]

  return (
    <div className="flex items-center gap-2">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            active === key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
          }`}
        >
          {label}
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
            active === key
              ? "bg-white/20 text-primary-foreground"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          }`}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  )
}