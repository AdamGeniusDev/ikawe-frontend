"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Upload, Globe, X } from "lucide-react"
import type { DataType } from "@/types/datasets"

// "all" + les types de données canoniques — reste synchro si DataType évolue.
export type DatasetTypeFilter = "all" | DataType

interface DatasetToolbarProps {
  tab: "workspace" | "library"
  search: string
  onSearchChange: (v: string) => void
  typeFilter: DatasetTypeFilter
  onTypeFilterChange: (v: DatasetTypeFilter) => void
  onAction: () => void // Upload ou Publier selon le tab
}

const TYPE_FILTERS: { key: DatasetTypeFilter; label: string }[] = [
  { key: "all",   label: "Tous" },
  { key: "image", label: "Image" },
  { key: "audio", label: "Audio" },
  { key: "text",  label: "Texte" },
  { key: "csv",   label: "CSV" },
  { key: "json",  label: "JSON" },
]

export function DatasetToolbar({
  tab,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onAction,
}: DatasetToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">

      {/* Barre de recherche */}
      <div className="relative w-full sm:w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un dataset..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filtres par type */}
      <div className="flex items-center gap-1 flex-wrap">
        {TYPE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTypeFilterChange(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              typeFilter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bouton action — poussé à droite */}
      <div className="sm:ml-auto shrink-0 hover:scale-105 transition duration-200 ease-out">
        <Button size="sm" variant="outline" onClick={onAction} className="gap-2 h-8 hover:bg-secondary hover:text-white">
          {tab === "workspace"
            ? <><Upload size={13} className='hover:scale-105 transition-transform duration-200 ease-out' /> Importer</>
            : <><Globe size={13} /> Publier un dataset</>
          }
        </Button>
      </div>

    </div>
  )
}