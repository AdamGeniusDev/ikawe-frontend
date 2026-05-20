"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────────

type StepStatus = "upcoming" | "current" | "completed"

interface StepperContextValue {
  value: number
  onValueChange: (step: number) => void
  totalSteps: number
  setTotalSteps: (n: number) => void
  canContinueMap: Map<number, boolean>
  registerStep: (step: number, canContinue: boolean) => void
  orientation: "horizontal" | "vertical"
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

function useStepperContext() {
  const ctx = React.useContext(StepperContext)
  if (!ctx) throw new Error("Stepper : composant utilisé hors de <Stepper>")
  return ctx
}

interface StepItemContextValue {
  step: number
  status: StepStatus
  canContinue: boolean
}

const StepItemContext = React.createContext<StepItemContextValue | null>(null)

function useStepItemContext() {
  const ctx = React.useContext(StepItemContext)
  if (!ctx) throw new Error("Stepper : composant utilisé hors de <StepperItem>")
  return ctx
}

// ─────────────────────────────────────────────
// STEPPER (racine)
// ─────────────────────────────────────────────

export interface StepperProps {
  value: number
  onValueChange: (step: number) => void
  orientation?: "horizontal" | "vertical"
  className?: string
  children: React.ReactNode
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ value, onValueChange, orientation = "horizontal", className, children }, ref) => {
    const [totalSteps, setTotalSteps] = React.useState(0)
    const [canContinueMap, setCanContinueMap] = React.useState<Map<number, boolean>>(new Map())

    const registerStep = React.useCallback((step: number, canContinue: boolean) => {
      setCanContinueMap((prev) => {
        if (prev.get(step) === canContinue) return prev
        const next = new Map(prev)
        next.set(step, canContinue)
        return next
      })
    }, [])

    return (
      <StepperContext.Provider
        value={{ value, onValueChange, totalSteps, setTotalSteps, canContinueMap, registerStep, orientation }}
      >
        <div
          ref={ref}
          data-orientation={orientation}
          className={cn(
            "flex w-full",
            orientation === "horizontal" ? "flex-col gap-8" : "flex-row gap-8",
            className
          )}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

// ─────────────────────────────────────────────
// STEPPER LIST
// ─────────────────────────────────────────────

export interface StepperListProps {
  className?: string
  children: React.ReactNode
}

const StepperList = React.forwardRef<HTMLOListElement, StepperListProps>(
  ({ className, children }, ref) => {
    const { orientation, setTotalSteps } = useStepperContext()

    React.useEffect(() => {
      const count = React.Children.toArray(children).filter(
        (child): child is React.ReactElement =>
          React.isValidElement(child) &&
          (child.type as { displayName?: string }).displayName === "StepperItem"
      ).length
      setTotalSteps(count)
    }, [children, setTotalSteps])

    return (
      <ol
        ref={ref}
        role="list"
        className={cn(
          "flex w-full items-center",
          orientation === "horizontal" ? "flex-row" : "flex-col items-start",
          className
        )}
      >
        {children}
      </ol>
    )
  }
)
StepperList.displayName = "StepperList"

// ─────────────────────────────────────────────
// STEPPER ITEM
// ─────────────────────────────────────────────

export interface StepperItemProps {
  step: number
  canContinue?: boolean
  className?: string
  children: React.ReactNode
}

const StepperItem = React.forwardRef<HTMLLIElement, StepperItemProps>(
  ({ step, canContinue = true, className, children }, ref) => {
    const { value, registerStep, orientation } = useStepperContext()

    const status: StepStatus =
      step < value ? "completed" : step === value ? "current" : "upcoming"

    React.useEffect(() => {
      registerStep(step, canContinue)
    }, [step, canContinue, registerStep])

    return (
      <StepItemContext.Provider value={{ step, status, canContinue }}>
        <li
          ref={ref}
          data-step={step}
          data-status={status}
          aria-current={status === "current" ? "step" : undefined}
          className={cn(
            "flex items-center",
            orientation === "horizontal" ? "flex-1 last:flex-none" : "w-full",
            className
          )}
        >
          {children}
        </li>
      </StepItemContext.Provider>
    )
  }
)
StepperItem.displayName = "StepperItem"

// ─────────────────────────────────────────────
// STEPPER TRIGGER
// ─────────────────────────────────────────────

export interface StepperTriggerProps {
  allowBack?: boolean
  className?: string
  children: React.ReactNode
}

const StepperTrigger = React.forwardRef<HTMLButtonElement, StepperTriggerProps>(
  ({ allowBack = true, className, children }, ref) => {
    const { onValueChange } = useStepperContext()
    const { step, status } = useStepItemContext()

    const isClickable = allowBack && status === "completed"

    return (
      <button
        ref={ref}
        type="button"
        disabled={!isClickable && status !== "current"}
        onClick={() => isClickable && onValueChange(step)}
        className={cn(
          "group inline-flex shrink-0 items-center gap-3 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          isClickable ? "cursor-pointer hover:opacity-70" : "cursor-default",
          className
        )}
      >
        {children}
      </button>
    )
  }
)
StepperTrigger.displayName = "StepperTrigger"

// ─────────────────────────────────────────────
// STEPPER INDICATOR
// ─────────────────────────────────────────────

export interface StepperIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

const StepperIndicator = React.forwardRef<HTMLSpanElement, StepperIndicatorProps>(
  ({ className, children }, ref) => {
    const { step, status } = useStepItemContext()

    return (
      <span
        ref={ref}
        aria-hidden="true"
        data-status={status}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200",
          status === "upcoming" && "border-border bg-background text-muted-foreground",
          status === "current" && "border-primary bg-primary text-primary-foreground shadow-md scale-105",
          status === "completed" && "border-primary bg-primary/10 text-primary",
          className
        )}
      >
        {children ?? (
          status === "completed"
            ? <Check className="h-4 w-4" strokeWidth={3} />
            : <span>{step + 1}</span>
        )}
      </span>
    )
  }
)
StepperIndicator.displayName = "StepperIndicator"

// ─────────────────────────────────────────────
// STEPPER TITLE
// ─────────────────────────────────────────────

const StepperTitle = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const { status } = useStepItemContext()
    return (
      <span
        ref={ref}
        className={cn(
          "text-sm font-semibold whitespace-nowrap transition-colors",
          status === "current" && "text-foreground",
          status === "completed" && "text-foreground/70",
          status === "upcoming" && "text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
StepperTitle.displayName = "StepperTitle"

// ─────────────────────────────────────────────
// STEPPER DESCRIPTION
// ─────────────────────────────────────────────

const StepperDescription = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
)
StepperDescription.displayName = "StepperDescription"

// ─────────────────────────────────────────────
// STEPPER SEPARATOR
// ─────────────────────────────────────────────

const StepperSeparator = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const { step, status } = useStepItemContext()
    const { totalSteps, orientation } = useStepperContext()

    if (step >= totalSteps - 1) return null

    return (
      <span
        ref={ref}
        role="separator"
        aria-hidden="true"
        data-status={status === "completed" ? "completed" : "upcoming"}
        className={cn(
          "block transition-colors duration-300",
          orientation === "horizontal"
            ? "h-[2px] flex-1 min-w-[1.5rem] mx-3"
            : "w-[2px] h-8 ml-4 my-1",
          status === "completed" ? "bg-primary" : "bg-border",
          className
        )}
        {...props}
      />
    )
  }
)
StepperSeparator.displayName = "StepperSeparator"

// ─────────────────────────────────────────────
// STEPPER PANEL
// ─────────────────────────────────────────────

export interface StepperPanelProps {
  step: number
  className?: string
  children: React.ReactNode
}

const StepperPanel = React.forwardRef<HTMLDivElement, StepperPanelProps>(
  ({ step, className, children }, ref) => {
    const { value } = useStepperContext()
    if (value !== step) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-label={`Étape ${step + 1}`}
        className={cn("w-full animate-in fade-in-0 duration-200 pb-[var(--stepper-footer-height,80px)]", className)}
      >
        {children}
      </div>
    )
  }
)
StepperPanel.displayName = "StepperPanel"

// ─────────────────────────────────────────────
// STEPPER FOOTER
// ─────────────────────────────────────────────

const StepperFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      if (!localRef.current) return

      const observer = new ResizeObserver(([entry]) => {
        const height = entry.contentRect.height
        document.documentElement.style.setProperty("--stepper-footer-height", `${height}px`)
      })

      observer.observe(localRef.current)

      return () => observer.disconnect()
    }, [])

    return (
    <div
      ref={(node) => {
          localRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref).current = node
        }}
      className={cn(

        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between",
        "bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border-t py-4 px-6",
        
        "lg:left-70",
        className
      )}
      {...props}
    />
)}
)
StepperFooter.displayName = "StepperFooter"

// ─────────────────────────────────────────────
// STEPPER NEXT
// ─────────────────────────────────────────────

export interface StepperNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  canContinue?: boolean
  onComplete?: () => void
}

const StepperNext = React.forwardRef<HTMLButtonElement, StepperNextProps>(
  ({ className, children = "Continuer", canContinue, onComplete, ...props }, ref) => {
    const { value, onValueChange, totalSteps, canContinueMap } = useStepperContext()

    const allowed = canContinue ?? canContinueMap.get(value) ?? true
    const isLast = value === totalSteps - 1

    function handleClick() {
      if (!allowed) return
      if (isLast) {
        onComplete?.()
      } else {
        onValueChange(value + 1)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={!allowed}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
          "bg-primary text-primary-foreground shadow-xs",
          "h-9 px-4 py-2 transition-all",
          "hover:bg-primary/90 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-40",
          className
        )}
        {...props}
      >
        {children}
        {!isLast && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>
    )
  }
)
StepperNext.displayName = "StepperNext"

// ─────────────────────────────────────────────
// STEPPER PREVIOUS
// ─────────────────────────────────────────────

export type StepperPreviousProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const StepperPrevious = React.forwardRef<HTMLButtonElement, StepperPreviousProps>(
  ({ className, children = "Retour", ...props }, ref) => {
    const { value, onValueChange } = useStepperContext()

    if (value === 0) return null

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onValueChange(value - 1)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
          "border border-input bg-background shadow-xs",
          "h-9 px-4 py-2 transition-all",
          "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {children}
      </button>
    )
  }
)
StepperPrevious.displayName = "StepperPrevious"

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export {
  Stepper,
  StepperList,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
  StepperPanel,
  StepperFooter,
  StepperNext,
  StepperPrevious,
}