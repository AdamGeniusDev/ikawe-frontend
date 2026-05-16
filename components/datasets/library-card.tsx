"use client"

import { AudioLines, Download, FileText, Heart, ImageIcon, Sheet } from "lucide-react"
import { Dataset } from "@/types/datasets"
import { Button } from "../ui/button"
import { getUserById } from "@/constants/mock-data"
import { useRouter } from "next/navigation"
import { formatCount } from "@/lib/utils"
import Link from "next/link"


const DATA_TYPE_ICON: Record<string, React.ReactNode> = {
  image: <ImageIcon size={14} />,
  audio: <AudioLines size={14} />,
  text:  <FileText size={14} />,
  csv:   <Sheet size={14} />,
  json:  <FileText size={14} />,
}

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  draft:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived:  "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
}

const STATUS_LABEL: Record<string, string> = {
  active:    "Actif",
  draft:     "Brouillon",
  completed: "Terminé",
  in_review: "En révision",
  archived:  "Archivé",
}

// ─────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────

interface LibraryCardProps {
  dataset: Dataset
  onDownload?: (dataset: Dataset) => void
  onBuy?: (dataset: Dataset) => void
  onLike?: (dataset: Dataset) => void
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────

export function LibraryCard({
  dataset,
  onDownload,
  onBuy,
  onLike,
}: LibraryCardProps) {
  const router = useRouter()
  const author = getUserById(dataset.ownerId)

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    onLike?.(dataset)
  }

  function handleCardClick() {
    router.push(`/library/${dataset.id}`)
  }

  function handleCTA(e: React.MouseEvent) {
    e.stopPropagation()
    if (dataset.price > 0) {
      onBuy?.(dataset)
    } else {
      onDownload?.(dataset)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col h-full rounded-xl border bg-white dark:bg-zinc-900 p-4 gap-3 cursor-pointer hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200"
    >

      {/* ── Zone haute — hauteur fixe ── */}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
            {DATA_TYPE_ICON[dataset.dataType]}
            <span className="capitalize">{dataset.dataType}</span>
          </span>
          <span className="font-semibold text-sm truncate">{dataset.title}</span>
        </div>

        {dataset.price > 0 && (
          <span className="text-[11px] font-bold text-secondary shrink-0 whitespace-nowrap">
            {dataset.price.toLocaleString()} F
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {dataset.description}
      </p>

      {/* ── Zone flexible — absorbe la différence de hauteur entre cards ── */}

      <div className="flex-1 flex flex-col justify-end gap-3">

        {dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dataset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {dataset.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                +{dataset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          <span>{dataset.totalFiles.toLocaleString()} fichiers</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>
            {dataset.sizeMb >= 1024
              ? `${(dataset.sizeMb / 1024).toFixed(1)} GB`
              : `${dataset.sizeMb} MB`}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[dataset.status]}`}>
            {STATUS_LABEL[dataset.status]}
          </span>
        </div>

      </div>

      {/* ── Footer — toujours collé en bas ── */}

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      <div className="flex items-center justify-between gap-2">

        <div className="flex items-center gap-3">

          {/* Auteur — lien vers le profil, stopPropagation pour ne pas déclencher handleCardClick */}
          {author && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium text-white shrink-0"
                style={{ backgroundColor: author.avatarColor }}
              >
                {author.avatarInitials}
              </div>
              <Link
                href={`/profile/${author.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-muted-foreground italic font-semibold hover:text-primary hover:underline"
              >
                @{author.name.split(" ").join("").toLocaleLowerCase()}
              </Link>
              {author.role === "admin" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                  Vérifié
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Download size={12} />
            <span>{formatCount(dataset.downloadCount || 0)}</span>
          </div>

          <button
            onClick={handleLike}
            className={[
              "flex items-center gap-1 text-[11px] transition-colors rounded-md px-1.5 py-0.5",
              dataset.isLikedByCurrentUser
                ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                : "text-muted-foreground hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20",
            ].join(" ")}
            aria-label={dataset.isLikedByCurrentUser ? "Retirer le like" : "Liker ce dataset"}
          >
            <Heart
              size={12}
              className={dataset.isLikedByCurrentUser ? "fill-rose-500" : "fill-none"}
            />
            <span>{dataset.likeCount || 0}</span>
          </button>

        </div>

        {/* CTA principal */}
        <Button
          size="sm"
          onClick={handleCTA}
          className={`h-7 text-xs px-3 ${
            dataset.price > 0
              ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
          }`}
        >
          {dataset.price > 0 ? "Acheter" : "Télécharger"}
        </Button>

      </div>
    </div>
  )
}