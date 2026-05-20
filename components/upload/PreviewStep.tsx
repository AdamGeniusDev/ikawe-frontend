"use client"

import { AudioPreview, AudioFilePreview } from "./AudioPreview"
import { ImagePreview, ImageFilePreview } from "./ImagePreview"
import { StepperFooter, StepperNext, StepperPrevious } from "@/components/ui/stepper"
import { AlertCircle, CheckCircle2} from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"
import { CsvFilePreview, CsvPreview } from "./CsvPreview"
import { TextFilePreview, TextPreview } from "./TextPreview"

// Les données de preview sont construites dans Upload.tsx
// puis passées ici — ce composant n'a pas de state propre.

interface PreviewStepProps {
  dataType: "audio" | "text" | "image" | ""
  totalRetainedFiles: number
  totalSize: number
  totalIgnored: number
  ignoredExtensions: string[]
  audioFiles?: AudioFilePreview[]
  imageFiles?: ImageFilePreview[]
  csvFiles?:   CsvFilePreview[]
  textFiles?:  TextFilePreview[]
  textSample?: string[]
  detectedExts: string[] 
}

export function PreviewStep({
  dataType,
  totalRetainedFiles,
  totalSize,
  totalIgnored,
  ignoredExtensions,
  audioFiles = [],
  imageFiles = [],
  csvFiles = [],
  textFiles = [],
  detectedExts
}: PreviewStepProps) {
  return (
    <div className="grid gap-6">
      
      {/* Récap général */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-base font-semibold mb-4">Récapitulatif de l'upload</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Fichiers retenus</p>
            <p className="text-2xl font-semibold">
              {totalRetainedFiles.toLocaleString()}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Taille totale</p>
            <p className="text-2xl font-semibold">{formatBytes(totalSize)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Ignorés</p>
            <p className={`text-2xl font-semibold ${
              totalIgnored > 0 ? "text-amber-600 dark:text-amber-400" : ""
            }`}>
              {totalIgnored}
            </p>
          </div>
        </div>

        {/* Avertissement fichiers ignorés */}
        {totalIgnored > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {totalIgnored} fichier{totalIgnored > 1 ? "s" : ""} ignoré{totalIgnored > 1 ? "s" : ""} 
              {ignoredExtensions.length > 0 && (
                <> : format non supporté ({ignoredExtensions.join(", ").toUpperCase()})</>
              )}
            </p>
          </div>
        )}

        {totalIgnored === 0 && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Tous les fichiers sont compatibles
          </div>
        )}
      </Card>

      {/* Aperçu selon le type */}
      <Card className="p-6 bg-card border-border">
        {dataType === "audio" && audioFiles && audioFiles.length > 0 && (
            <AudioPreview
                files={audioFiles.slice(0, 3)}
                totalCount={totalRetainedFiles}
                detectedExts={detectedExts}
            />
            )}

            {dataType === "image" && imageFiles && imageFiles.length > 0 && (
            <ImagePreview
                files={imageFiles.slice(0, 3)}
                totalCount={totalRetainedFiles}
                detectedExts={detectedExts}
            />
            )}

            {dataType === "text" && csvFiles && csvFiles.length > 0 && (
            <CsvPreview
                files={csvFiles.slice(0, 1)}
                totalCount={totalRetainedFiles}
                detectedExts={detectedExts}
            />
            )}

            {dataType === "text" && textFiles && textFiles.length > 0 && !csvFiles?.length && (
            <TextPreview
                files={textFiles.slice(0, 1)}
                totalCount={totalRetainedFiles}
                detectedExts={detectedExts}
            />
            )}
      </Card>

      <StepperFooter>
        <span className="text-xs text-muted-foreground">
          {totalRetainedFiles} fichier{totalRetainedFiles > 1 ? "s" : ""} prêts 
          à être indexés
        </span>
        <div className="flex items-center gap-3">
          <StepperPrevious />
          <StepperNext canContinue={totalRetainedFiles > 0}>
            Continuer
          </StepperNext>
        </div>
      </StepperFooter>
    </div>
  )
}