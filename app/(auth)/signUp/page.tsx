"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SSOGroup, type SSOProvider } from "@/components/auth/SSOButton"
import { EyeIcon, EyeOffIcon } from "lucide-react"


const formSchema = z.object({
  fullName: z
    .string()
    .min(5, "Au moins 5 caractères."),
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise.")
    .email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(8, "Au moins 8 caractères.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Majuscule, minuscule, chiffre et caractère spécial requis."
    ),
})

type FormValues = z.infer<typeof formSchema>

// ─── Helpers force du mot de passe ────────────────────────────────────────────

function passwordStrength(pwd: string): number {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8)        score++
  if (/[A-Z]/.test(pwd))      score++
  if (/\d/.test(pwd))         score++
  if (/[@$!%*?&]/.test(pwd))  score++
  return score // 0–4
}

const STRENGTH_LABELS = ["", "Faible", "Moyen", "Bien", "Fort"]
const STRENGTH_COLORS = ["", "#E24B4A", "#EF9F27", "#C8963E", "#3B6D11"]


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const [isLoading,    setIsLoading]    = useState(false)
  const [ssoLoading,   setSSOLoading]   = useState<SSOProvider | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError,  setServerError]  = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", password: "" },
    mode: "onTouched",
  })

  const pwd      = form.watch("password")
  const strength = passwordStrength(pwd)

  // ── Inscription email / password ────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true)
      setServerError(null)
      console.log(data)
      // Appel api pour la creation de compte via inscription plateforme
      router.push("/dashboard")
    } catch (error) {
      setServerError("Une erreur est survenue. Veuillez réessayer.")
      console.error("Erreur d'inscription :", error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleSSO = async (provider: SSOProvider) => {
    try {
      setSSOLoading(provider)
      setServerError(null)
      // Appel api pour la creation de compte et connexion via SSO
      console.log(`SSO ${provider}`)
    } catch (error) {
      setServerError(`Impossible de continuer avec ${provider}. Réessayez.`)
      console.error(`Erreur SSO ${provider} :`, error)
    } finally {
      setSSOLoading(null)
    }
  }

  const anyLoading = isLoading || ssoLoading !== null

  return (
    <div className="w-full max-w-125 flex flex-col">

      {/* Logo */}
      <div className="mb-8">
        <Link href="/" aria-label="Retour à l'accueil Ikawe">
          <Image
            src="/assets/logo.svg"
            alt="Logo Ikawe"
            width={140}
            height={40}
            priority
            className="h-auto w-35"
          />
        </Link>
      </div>

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez la communauté des chercheurs africains
        </p>
      </div>

      {/* Erreur serveur */}
      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      {/* SSO — chemin le plus rapide, affiché en premier */}
      <SSOGroup
        onSSO={handleSSO}
        disabled={anyLoading}
        separator="ou créez un compte avec votre e-mail"
      />

      {/* Formulaire */}
      <form
        id="sign-up-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Formulaire d'inscription"
      >
        <FieldGroup>

          {/* Nom complet */}
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Amara Diallo"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  disabled={anyLoading}
                />
                {fieldState.invalid && (
                  <FieldError
                    id={`${field.name}-error`}
                    className="text-destructive text-xs"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* Email */}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Adresse e-mail</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="amara@example.com"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  disabled={anyLoading}
                />
                {fieldState.invalid && (
                  <FieldError
                    id={`${field.name}-error`}
                    className="text-destructive text-xs"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* Mot de passe avec toggle visibility */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      [
                        "pwd-strength",
                        fieldState.invalid ? `${field.name}-error` : "",
                      ].filter(Boolean).join(" ")
                    }
                    disabled={anyLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>

                {/* Indicateur de force */}
                {pwd && (
                  <div id="pwd-strength" aria-live="polite" className="mt-1.5">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-0.5 rounded-full transition-colors duration-300"
                          style={{
                            background: i <= strength
                              ? STRENGTH_COLORS[strength]
                              : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: STRENGTH_COLORS[strength] }}
                    >
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                )}

                {fieldState.invalid && (
                  <FieldError
                    id={`${field.name}-error`}
                    className="text-destructive text-xs"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

        </FieldGroup>
      </form>

      {/* Micro-reassurance */}
      <p className="text-xs text-muted-foreground mt-2 mb-4">
        Gratuit · Aucune carte requise
      </p>

      <Button
        form="sign-up-form"
        type="submit"
        disabled={anyLoading}
        aria-label="Créer mon compte"
        className="w-full bg-primary hover:bg-secondary text-white h-11"
      >
        {isLoading ? "Création en cours…" : "Créer mon compte"}
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Déjà un compte ?{" "}
        <Link
          href="/signIn"
          className="font-medium hover:underline"
          style={{ color: "#C8963E" }}
        >
          Se connecter
        </Link>
      </p>

    </div>
  )
}