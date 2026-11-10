// lib/batch-cta.ts
//
// Résout le texte et la destination du bouton principal d'un batch
// selon le rôle du user courant et le statut du batch.

// Règle fondamentale : un réviseur n'arrive jamais sur ce bouton
// depuis la page annotateur. Son point d'entrée est /reviews.
// Le bouton "reviewer" ici sert uniquement au cas où un owner
// consulte un batch et veut lancer la révision directement.

import type { BatchStatus, BatchUserRole } from '@/types/annotation'

export interface BatchCTA {
  label:    string
  href:     string | null
  variant:  'primary' | 'secondary' | 'warning' | 'disabled'
  tooltip?: string
}

// Route unique d'une session d'annotation : Job → Batch
function batchPath(jobId: string, batchId: string): string {
  return `/annotate/job/${jobId}/batch/${batchId}`
}

export function resolveBatchCTA(
  jobId:    string,
  batchId:  string,
  status:   BatchStatus,
  role:     BatchUserRole,
): BatchCTA {

  const annotateHref = batchPath(jobId, batchId)

  // ── Vue annotateur ─────────────────────────────────────────────────────────
  if (role === 'annotator') {
    switch (status) {
      case 'pending':
        return {
          label:   "Commencer l'annotation",
          href:    annotateHref,
          variant: 'primary',
        }
      case 'in_progress':
        return {
          label:   "Continuer l'annotation",
          href:    annotateHref,
          variant: 'primary',
        }
      case 'paused':
        return {
          label:   'Reprendre',
          href:    annotateHref,
          variant: 'secondary',
        }
      case 'submitted':
        return {
          label:   'Soumis — en attente de révision',
          href:    null,
          variant: 'disabled',
          tooltip: 'Votre annotation a été soumise. Un réviseur va la traiter.',
        }
      case 'in_review':
        return {
          label:   'En cours de révision',
          href:    null,
          variant: 'disabled',
          tooltip: 'Un réviseur est en train de valider vos annotations.',
        }
      case 'partially_rejected':
        return {
          label:   'Corriger les rejets',
          href:    `${annotateHref}?filter=rejected`,
          variant: 'warning',
          tooltip: 'Certaines annotations ont été rejetées. Corrigez-les puis soumettez à nouveau.',
        }
      case 'rejected':
        return {
          label:   "Refaire l'annotation",
          href:    annotateHref,
          variant: 'warning',
          tooltip: 'Toutes vos annotations ont été rejetées. Recommencez le batch depuis le début.',
        }
      case 'completed':
        return {
          label:   'Annotation validée',
          href:    null,
          variant: 'disabled',
          tooltip: 'Toutes vos annotations ont été acceptées.',
        }
      case 'cancelled':
        return {
          label:   'Annulé',
          href:    null,
          variant: 'disabled',
        }
    }
  }

  // ── Vue réviseur ───────────────────────────────────────────────────────────
  // Le réviseur a normalement son propre point d'entrée (/reviews).
  // Ces boutons s'affichent si un réviseur consulte directement la page d'un batch.
  if (role === 'reviewer') {
    switch (status) {
      case 'submitted':
        return {
          label:   'Commencer la révision',
          href:    `/review/${batchId}`,
          variant: 'primary',
        }
      case 'in_review':
        return {
          label:   'Continuer la révision',
          href:    `/review/${batchId}`,
          variant: 'secondary',
        }
      case 'partially_rejected':
        return {
          label:   'Vérifier les corrections',
          href:    `/review/${batchId}`,
          variant: 'warning',
          tooltip: "L'annotateur a soumis ses corrections. Vérifiez les éléments rejetés.",
        }
      case 'completed':
        return {
          label:   'Révision terminée',
          href:    null,
          variant: 'disabled',
        }
      case 'rejected':
        return {
          label:   'Batch rejeté',
          href:    null,
          variant: 'disabled',
        }
      default:
        return {
          label:   'Non soumis',
          href:    null,
          variant: 'disabled',
          tooltip: "L'annotateur n'a pas encore soumis ce batch.",
        }
    }
  }

  // ── Vue owner ──────────────────────────────────────────────────────────────
  // L'owner peut consulter mais n'annote pas lui-même.
  if (role === 'owner') {
    return {
      label:   'Voir le détail',
      href:    annotateHref,
      variant: 'secondary',
    }
  }

  // Aucun accès
  return {
    label:   'Accès non autorisé',
    href:    null,
    variant: 'disabled',
  }
}