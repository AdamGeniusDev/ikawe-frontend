import { AudioLines, FileText,ImageIcon,Sheet} from "lucide-react"
import { Dataset } from "@/types/datasets"
import { Button } from "../ui/button"

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
}

const STATUS_LABEL: Record<string, string> = {
  active: "Actif", draft: "Brouillon", completed: "Terminé",
}


export function LibraryCard({ dataset }: { dataset: Dataset }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border bg-white dark:bg-zinc-900 p-4 gap-3 hover:shadow-md transition-shadow hover:scale-105 ease-out transition-transform duration-300">
      
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
         <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {DATA_TYPE_ICON[dataset.dataType]}
            <span className="capitalize">{dataset.dataType}</span>
          </span>
          <span className="font-semibold text-sm truncate">{dataset.title}</span>
        </div>
        {dataset.price > 0 && (
          <span className="text-[11px] font-bold text-emerald-600 shrink-0">
            {dataset.price.toLocaleString()} F
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {dataset.description}
      </p>

      {dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dataset.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{dataset.totalFiles.toLocaleString()} fichiers</span>
        <span>·</span>
        <span>{dataset.sizeMb >= 1024 ? `${(dataset.sizeMb / 1024).toFixed(1)} GB` : `${dataset.sizeMb} MB`}</span>
        <span>·</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[dataset.status]}`}>
          {STATUS_LABEL[dataset.status]}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t">
        <span className="text-[11px] text-muted-foreground">100% annoté</span>
        <Button size="sm" className={`h-7 text-xs px-3 ${dataset.price > 0 ? 'bg-primary':'bg-secondary'}`}>
          {dataset.price > 0 ? "Acheter" : "Télécharger"}
        </Button>
      </div>
    </div>
  )
}
