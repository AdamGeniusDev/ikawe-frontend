// components/datasets/dataset-grid.tsx
"use client"

import { Plus} from 'lucide-react'
import { Dataset } from '@/types/datasets'
import { DatasetCard } from './dataset-card'
import { LibraryCard } from './library-card'



interface DatasetGridProps {
  datasets: Dataset[]
  variant?: "own" | "library"
  onAdd?: () => void
  addLabel?: string,
  onSelect?: (d:Dataset) => void,
  selectedId?: string
  isSelectable?: boolean
}





export function DatasetGrid({
  datasets,
  variant = "own",
  onAdd,
  addLabel = "Ajouter un dataset",
  onSelect,
  selectedId,
  isSelectable
}: DatasetGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {datasets.map((dataset) =>
        variant === "own"
          ? <DatasetCard key={dataset.id} dataset={dataset} onSelect={onSelect} isSelectable={isSelectable}
          isSelected={dataset.id === selectedId}
          />
          : <LibraryCard key={dataset.id} dataset={dataset} />
      )}

      {/* Carte "Ajouter" */}
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:border-primary hover:text-primary transition-colors min-h-[200px] gap-2 group"
      >
        <div className="w-9 h-9 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={18} />
        </div>
        <span className="text-xs font-medium">{addLabel}</span>
      </button>

    </div>
  )
}