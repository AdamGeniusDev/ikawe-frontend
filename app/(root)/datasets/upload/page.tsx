"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileAudio, FileText, ImageIcon, UploadCloud,
  X, CheckCircle2, AlertCircle, Files, Globe, Lock, Users, Tag,
  LucideIcon,
} from 'lucide-react'
import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Stepper, StepperList, StepperItem, StepperTrigger, StepperIndicator,
  StepperTitle, StepperSeparator, StepperPanel, StepperFooter,
  StepperNext, StepperPrevious,
} from '@/components/ui/stepper'
import { formatBytes, simulateZipAnalysis } from '@/lib/utils'
import { PreviewStep } from '@/components/upload/PreviewStep'
import { ImageFilePreview } from '@/components/upload/ImagePreview'
import { AudioFilePreview } from '@/components/upload/AudioPreview'
import { TextFilePreview } from '@/components/upload/TextPreview'
import { CsvFilePreview } from '@/components/upload/CsvPreview'


// Sous-ensemble UI propre à l'upload (3 familles + "" = non sélectionné).
// Distinct du DataType canonique de types/datasets.ts (qui inclut csv/json) :
// ne PAS masquer le type global ici.
type UploadKind = "audio" | "text" | "image" | ""
type Visibility = "private" | "team" | "public"

interface UploadedFile {
  id: string
  name: string
  size: number
  progress: number
  isZip: boolean
  detectedCount?: number
  ignoredCount?: number
  ignoredExtensions?: string[]
  sampleUrls?: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_TYPES = [
  {
    id: "audio" as UploadKind,
    label: "Speech / Audio",
    sub: "TTS, STT, Speaker ID",
    icon: FileAudio,
    accept: ".wav,.mp3,.m4a,.zip",
    formats: "WAV, MP3, M4A",
    validExts: ["wav", "mp3", "m4a", "ogg", "flac"],
  },
  {
    id: "text" as UploadKind,
    label: "Traduction",
    sub: "Multilingue, dialectes",
    icon: FileText,
    accept: ".txt,.csv,.json,.zip",
    formats: "TXT, CSV, JSON",
    validExts: ["txt", "csv", "json", "tsv"],
  },
  {
    id: "image" as UploadKind,
    label: "Images",
    sub: "Classification, OCR",
    icon: ImageIcon,
    accept: ".jpg,.jpeg,.png,.webp,.zip",
    formats: "JPG, PNG, WEBP",
    validExts: ["jpg", "jpeg", "png", "webp", "gif", "bmp"],
  },
]

const VISIBILITY_OPTIONS: { id: Visibility; label: string; sub: string; icon: LucideIcon}[] = [
  {
    id: "private",
    label: "Privé",
    sub: "Vous seul",
    icon: Lock,
  },
  {
    id: "team",
    label: "Équipe",
    sub: "Membres de votre espace",
    icon: Users,
  },
  {
    id: "public",
    label: "Public",
    sub: "Visible par tous",
    icon: Globe,
  },
]


const Upload = () => {
  const [step, setStep] = useState(0)

  // Step 1
  const [dataType, setDataType] = useState<UploadKind>("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Step 2
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("team")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentTaskType = TASK_TYPES.find((t) => t.id === dataType)
  const uploadDisabled = dataType === ""

  const step1Valid =
    dataType !== "" &&
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.progress === 100) &&
    uploadedFiles.every((f) => !f.isZip || f.detectedCount !== undefined)

  const step2Valid = name.trim() !== ""

  const audioPreviewFiles: AudioFilePreview[] = uploadedFiles
  .filter(f => f.progress === 100)
  .slice(0, 3)
  .map((f, i) => ({
    id: f.id,
    name: f.isZip ? `extrait_${i + 1}.wav` : f.name,
    duration: "2min 14s",   // en prod : lu depuis les métadonnées
    sizeMb: formatBytes(f.size / Math.max(f.detectedCount ?? 1, 1)),
  }))

  const imagePreviewFiles: ImageFilePreview[] = uploadedFiles
  .filter(f => f.progress === 100)
  .slice(0, 3)
  .map((f, i) => ({
    id: f.id,
    name: f.isZip ? `image_${i + 1}.jpg` : f.name,
    sizeMb: formatBytes(f.size / Math.max(f.detectedCount ?? 1, 1)),
    url: f.sampleUrls?.[i] ?? `https://picsum.photos/seed/${f.id}-${i}/640/360`,
  }))

    const textReadyFiles = uploadedFiles.filter(f => f.progress === 100 && dataType === "text")

    const hasCsv = textReadyFiles.some(f => 
      f.isZip ? false : f.name.match(/\.(csv|tsv)$/i)
    )

    const csvPreviewFiles: CsvFilePreview[] = hasCsv
      ? textReadyFiles
          .filter(f => f.name.match(/\.(csv|tsv)$/i))
          .slice(0, 1)
          .map(f => ({
            id: f.id,
            name: f.name,
            sizeMb: formatBytes(f.size),
            headers: ["id", "texte", "langue", "source", "label"],
            rows: [
              ["001", "Mo gbɔn fon ɖé...", "fon", "marché_cotonou", "positif"],
              ["002", "Emi fẹ́ràn ọjà yìí", "yoruba", "marché_lagos", "positif"],
              ["003", "Nga ñëw ci dëkk bi", "wolof", "dakar_plateau", "neutre"],
              ["004", "M'bɛ a kɔ sɛ...", "baoulé", "abidjan_adjamé", "négatif"],
              ["005", "Nde, o di mma...", "igbo", "enugu_market", "positif"],
            ],
          }))
      : []

    const textPreviewFiles: TextFilePreview[] = !hasCsv && textReadyFiles.length > 0
      ? textReadyFiles.slice(0, 1).map(f => ({
          id: f.id,
          name: f.name,
          sizeMb: formatBytes(f.size),
          type: (f.name.endsWith(".json") ? "json" : "txt") as "json" | "txt",
          lines: f.name.endsWith(".json")
            ? ['[', '  { "id": 1, "text": "Mo gbɔn fon ɖé...", "lang": "fon" },', '  { "id": 2, "text": "Emi fẹ́ràn ọjà yìí", "lang": "yoruba" }', ']']
            : ["Mo gbɔn fon ɖé doka tɔn...", "Emi fẹ́ràn ọjà yìí gan-an", "Nga ñëw ci dëkk bi tey"],
        }))
      : []

  const totalIgnored = uploadedFiles.reduce(
    (acc, f) => acc + (f.ignoredCount ?? 0), 0
  )
  const ignoredExtensions = [
    ...new Set(
      uploadedFiles.flatMap(f => f.ignoredExtensions ?? [])
    )
  ]

  const detectedExts = [
  ...new Set(
    uploadedFiles
      .filter(f => f.progress === 100)
      .flatMap(f => f.ignoredExtensions ? [] : [f.name.split('.').pop() ?? ''])
      .filter(Boolean)
  )
]

 
  const totalRetainedFiles = uploadedFiles.reduce((acc, f) => {
    if (f.isZip) return acc + (f.detectedCount ?? 0)
    return acc + 1
  }, 0)

  const totalSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0)

 
  const runZipAnalysis = useCallback((id: string, taskType: typeof TASK_TYPES[0]) => {
    setTimeout(() => {
      const analysis = simulateZipAnalysis(taskType.validExts)
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...analysis } : f))
      )
    }, 600)
  }, [])

  const processFiles = useCallback((files: File[]) => {
      const MAX_DIRECT = 20

      // Sépare valides et invalides
      const validFiles: File[] = []
      const invalidFiles: { name: string; ext: string }[] = []

      files.forEach((file) => {
        const isZip = file.name.toLowerCase().endsWith(".zip")
        const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

        if (!isZip && !currentTaskType?.validExts.includes(ext)) {
          invalidFiles.push({ name: file.name, ext })
        } else {
          validFiles.push(file)
        }
      })

      // Toast récap une seule fois
      if (invalidFiles.length > 0 && validFiles.length > 0) {
        const exts = [...new Set(invalidFiles.map(f => `.${f.ext}`))].join(", ")
        toast.warning(`${invalidFiles.length} fichier(s) ignoré(s)`, {
          description: `Formats non supportés : ${exts.toUpperCase()}. ${validFiles.length} fichier(s) accepté(s).`,
        })
      } else if (invalidFiles.length > 0 && validFiles.length === 0) {
        const exts = [...new Set(invalidFiles.map(f => `.${f.ext}`))].join(", ")
        toast.error("Aucun fichier compatible", {
          description: `Formats non supportés : ${exts.toUpperCase()}. Formats acceptés : ${currentTaskType?.formats}`,
        })
        return
      }

      if (validFiles.length > MAX_DIRECT) {
        toast.warning(`${validFiles.length} fichiers sélectionnés`, {
          description: "Pour plus de 20 fichiers, préférez un ZIP.",
        })
      }

      // Upload uniquement les valides
      validFiles.forEach((file) => {
          const id = crypto.randomUUID()
          const isZip = file.name.toLowerCase().endsWith(".zip")

          const newFile: UploadedFile = {
            id,
            name: file.name,
            size: file.size,
            progress: 0,
            isZip,
          }

          setUploadedFiles((prev) => [...prev, newFile])

          let progress = 0
          const interval = setInterval(() => {
            progress += Math.random() * 18 + 4
            if (progress >= 100) {
              progress = 100
              clearInterval(interval)
              setUploadedFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, progress: 100 } : f))
              )
              if (isZip && currentTaskType) runZipAnalysis(id, currentTaskType)
            } else {
              setUploadedFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, progress: Math.round(progress) } : f))
              )
            }
          }, 150)
        })
    }, [currentTaskType, runZipAnalysis])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (uploadDisabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) processFiles(files)
  }, [uploadDisabled, processFiles])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!uploadDisabled) setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) processFiles(files)
    e.target.value = ""
  }

  const removeFile = (id: string) =>
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))

  const pendingTypeChange = useRef<{ type: UploadKind; timer: ReturnType<typeof setTimeout> } | null>(null)

    const handleTaskTypeChange = (type: UploadKind) => {
      if (type === dataType) return

      // Annule un changement en attente
      if (pendingTypeChange.current) {
        clearTimeout(pendingTypeChange.current.timer)
        toast.dismiss("type-change")
      }

      if (uploadedFiles.length === 0) {
        setDataType(type)
        return
      }

      // Toast avec compte à rebours
      const timer = setTimeout(() => {
        setDataType(type)
        setUploadedFiles([])
        pendingTypeChange.current = null
        toast.dismiss("type-change")
      }, 5000)

      pendingTypeChange.current = { type, timer }

      const newLabel = TASK_TYPES.find(t => t.id === type)?.label

      toast.warning(`Passage vers "${newLabel}"`, {
        id: "type-change",
        description: "Les fichiers uploadés seront supprimés dans 5s.",
        duration: 5000,
        action: {
          label: "Annuler",
          onClick: () => {
            clearTimeout(pendingTypeChange.current?.timer)
            pendingTypeChange.current = null
          },
        },
      })
    }

  //Tags
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-")
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags((prev) => [...prev, tag])
    }
    setTagInput("")
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  //Submit
  const handleSubmit = () => {
    toast.success("Dataset uploadé !", {
      description: `"${name}" a été ajouté avec succès.`,
    })
  }

  //Recap for footer
  const VisibilityIcon = VISIBILITY_OPTIONS.find((v) => v.id === visibility)?.icon ?? Lock

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* Header */}
      <div className="top-0 z-10 flex w-full px-6 items-center py-3 border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        <div>
          <h1 className="font-bold text-[25px]">
            Uploader un <span className="text-secondary">dataset</span>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Centralisez vos données et préparez-les pour l'annotation
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        <Stepper value={step} onValueChange={setStep} className='flex items-center justify-center'>

          <StepperList className='max-w-md '>
            <StepperItem step={0} canContinue={step1Valid}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Type & fichier</StepperTitle>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={1} canContinue={true}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Previsualisation</StepperTitle>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={2} canContinue={step2Valid}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>Informations</StepperTitle>
              </StepperTrigger>
            </StepperItem>
          </StepperList>

          {/* Step 1 : Type + File*/}
          <StepperPanel step={0}>
            <div className="grid gap-6">

              {/* Task type — must be selected first */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-base font-semibold mb-1">Type de tâche</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Requis avant d'uploader — détermine les formats acceptés
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {TASK_TYPES.map(({ id, label, sub, icon: Icon }) => (
                    <Card
                      key={id}
                      onClick={() => handleTaskTypeChange(id)}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-card border-2 ${
                        dataType === id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`h-7 w-7 transition-colors ${dataType === id ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-semibold text-sm">{label}</h3>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* File upload — blocked until type is chosen */}
              <Card className={`p-6 border-border transition-opacity duration-300 ${uploadDisabled ? "opacity-50 pointer-events-none select-none" : "bg-card"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold">Fichier source</h2>
                  {uploadDisabled && (
                    <span className="text-xs text-muted-foreground border border-border rounded-full px-2.5 py-0.5">
                      Choisissez un type d'abord
                    </span>
                  )}
                </div>

                {/* Drop zone — toujours visible pour permettre d'ajouter d'autres fichiers */}
                <label
                  htmlFor="file-input"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center gap-3 w-full rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                    uploadDisabled
                      ? "border-border cursor-not-allowed"
                      : isDragging
                        ? "border-primary bg-primary/5 cursor-copy"
                        : "border-border hover:border-primary/50 bg-white dark:bg-transparent hover:bg-muted/60 cursor-pointer"
                  }`}
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Glisse-dépose ou clique pour parcourir</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentTaskType
                        ? `${currentTaskType.formats} ou ZIP — max 2 Go · plusieurs fichiers acceptés`
                        : "Sélectionnez un type de tâche pour continuer"}
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    className="sr-only"
                    disabled={uploadDisabled}
                    accept={currentTaskType?.accept ?? ""}
                    onChange={handleInputChange}
                  />
                </label>

                {/* Liste des fichiers uploadés */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((uploadedFile) => (
                      <div key={uploadedFile.id} className="rounded-lg border border-border bg-muted p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <span className="text-[10px] font-bold text-primary uppercase">
                              {uploadedFile.name.split(".").pop()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                {formatBytes(uploadedFile.size)}
                              </span>
                            </div>

                            {uploadedFile.progress < 100 && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-200"
                                    style={{ width: `${uploadedFile.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">
                                  {uploadedFile.progress}%
                                </span>
                              </div>
                            )}

                            {uploadedFile.progress === 100 && !uploadedFile.isZip && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Fichier prêt
                              </div>
                            )}

                            {uploadedFile.progress === 100 && uploadedFile.isZip && uploadedFile.detectedCount === undefined && (
                              <div className="text-xs text-muted-foreground animate-pulse">
                                Analyse du contenu du ZIP…
                              </div>
                            )}

                            {uploadedFile.progress === 100 && uploadedFile.isZip && uploadedFile.detectedCount !== undefined && (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {/* On affiche le nombre de fichiers extraits, pas le nom du ZIP */}
                                  <span className="font-medium">{uploadedFile.detectedCount} fichiers retenus</span>
                                  {currentTaskType && (
                                    <span className="text-muted-foreground">({currentTaskType.formats})</span>
                                  )}
                                </div>
                                {uploadedFile.ignoredCount !== undefined && uploadedFile.ignoredCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {uploadedFile.ignoredCount} ignorés
                                    {uploadedFile.ignoredExtensions?.length
                                      ? ` · ${uploadedFile.ignoredExtensions.join(", ").toUpperCase()}`
                                      : ""}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeFile(uploadedFile.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            title="Retirer le fichier"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Compteur récapitulatif — affiche les fichiers qui entreront dans le dataset */}
                    {uploadedFiles.every((f) => f.progress === 100) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 pl-1">
                        <Files className="h-3.5 w-3.5" />
                        <span>
                          {uploadedFiles.length} source{uploadedFiles.length > 1 ? "s" : ""} ·{" "}
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {totalRetainedFiles} fichier{totalRetainedFiles > 1 ? "s" : ""} retenus
                          </span>{" "}
                          · {formatBytes(totalSize)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <StepperFooter>
              <span className="max-w-[60%] block">
                {(dataType || uploadedFiles.length > 0) && (
                  <div className="space-y-1">
                    {dataType && currentTaskType && (() => {
                      const Icon = currentTaskType.icon
                      return (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-semibold text-primary text-sm flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {currentTaskType.label}
                          </p>
                        </div>
                      )
                    })()}
                    {uploadedFiles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Files className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground font-medium">
                          {uploadedFiles.length} source{uploadedFiles.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {formatBytes(totalSize)}
                        </p>
                        {uploadedFiles.every((f) => f.progress === 100) && totalRetainedFiles > 0 && (
                          <>
                            <span className="text-border select-none">·</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                              {totalRetainedFiles} retenus
                            </span>
                          </>
                        )}
                        {uploadedFiles.some((f) => f.isZip && f.ignoredCount && f.ignoredCount > 0) && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400 shrink-0">
                            <AlertCircle className="h-3 w-3" />
                            {uploadedFiles.reduce((acc, f) => acc + (f.ignoredCount ?? 0), 0)} ignorés
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </span>
              <StepperNext canContinue={step1Valid}>Continuer</StepperNext>
            </StepperFooter>
          </StepperPanel>

          {/* Step 2: Previsualisation */}
          <StepperPanel step={1}>
            <PreviewStep
              dataType={dataType}
              totalRetainedFiles={totalRetainedFiles}
              totalSize={totalSize}
              totalIgnored={totalIgnored}
              ignoredExtensions={ignoredExtensions}
              audioFiles={audioPreviewFiles}
              imageFiles={imagePreviewFiles}
              csvFiles={csvPreviewFiles}
              textFiles={textPreviewFiles}
              detectedExts={detectedExts}
            />
           
          </StepperPanel>

          {/* Step 3 : Informations */}

          <StepperPanel step={2}>
            <div className="grid gap-6">

              {/* Nom + Description */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-base font-semibold mb-4">Informations du dataset</h2>
                <div className="space-y-4">
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor="name">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex : Wolof Speech Corpus 2025"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez le contenu, la source et l'objectif de ce dataset…"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Visibilité */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-base font-semibold mb-1">Visibilité</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Définissez qui peut accéder à ce dataset
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {VISIBILITY_OPTIONS.map(({ id, label, sub, icon: Icon }) => (
                    <Card
                      key={id}
                      onClick={() => setVisibility(id)}
                      className={`p-4 cursor-pointer transition-all duration-200 border-2 hover:shadow-card ${
                        visibility === id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`h-6 w-6 transition-colors ${visibility === id ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="font-semibold text-sm">{label}</h3>
                      <p className="text-xs text-muted-foreground ">{sub}</p>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Tags */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold">Tags</h2>
                  <span className="text-xs text-muted-foreground">{tags.length}/8</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Facilitez la recherche et le filtrage de vos datasets
                </p>
                <div className={`flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-10.5 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${tags.length >= 8 ? "opacity-60" : ""}`}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center justify-between gap-1 rounded-full bg-primary/10 pl-2 pr-1 py-0.5 text-xs font-medium text-primary"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <Button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white text-muted-foreground transition-colors ml-0.5 h-6 w-6 p-2.5 rounded-full"
                      >
                        <X className='h-2 w-2'/>
                      </Button>
                    </span>
                  ))}
                  {tags.length < 8 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => tagInput.trim() && addTag(tagInput)}
                      placeholder={tags.length === 0 ? "Ajouter des tags… (Entrée ou virgule pour valider)" : ""}
                      className="flex-1 min-w-35 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  )}
                </div>
              </Card>
            </div>

            {/* Footer step 2 — full recap before submit */}
            <StepperFooter>
              <span className="max-w-[60%] block">
                {name && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold text-primary text-sm truncate max-w-55">{name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Type */}
                      {currentTaskType && (() => {
                        const Icon = currentTaskType.icon
                        return (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon className="h-3 w-3" />
                            {currentTaskType.label}
                          </span>
                        )
                      })()}
                      <span className="text-border select-none">·</span>
                      <span className="text-xs text-muted-foreground">
                        {totalRetainedFiles} fichier{totalRetainedFiles > 1 ? "s" : ""}
                      </span>
                      <span className="text-border select-none">·</span>
                      {/* Visibility */}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <VisibilityIcon className="h-3 w-3" />
                        {VISIBILITY_OPTIONS.find((v) => v.id === visibility)?.label}
                      </span>
                      {/* Tags */}
                      {tags.length > 0 && (
                        <>
                          <span className="text-border select-none">·</span>
                          <span className="text-xs text-muted-foreground">
                            {tags.length} tag{tags.length > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </span>
              <div className="flex items-center gap-3">
                <StepperPrevious />
                <StepperNext canContinue={step2Valid} onComplete={handleSubmit}>
                  Uploader le dataset
                </StepperNext>
              </div>
            </StepperFooter>
          </StepperPanel>

        </Stepper>
      </div>
    </div>
  )
}

export default Upload