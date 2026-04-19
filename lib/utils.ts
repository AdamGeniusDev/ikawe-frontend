import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMinutes < 1) return "À l'instant"
  if (diffMinutes < 60) return `${diffMinutes}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffHours < 48) return 'Hier'
  if (diffHours < 72) return 'Avant-hier'

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}


export const simulateZipAnalysis = (
  validExts: string[]
): { detectedCount: number; ignoredCount: number; ignoredExtensions: string[] } => {
  const totalFiles = Math.floor(Math.random() * 800) + 50
  const ignoredCount = Math.floor(totalFiles * (Math.random() * 0.15))
  const detectedCount = totalFiles - ignoredCount
  const allPossible = ["jpg", "png", "mp3", "txt", "csv", "json", "wav", "pdf", "docx", "xml"]
  const ignoredExtensions = allPossible
    .filter((e) => !validExts.includes(e))
    .slice(0, ignoredCount > 0 ? 2 : 0)
  return { detectedCount, ignoredCount, ignoredExtensions }
}
