"use client"

// components/datasets/dialogs/Modal.tsx
// Wrapper dialog générique partagé par tous les dialogs datasets (basé sur shadcn/ui).

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps {
  title:     string
  subtitle?: string
  onClose:   () => void
  children:  React.ReactNode
  width?:    string
}

export function Modal({ title, subtitle, onClose, children, width = "max-w-md" }: ModalProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent 
        className={cn(
          "w-full rounded-2xl border p-0 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden gap-0",
          width
        )}
      >
        {/* En-tête du Dialog */}
        <DialogHeader className="px-5 py-4 border-b shrink-0 text-left space-y-0">
          <DialogTitle className="text-sm font-semibold">
            {title}
          </DialogTitle>
          
          {subtitle && (
            <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Corps défilant du Dialog */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}