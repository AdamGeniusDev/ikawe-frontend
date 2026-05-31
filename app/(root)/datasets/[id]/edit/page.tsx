"use client"

// app/datasets/[id]/edit/page.tsx
//
// Page dédiée à la modification des métadonnées d'un dataset.
// Accessible depuis la page de détail, la liste, les menus contextuels, etc.
// Redirige vers /datasets/[id] après enregistrement ou annulation.

import { useParams} from "next/navigation"
import { notFound } from "next/navigation"

import { getDatasetById } from "@/constants/mock-data"
import DatasetEditForm from "@/components/datasets/DatasetEditForm"


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DatasetEditPage() {
  const { id: datasetId } = useParams<{ id: string }>()

  const original = getDatasetById(datasetId)
  if (!original) return notFound()

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return <DatasetEditForm original={original} />
}