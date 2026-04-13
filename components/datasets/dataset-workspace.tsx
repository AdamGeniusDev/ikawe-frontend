// dataset-workspace.tsx
"use client"

import { useState, useMemo } from "react"
import { Dataset } from "@/types/datasets"
import { CURRENT_USER } from "@/constants/mock-data"
import { DatasetGrid } from "./dataset-grid"
import { DatasetFilters, DatasetFilter } from "./dataset-filters"
import { DatasetToolbar, DatasetTypeFilter } from "./dataset-toolbar"
import { useRouter } from "next/navigation"

export function DatasetWorkspace({ datasets,onSelect,selectedId }: { 
  datasets: Dataset[] ,
  onSelect?: (d: Dataset) => void,
  selectedId?: string}) 
  {
  const router = useRouter()
  const [filter, setFilter]           = useState<DatasetFilter>("all")
  const [search, setSearch]           = useState("")
  const [typeFilter, setTypeFilter]   = useState<DatasetTypeFilter>("all")

  const filtered = useMemo(() => {
    return datasets
      .filter(d => {
        if (filter === "mine")   return d.ownerId === CURRENT_USER.id
        if (filter === "shared") return d.ownerId !== CURRENT_USER.id
        return true
      })
      .filter(d => typeFilter === "all" || d.dataType === typeFilter)
      .filter(d =>
        search.trim() === "" ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
  }, [filter, typeFilter, search, datasets])

  return (
    <div className="flex flex-col gap-4">
      <DatasetToolbar
        tab="workspace"
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onAction={() => router.push('/datasets/upload')}
      />
      <DatasetFilters
        active={filter}
        onChange={setFilter}
        datasets={datasets}
      />
      <DatasetGrid
        datasets={filtered}
        onSelect={onSelect}
        selectedId={selectedId}
        isSelectable={!!onSelect}
        variant="own"
        onAdd={() => router.push('/datasets/upload')}
        addLabel="Importer un dataset"
      />
    </div>
  )
}