"use client"

// app/datasets/[id]/page.tsx

import { useState, useMemo, useCallback } from "react"
import { useParams, notFound, useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft, MoreHorizontal, FileText, Image as ImageIcon,
  Music, Table2, Braces, LayoutGrid, List, Plus,
  Download, Heart, Eye, ShoppingCart, Lock,
  CheckCircle2, Clock, AlertCircle, Archive,
  Trash2, Edit3, Globe, Users, Tag, Calendar,
  HardDrive, Layers, ChevronRight, X,
  BadgeDollarSign, Pencil, Settings, Key,
  Search, ChevronLeft,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Dialogs partagés (modal)
import {
  ExportDialog,
  DuplicateDialog,
  ArchiveDialog,
  DeleteDialog,
} from "@/components/datasets/dialogs"

// Panel accès (Sheet latérale)
import { DatasetAccessPanel } from "@/components/datasets/DatasetAccessPanel"

import {
  MOCK_TEAMS, MOCK_USERS, CURRENT_USER,
  getDatasetById, getJobsForDataset,
} from "@/constants/mock-data"
import type { Dataset, DatasetRole, DatasetStatus, DataType } from "@/types/datasets"
import type { Team } from "@/types/team"
import type { User as UserType } from "@/types/user"
import { TASK_TYPE_LABELS, DATA_TYPE_LABELS } from "@/types/datasets"
import { JOB_STATUS_META } from "@/types/annotation"

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useDatasetState(datasetId: string, currentUserId: string) {
  const [dataset, setDataset] = useState<Dataset | null>(
    () => getDatasetById(datasetId) ?? null
  )

  const addMember = (user: UserType, role: DatasetRole) =>
    setDataset(prev => prev ? ({
      ...prev,
      members: [...prev.members, {
        userId: user.id, name: user.name,
        role, grantedAt: new Date().toISOString(), grantedBy: currentUserId,
      }],
    }) : prev)

  const addMembers = (users: { user: UserType; role: DatasetRole }[]) =>
    setDataset(prev => prev ? ({
      ...prev,
      members: [
        ...prev.members,
        ...users.map(({ user, role }) => ({
          userId: user.id, name: user.name,
          role, grantedAt: new Date().toISOString(), grantedBy: currentUserId,
        })),
      ],
    }) : prev)

  const addTeam = (team: Team) =>
    setDataset(prev => prev ? ({
      ...prev,
      teamAssignments: [...prev.teamAssignments, {
        teamId: team.id, teamName: team.name,
        assignedAt: new Date().toISOString(), assignedBy: currentUserId,
      }],
    }) : prev)

  const removeMember = (userId: string) =>
    setDataset(prev => prev ? ({
      ...prev, members: prev.members.filter(m => m.userId !== userId),
    }) : prev)

  const removeTeam = (teamId: string) =>
    setDataset(prev => prev ? ({
      ...prev, teamAssignments: prev.teamAssignments.filter(t => t.teamId !== teamId),
    }) : prev)

  const updateMeta = (
    fields: Partial<Pick<Dataset, 'title' | 'description' | 'tags' | 'visibility' | 'price' | 'status'>>
  ) => setDataset(prev => prev ? { ...prev, ...fields } : prev)

  return { dataset, addMember, addMembers, addTeam, removeMember, removeTeam, updateMeta }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES — LucideIcon (fix "no construct/call signatures")
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DatasetStatus, {
  label: string; color: string; dot: string; icon: LucideIcon
}> = {
  draft:     { label: "Brouillon",   dot: "bg-zinc-400",    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",               icon: Clock        },
  active:    { label: "Actif",       dot: "bg-emerald-500", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  in_review: { label: "En révision", dot: "bg-blue-500",    color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",            icon: Eye          },
  completed: { label: "Terminé",     dot: "bg-violet-500",  color: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",    icon: CheckCircle2 },
  archived:  { label: "Archivé",     dot: "bg-zinc-400",    color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",              icon: Archive      },
}

const DATATYPE_ICONS: Record<DataType, LucideIcon> = {
  image: ImageIcon,
  text:  FileText,
  audio: Music,
  csv:   Table2,
  json:  Braces,
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub: string; icon: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-background px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground/60">{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉLÉMENTS FICTIFS
// ─────────────────────────────────────────────────────────────────────────────

type FakeElement = {
  id: string; filename: string; preview: string | null
  excerpt: string | null; size: string; annotated: boolean
}

function makeFakeElements(dataType: DataType, count = 24): FakeElement[] {
  return Array.from({ length: count }, (_, i) => {
    const n      = String(i + 1).padStart(3, '0')
    const ext    = dataType === 'image' ? 'jpg' : dataType === 'audio' ? 'mp3' : dataType === 'csv' ? 'csv' : dataType === 'json' ? 'json' : 'txt'
    const prefix = dataType === 'image' ? 'photo' : dataType === 'audio' ? 'audio' : dataType === 'csv' ? 'batch' : dataType === 'json' ? 'record' : 'document'
    return {
      id:        `el-${i + 1}`,
      filename:  `${prefix}_${n}.${ext}`,
      preview:   dataType === 'image' ? `https://placehold.co/160x160/f1f5f9/94a3b8?text=${n}` : null,
      excerpt:   ['text','csv','json'].includes(dataType) ? `Extrait ${i + 1} — Le marché de Dantokpa regroupe des milliers d'artisans…` : null,
      size:      `${(Math.random() * 900 + 100).toFixed(0)} Ko`,
      annotated: i < Math.floor(count * 0.42),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL TOUS LES ÉLÉMENTS
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

function ElementsModal({ dataset, isBlurred, onClose }: {
  dataset: Dataset; isBlurred: boolean; onClose: () => void
}) {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState("")
  const [view,   setView]   = useState<"grid" | "list">("grid")
  const [filter, setFilter] = useState<"all" | "annotated" | "pending">("all")

  const Icon        = DATATYPE_ICONS[dataset.dataType]
  const allElements = useMemo(() => makeFakeElements(dataset.dataType, Math.min(dataset.totalFiles, 100)), [dataset])
  const filtered    = useMemo(() => {
    let list = allElements
    if (search) list = list.filter(e => e.filename.toLowerCase().includes(search.toLowerCase()))
    if (filter === "annotated") list = list.filter(e => e.annotated)
    if (filter === "pending")   list = list.filter(e => !e.annotated)
    return list
  }, [allElements, search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={handleBackdrop}>
      <div className="w-full sm:max-w-3xl bg-background rounded-t-2xl sm:rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-sm font-semibold">Tous les éléments</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · {DATA_TYPE_LABELS[dataset.dataType]}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-b shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="text" placeholder="Rechercher un fichier…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border bg-muted/30 pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
            {(["all","annotated","pending"] as const).map(f => (
              <button key={f} type="button" onClick={() => { setFilter(f); setPage(1) }}
                className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {f === "all" ? "Tous" : f === "annotated" ? "Annotés" : "En attente"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
            {(["grid","list"] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                  view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                {v === "grid" ? <LayoutGrid className="h-3 w-3" /> : <List className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Search className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">Aucun fichier trouvé</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {paged.map(el => (
                <div key={el.id} style={{ aspectRatio: '1/1' }}
                  className="group relative overflow-hidden rounded-xl border bg-muted/10 hover:border-primary/30 transition-all cursor-pointer">
                  {el.preview
                    ? <Image src={el.preview} alt={el.filename} fill className={cn("object-cover group-hover:scale-105 transition-transform", isBlurred && "blur-md")} />
                    : <div className={cn("flex flex-col items-center justify-center gap-1.5 w-full h-full p-2", isBlurred && "blur-sm")}>
                        <Icon className="h-6 w-6 text-muted-foreground/30" />
                        {el.excerpt && <p className="text-[9px] text-muted-foreground/60 text-center line-clamp-3">{el.excerpt}</p>}
                      </div>
                  }
                  {isBlurred && <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]"><Lock className="h-4 w-4 text-muted-foreground/50" /></div>}
                  {el.annotated && !isBlurred && <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-1 ring-white/80" />}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/50 via-black/20 to-transparent px-2 py-1.5">
                    <p className="text-[9px] text-white/80 truncate font-medium">{el.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {paged.map(el => (
                <div key={el.id} className="flex items-center gap-3 py-2.5 hover:bg-muted/20 px-2 rounded-lg -mx-2 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {el.preview
                      ? <Image src={el.preview} alt={el.filename} width={36} height={36} className={cn("object-cover w-full h-full", isBlurred && "blur-sm")} />
                      : <Icon className="h-4 w-4 text-muted-foreground/50" />
                    }
                  </div>
                  <div className={cn("flex-1 min-w-0", isBlurred && "blur-sm select-none")}>
                    <p className="text-xs font-medium truncate">{el.filename}</p>
                    {el.excerpt && <p className="text-[10px] text-muted-foreground truncate">{el.excerpt}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{el.size}</span>
                  {el.annotated && !isBlurred
                    ? <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">Annoté</span>
                    : isBlurred
                      ? <Lock className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                      : <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">En attente</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t shrink-0">
            <p className="text-[11px] text-muted-foreground">Page {page} sur {totalPages} · {filtered.length} fichiers</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} type="button" onClick={() => setPage(p)}
                    className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      p === page ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted")}>
                    {p}
                  </button>
                )
              })}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APERÇU ÉLÉMENTS
// ─────────────────────────────────────────────────────────────────────────────

function ElementsPreview({ dataset, isBlurred }: { dataset: Dataset; isBlurred: boolean }) {
  const [view,      setView]      = useState<"grid" | "list">("grid")
  const [showModal, setShowModal] = useState(false)
  const Icon     = DATATYPE_ICONS[dataset.dataType]
  const elements = useMemo(() => makeFakeElements(dataset.dataType, 10), [dataset.dataType])

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border bg-background px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Aperçu des éléments</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {dataset.totalFiles.toLocaleString("fr-FR")} fichiers · {DATA_TYPE_LABELS[dataset.dataType]}
              {isBlurred && <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Lock className="h-2.5 w-2.5" />Aperçu limité</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
            {(["grid","list"] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                  view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {v === "grid" ? <LayoutGrid className="h-3 w-3" /> : <List className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {view === "grid" && (
          <div className={cn("grid grid-cols-5 gap-1.5", isBlurred && "select-none")}>
            {elements.map(el => (
              <div key={el.id} style={{ aspectRatio: '1/1' }}
                className="group relative overflow-hidden rounded-lg border bg-muted/20 hover:border-muted-foreground/20 transition-all cursor-pointer">
                {el.preview
                  ? <Image src={el.preview} alt={el.filename} fill className={cn("object-cover", isBlurred && "blur-md")} />
                  : <div className={cn("flex flex-col items-center justify-center gap-1 w-full h-full px-1.5", isBlurred && "blur-sm")}>
                      <Icon className="h-4 w-4 text-muted-foreground/30" />
                      {el.excerpt && <p className="text-[8px] text-muted-foreground/50 text-center line-clamp-2">{el.excerpt}</p>}
                    </div>
                }
                {isBlurred && <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]"><Lock className="h-3.5 w-3.5 text-muted-foreground/40" /></div>}
                {el.annotated && !isBlurred && <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/50 to-transparent px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-white/80 truncate">{el.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "list" && (
          <div className="flex flex-col divide-y divide-border/40">
            {elements.map(el => (
              <div key={el.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/20 px-2 rounded-lg -mx-2 transition-colors">
                <div className="w-7 h-7 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {el.preview
                    ? <Image src={el.preview} alt={el.filename} width={28} height={28} className={cn("object-cover w-full h-full", isBlurred && "blur-sm")} />
                    : <Icon className="h-3 w-3 text-muted-foreground/50" />
                  }
                </div>
                <div className={cn("flex-1 min-w-0", isBlurred && "blur-sm select-none")}>
                  <p className="text-xs font-medium truncate">{el.filename}</p>
                  {el.excerpt && <p className="text-[10px] text-muted-foreground truncate">{el.excerpt}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{el.size}</span>
                {el.annotated && !isBlurred
                  ? <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  : isBlurred
                    ? <Lock className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                    : <span className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                }
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {(dataset.annotatedFiles ?? 0).toLocaleString("fr-FR")} annotés / {dataset.totalFiles.toLocaleString("fr-FR")}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">{dataset.annotationProgress ?? 0}%</p>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${dataset.annotationProgress ?? 0}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-2.5">
          <p className="text-[11px] text-muted-foreground">10 sur {dataset.totalFiles.toLocaleString("fr-FR")} affichés</p>
          {!isBlurred && (
            <button type="button" onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              Voir tous les éléments <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {showModal && <ElementsModal dataset={dataset} isBlurred={isBlurred} onClose={() => setShowModal(false)} />}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOC ACHAT
// ─────────────────────────────────────────────────────────────────────────────

function PurchaseBlock({ dataset, onPurchase }: { dataset: Dataset; onPurchase: () => void }) {
  const isFree = dataset.price === 0
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-5 sticky top-4">
      <div className="flex items-baseline gap-2">
        {isFree
          ? <span className="text-2xl font-bold text-emerald-600">Gratuit</span>
          : <><span className="text-2xl font-bold">{dataset.price.toLocaleString("fr-FR")} F CFA</span><span className="text-[11px] text-muted-foreground">accès complet</span></>
        }
      </div>
      <ul className="flex flex-col gap-1.5">
        {["Accès à tous les éléments annotés","Export JSON / CSV / COCO","Mises à jour incluses",isFree ? "Aucun paiement requis" : "Paiement unique"].map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{item}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onPurchase}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all">
        {isFree ? <><Download className="h-4 w-4" />Télécharger gratuitement</> : <><ShoppingCart className="h-4 w-4" />Acheter ce dataset</>}
      </button>
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Download className="h-3 w-3" />{(dataset.downloadCount ?? 0).toLocaleString("fr-FR")} télécharg.
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Heart className="h-3 w-3" />{(dataset.likeCount ?? 0).toLocaleString("fr-FR")} j'aime
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES DE VENTE
// ─────────────────────────────────────────────────────────────────────────────

function SaleSettings({ dataset, onUpdate }: {
  dataset: Dataset
  onUpdate: (fields: Partial<Pick<Dataset, 'price' | 'visibility'>>) => void
}) {
  const [price,     setPrice]     = useState(dataset.price.toString())
  const [published, setPublished] = useState(dataset.visibility === 'public')
  const isReady = dataset.status === 'completed'

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background px-5 py-4">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Paramètres de vente</h3>
        {!isReady && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />Disponible quand le dataset est terminé
          </span>
        )}
      </div>
      <div className={cn("flex flex-col gap-4", !isReady && "opacity-40 pointer-events-none")}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Prix (F CFA) · 0 = accès gratuit</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
              onBlur={() => onUpdate({ price: Math.max(0, Number(price)) })}
              className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="0" />
            <span className="text-xs text-muted-foreground shrink-0">F CFA</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 cursor-pointer"
          onClick={() => { const next = !published; setPublished(next); onUpdate({ visibility: next ? 'public' : 'private' }) }}>
          <div>
            <p className="text-xs font-medium">{published ? "Publié sur la marketplace" : "Non publié"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{published ? "Visible de tous les utilisateurs" : "Seuls les membres assignés y ont accès"}</p>
          </div>
          <button type="button" className={cn("relative h-5 w-9 rounded-full transition-colors shrink-0", published ? "bg-primary" : "bg-muted-foreground/30")}>
            <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", published && "translate-x-4")} />
          </button>
        </div>
        {published && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 px-3 py-2.5">
            <Globe className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Votre dataset est visible sur la marketplace Ikawe.{" "}
              {Number(price) > 0 ? `Prix affiché : ${Number(price).toLocaleString("fr-FR")} F CFA.` : "Accès gratuit."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION JOBS
// ─────────────────────────────────────────────────────────────────────────────

function JobsSection({ datasetId, isOwner }: { datasetId: string; isOwner: boolean }) {
  const jobs = getJobsForDataset(datasetId)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background px-5 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tâches d'annotation</h3>
        {isOwner && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" />Créer une tâche
          </Button>
        )}
      </div>
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl border border-dashed">
          <Layers className="h-7 w-7 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">Aucune tâche créée</p>
          {isOwner && <p className="text-[10px] text-muted-foreground/60 text-center max-w-50 leading-relaxed">Créez une tâche pour assigner des annotateurs à ce dataset.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map(job => {
            const meta     = JOB_STATUS_META[job.status]
            const progress = job.totalElements > 0 ? Math.round((job.annotatedCount / job.totalElements) * 100) : 0
            return (
              <div key={job.id}
                className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 hover:border-primary/20 hover:bg-muted/10 transition-all cursor-pointer group">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", meta.className)}>
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{job.datasetName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {TASK_TYPE_LABELS[job.taskType]} · {job.batchCount} groupe{job.batchCount > 1 ? "s" : ""} · {job.totalElements} éléments
                  </p>
                  {job.totalElements > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{progress}%</span>
                    </div>
                  )}
                </div>
                <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0", meta.className)}>{meta.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DANGER ZONE
// ─────────────────────────────────────────────────────────────────────────────

function DangerZone({ dataset, onOpenArchive, onOpenDelete }: {
  dataset: Dataset; onOpenArchive: () => void; onOpenDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-red-200 dark:border-red-900/30 bg-background px-5 py-4">
      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onOpenArchive} disabled={dataset.status === 'archived'}
          className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Archive className="h-3.5 w-3.5" />
          {dataset.status === 'archived' ? "Déjà archivé" : "Archiver le dataset"}
        </button>
        <button type="button" onClick={onOpenDelete}
          className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />Supprimer définitivement
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        La suppression est irréversible. Un dataset avec des jobs actifs ne peut pas être supprimé.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLETS OWNER — LucideIcon
// ─────────────────────────────────────────────────────────────────────────────

type OwnerTab = "overview" | "access" | "settings"

const OWNER_TABS: { id: OwnerTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Aperçu",   icon: LayoutGrid },
  { id: "access",   label: "Accès",    icon: Key        },
  { id: "settings", label: "Réglages", icon: Settings   },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

// Dialogs restants en modal (actions ponctuelles)
type ActiveDialog = 'export' | 'duplicate' | 'archive' | 'delete' | null

export default function DatasetDetailPage() {
  const { id: datasetId } = useParams<{ id: string }>()
  const router = useRouter()

  const currentUser = MOCK_USERS.find(u => u.id === CURRENT_USER.id)
  const { dataset, addMember, addMembers, addTeam, removeMember, removeTeam, updateMeta } =
    useDatasetState(datasetId, currentUser?.id ?? "")

  const [isPurchased,  setIsPurchased]  = useState(false)
  const [activeTab,    setActiveTab]    = useState<OwnerTab>("overview")
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null)

  if (!dataset || !currentUser) return notFound()

  const isOwner  = dataset.ownerId === currentUser.id
  const isMember = dataset.members.some(m => m.userId === currentUser.id) ||
                   dataset.teamAssignments.some(ta =>
                     MOCK_TEAMS.find(t => t.id === ta.teamId)?.members.some(m => m.userId === currentUser.id)
                   )
  const isPublic      = dataset.visibility === 'public'
  const showBuy       = isPublic && !isOwner && !isMember && !isPurchased
  const isBlurred     = isPublic && !isOwner && !isMember && !isPurchased && dataset.price > 0
  const hasActiveJobs = getJobsForDataset(datasetId).some(j => j.status === 'in_progress' || j.status === 'pending')
  const DataIcon      = DATATYPE_ICONS[dataset.dataType]

  // Navigation vers la page d'édition (accessible depuis ici, la liste, etc.)
  const goToEdit = () => router.push(`/datasets/${datasetId}/edit`)
  const closeDialog = () => setActiveDialog(null)

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── Dialogs en modal ── */}
      {activeDialog === 'export' && (
        <ExportDialog dataset={dataset} onClose={closeDialog} />
      )}
      {activeDialog === 'duplicate' && (
        <DuplicateDialog
          dataset={dataset}
          onDuplicate={title => { console.log("TODO: duplicate →", title) }}
          onClose={closeDialog}
        />
      )}
      {activeDialog === 'archive' && (
        <ArchiveDialog
          dataset={dataset}
          onConfirm={() => updateMeta({ status: 'archived', visibility: 'private' })}
          onClose={closeDialog}
        />
      )}
      {activeDialog === 'delete' && (
        <DeleteDialog
          dataset={dataset}
          hasActiveJobs={hasActiveJobs}
          onConfirm={() => { console.log("TODO: delete"); router.push('/datasets') }}
          onClose={closeDialog}
        />
      )}

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-10 flex w-full items-center justify-between px-6 py-3 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/datasets')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />Datasets
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-sm font-semibold truncate max-w-50">{dataset.title}</span>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            {/* Modifier → page dédiée */}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={goToEdit}>
              <Pencil className="h-3.5 w-3.5" />Modifier
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {/* Modifier → page dédiée */}
                <DropdownMenuItem onClick={() => setActiveDialog('duplicate')}>
                  <Layers className="h-3.5 w-3.5 mr-2" />Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveDialog('export')}>
                  <Download className="h-3.5 w-3.5 mr-2" />Exporter les annotations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-amber-600 focus:text-white"
                  disabled={dataset.status === 'archived'}
                  onClick={() => setActiveDialog('archive')}
                >
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  {dataset.status === 'archived' ? "Déjà archivé" : "Archiver"}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="text-red-600 focus:text-white focus:bg-red-600 dark:focus:bg-red-950/30 [&_svg]:text-inherit cursor-pointer"
                    onClick={() => setActiveDialog('delete')}
                    >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-6 px-6 py-6 w-full">

        {/* Hero */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0 mt-0.5">
              <DataIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight leading-tight">{dataset.title}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_CONFIG[dataset.status].color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[dataset.status].dot)} />
                  {STATUS_CONFIG[dataset.status].label}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{DATA_TYPE_LABELS[dataset.dataType]}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {dataset.visibility === 'public'  && <><Globe className="h-3 w-3" />Public</>}
                  {dataset.visibility === 'team'    && <><Users className="h-3 w-3" />Équipe</>}
                  {dataset.visibility === 'private' && <><Lock  className="h-3 w-3" />Privé</>}
                </span>
                {dataset.price > 0 && (
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    {dataset.price.toLocaleString("fr-FR")} F CFA
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">v{dataset.version}</span>
              </div>
            </div>
          </div>
          {dataset.description && <p className="text-sm text-muted-foreground leading-relaxed">{dataset.description}</p>}
          {dataset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dataset.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full cursor-pointer hover:bg-muted/80 transition-colors">
                  <Tag className="h-2.5 w-2.5" />{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Fichiers" value={dataset.totalFiles.toLocaleString("fr-FR")}
            sub={dataset.sizeMb >= 1024 ? `${(dataset.sizeMb/1024).toFixed(1)} Go` : `${dataset.sizeMb} Mo`} icon={HardDrive} />
          <StatCard label="Progression" value={`${dataset.annotationProgress ?? 0}%`}
            sub={`${(dataset.annotatedFiles ?? 0).toLocaleString("fr-FR")} annotés`} icon={CheckCircle2} />
          <StatCard label="Tâches" value={dataset.taskCount ?? 0} sub="jobs d'annotation" icon={Layers} />
          <StatCard label="Créé le"
            value={new Date(dataset.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            sub={`màj ${new Date(dataset.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`}
            icon={Calendar} />
        </div>

        {/* Tabs owner */}
        {isOwner && (
          <div className="flex items-center gap-1 rounded-xl border bg-muted/20 p-1 w-fit">
            {OWNER_TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Layout */}
        <div className={cn("flex gap-6", showBuy ? "flex-col lg:flex-row" : "flex-col")}>
          <div className={cn("flex flex-col gap-6", showBuy ? "flex-1 min-w-0" : "w-full")}>

            {(!isOwner || activeTab === "overview") && (
              <>
                <ElementsPreview dataset={dataset} isBlurred={isBlurred} />
                {(isOwner || isMember) && <JobsSection datasetId={dataset.id} isOwner={isOwner} />}
              </>
            )}

            {/* Accès — DatasetAccessPanel avec Sheet latérale */}
            {isOwner && activeTab === "access" && (
              <DatasetAccessPanel
                dataset={dataset}
                allUsers={MOCK_USERS}
                allTeams={MOCK_TEAMS}
                currentUserId={currentUser.id}
                onAddMember={addMember}
                onAddMembers={addMembers}
                onAddTeam={addTeam}
                onRemoveMember={removeMember}
                onRemoveTeam={removeTeam}
              />
            )}

            {/* Réglages */}
            {isOwner && activeTab === "settings" && (
              <>
                <SaleSettings dataset={dataset} onUpdate={updateMeta} />
                <DangerZone
                  dataset={dataset}
                  onOpenArchive={() => setActiveDialog('archive')}
                  onOpenDelete={() => setActiveDialog('delete')}
                />
              </>
            )}
          </div>

          {showBuy && (
            <div className="w-full lg:w-72 shrink-0">
              <PurchaseBlock dataset={dataset} onPurchase={() => setIsPurchased(true)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}