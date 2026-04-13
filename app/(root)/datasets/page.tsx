"use client"

import { useState,useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatasetWorkspace } from '@/components/datasets/dataset-workspace'
import { DatasetGrid } from '@/components/datasets/dataset-grid'
import { PublishDatasetModal } from '@/components/datasets/publish-dataset-modal'
import { CURRENT_USER, getAccessibleDatasets, getPublicDatasets, getMyDatasets } from '@/constants/mock-data'
import { DatasetToolbar } from '@/components/datasets/dataset-toolbar'
import { DatasetTypeFilter } from "@/components/datasets/dataset-toolbar"

export default function DatasetsPage() {
  const [publishOpen, setPublishOpen] = useState(false)

  const accessibleDatasets = getAccessibleDatasets(CURRENT_USER.id)
  const publicDatasets     = getPublicDatasets()
  const myDatasets         = getMyDatasets(CURRENT_USER.id)
  const [librarySearch, setLibrarySearch]         = useState("")
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<DatasetTypeFilter>("all")

  const filteredPublic = useMemo(() => {
    return publicDatasets
      .filter(d => libraryTypeFilter === "all" || d.dataType === libraryTypeFilter)
      .filter(d =>
        librarySearch.trim() === "" ||
        d.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        d.description?.toLowerCase().includes(librarySearch.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(librarySearch.toLowerCase()))
      )
  }, [librarySearch, libraryTypeFilter, publicDatasets])



  return (
    <div className='flex flex-col w-full min-h-screen'>

      <div className='flex w-full px-6 items-center justify-between py-3 border-b bg-white/70 dark:bg-zinc-900/70'>
        <div>
          <h1 className='font-bold text-[25px]'>
            Parcourez les <span className='text-secondary'>datasets</span>
          </h1>
          <p className='text-sm text-muted-foreground'>
            Gérez vos datasets en toute simplicité avant traitement
          </p>
        </div>
      </div>

      <div className='w-full p-4'>
        <Tabs defaultValue='workspace' className='w-full'>
          <TabsList>
            <TabsTrigger value='workspace'>
              Mon espace
              <span className="ml-2 text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full">
                {accessibleDatasets.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value='library'>
              Bibliothèque publique
              <span className="ml-2 text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full">
                {publicDatasets.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='workspace' className="mt-4">
            <DatasetWorkspace datasets={accessibleDatasets} />
          </TabsContent>

          <TabsContent value='library' className="mt-4">
            <div className="flex flex-col gap-4">
              <DatasetToolbar
                tab="library"
                search={librarySearch}
                onSearchChange={setLibrarySearch}
                typeFilter={libraryTypeFilter}
                onTypeFilterChange={setLibraryTypeFilter}
                onAction={() => setPublishOpen(true)}
              />
              <DatasetGrid
                datasets={filteredPublic}
                variant="library"
                onAdd={() => setPublishOpen(true)}
                addLabel="Publier un dataset"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PublishDatasetModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        myDatasets={myDatasets}
      />

    </div>
  )
}