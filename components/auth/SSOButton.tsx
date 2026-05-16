"use client"

import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SSOProvider = "google" | "github"

interface SSOButtonProps {
  provider: SSOProvider
  onClick: () => void
  disabled?: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SSO_CONFIG: Record<SSOProvider, {
  label: string
  icon:  React.ReactNode
}> = {
  google: {
    label: "Continuer avec Google",
    icon:  <FcGoogle size={18} aria-hidden />,
  },
  github: {
    label: "Continuer avec GitHub",
    icon:  <FaGithub size={18} aria-hidden />,
  },
}


export function SSOButton({ provider, onClick, disabled }: SSOButtonProps) {
  const { label, icon } = SSO_CONFIG[provider]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 h-10 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {icon}
      {label}
    </button>
  )
}


interface SSOGroupProps {
  onSSO:    (provider: SSOProvider) => void
  disabled?: boolean
  separator?: string
}

export function SSOGroup({
  onSSO,
  disabled,
  separator = "ou continuez avec votre e-mail",
}: SSOGroupProps) {
  return (
    <>
      <div className="flex flex-row gap-2.5">
        <SSOButton
          provider="google"
          onClick={() => onSSO("google")}
          disabled={disabled}
        />
        <SSOButton
          provider="github"
          onClick={() => onSSO("github")}
          disabled={disabled}
        />
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
          {separator}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </>
  )
}