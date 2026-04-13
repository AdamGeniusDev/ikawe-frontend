import { AudioLines, FileText, Globe, ImageIcon, Lock, MoreHorizontal, Sheet, Users } from "lucide-react"
import { Dataset } from "@/types/datasets"
import { Progress } from "../ui/progress"
import { formatDate } from "@/lib/utils"
import { Button } from "../ui/button"

export const DATA_TYPE_ICON: Record<string, React.ReactNode> = {
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
}

const STATUS_LABEL: Record<string, string> = {
  active: "Actif", draft: "Brouillon", completed: "Terminé",
}

const VISIBILITY_ICON: Record<string, React.ReactNode> = {
  private: <Lock size={12} />,
  team:    <Users size={12} />,
  public:  <Globe size={12} />,
}

interface DatasetCardProps {
  dataset: Dataset;
  isSelected?: boolean;
  onSelect?: (d: Dataset) => void;
  isSelectable?: boolean; 
}


export function DatasetCard({ dataset ,isSelected,onSelect,isSelectable}: DatasetCardProps) {
  return (
    <div 
    onClick={() => isSelectable && onSelect?.(dataset)}
    className={`flex flex-col justify-between rounded-xl border bg-white dark:bg-zinc-900 p-4 gap-3 hover:shadow-md transition-shadow  ease-out transition-all duration-300
    ${
      isSelectable? 'cursor-pointer hover:border-secondary shadow-sm':'shadow-sm hover:scale-102 transition-transform ease-out duration-300'
    }
    ${isSelected ? 'border-secondary ring-3 ring-secondary/50' : 'border-zinc-200'}
    `}>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {DATA_TYPE_ICON[dataset.dataType]}
            <span className="capitalize">{dataset.dataType}</span>
            </span>
          <span className="font-semibold text-sm truncate">{dataset.title}</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground shrink-0">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {dataset.description}
      </p>

      {/* Tags */}
      {dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dataset.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {tag}
            </span>
          ))}
          {dataset.tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              +{dataset.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progression */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{dataset.annotatedFiles.toLocaleString()} / {dataset.totalFiles.toLocaleString()} fichiers annotés</span>
          <span>{dataset.annotationProgress}%</span>
        </div>
        <Progress value={dataset.annotationProgress} className="h-1.5"/>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
        <span>{dataset.sizeMb >= 1024 ? `${(dataset.sizeMb / 1024).toFixed(1)} GB` : `${dataset.sizeMb} MB`}</span>
        <span>·</span>
        <span>{formatDate(dataset.createdAt)}</span>
        <span>·</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[dataset.status]}`}>
          {STATUS_LABEL[dataset.status]}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {VISIBILITY_ICON[dataset.visibility]}
          <span className="capitalize">{dataset.visibility}</span>
        </div>
        {
          isSelectable? 
          (<span className="text-[11px] text-muted-foreground items-center">
            {dataset.annotationProgress === 0 ? 'Annoter': dataset.annotationProgress === 100? 'Reviser': "Continuer l'annotation"}
          </span>) :
          <Button size="sm" variant="outline" className="h-7 text-xs px-3">
          {dataset.annotationProgress === 0 ? 'Annoter': dataset.annotationProgress === 100? 'Reviser': "Continuer l'annotation"}
        </Button>
        }
        
      </div>
    </div>
  )
}
