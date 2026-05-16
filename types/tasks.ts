// types/tasks.ts
// Vue "Mes tâches" pour l'annotateur.
// DataType importé depuis datasets.ts — jamais redéfini ici.

// Re-export pour compatibilité avec les imports existants dans columns.tsx
export type { DataType } from './datasets'

import type { DataType } from './datasets'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'paused'

export interface TaskLabel {
  id:    string
  name:  string
  color: string
}

export interface Task {
  id:                string
  title:             string
  datasetSource:     string
  dataType:          DataType
  totalElements:     number
  completedElements: number
  deadline:          string
  status:            TaskStatus
  labels:            TaskLabel[]
}

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: 'En attente', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:   { label: 'Terminée',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  paused:      { label: 'En pause',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-001', title: 'Annotation images — Véhicules urbains',
    datasetSource: 'Dataset Mobilité v2', dataType: 'image',
    totalElements: 1200, completedElements: 840, deadline: '2026-05-15',
    status: 'in_progress', labels: [{ id: 'l1', name: 'Prioritaire', color: '#ef4444' }],
  },
  {
    id: 'task-002', title: 'Classification audio — Bruits de fond',
    datasetSource: 'AudioSet West Africa', dataType: 'audio',
    totalElements: 500, completedElements: 500, deadline: '2026-04-01',
    status: 'completed', labels: [{ id: 'l2', name: 'IA acoustique', color: '#8b5cf6' }],
  },
  {
    id: 'task-003', title: 'Revue CSV — Transactions e-commerce',
    datasetSource: 'Export Shopify Q1', dataType: 'csv',
    totalElements: 3400, completedElements: 0, deadline: '2026-06-30',
    status: 'pending', labels: [],
  },
  {
    id: 'task-004', title: 'Annotation texte — Avis produits',
    datasetSource: 'Scraping ComeUp 2025', dataType: 'text',
    totalElements: 800, completedElements: 320, deadline: '2026-05-20',
    status: 'paused', labels: [{ id: 'l3', name: 'NLP', color: '#0ea5e9' }],
  },
  {
    id: 'task-005', title: 'Labellisation JSON — Capteurs IoT',
    datasetSource: 'SmartCity Cotonou', dataType: 'json',
    totalElements: 650, completedElements: 210, deadline: '2026-07-10',
    status: 'in_progress', labels: [{ id: 'l4', name: 'IoT', color: '#22c55e' }],
  },
  {
    id: 'task-006', title: 'Annotation images — Maladies des plantes',
    datasetSource: 'AgriData Bénin', dataType: 'image',
    totalElements: 2000, completedElements: 2000, deadline: '2026-03-28',
    status: 'completed', labels: [{ id: 'l5', name: 'Agriculture', color: '#84cc16' }],
  },
]