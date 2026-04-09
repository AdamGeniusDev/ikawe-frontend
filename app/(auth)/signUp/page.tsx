"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";



const formSchema = z
  .object({
    fullName: z
      .string()
      .min(5, "Au moins 5 caractères."),
    userName: z
      .string()
      .min(3, "Au moins 3 caractères.")
      .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et _ uniquement."),
    email: z
      .string()
      .email("Adresse e-mail invalide."),
    password: z
      .string()
      .min(8, "Au moins 8 caractères.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Majuscule, minuscule, chiffre et caractère spécial requis."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;



function passwordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/\d/.test(pwd))             score++;
  if (/[@$!%*?&]/.test(pwd))      score++;
  return score; // 0-4
}

const STRENGTH_LABELS = ["", "Faible", "Moyen", "Bien", "Fort"];
const STRENGTH_COLORS = ["", "#E24B4A", "#EF9F27", "#C8963E", "#3B6D11"];



export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched", // validation à la sortie du champ, pas à chaque frappe
  });

  const pwd = form.watch("password");
  const strength = passwordStrength(pwd);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      console.log(data);
      // appel api pour l'envoie de donnee
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-0">

      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Retour à l'accueil Ikawe">
          <Image
            src="/assets/logo.svg"
            alt="Logo Ikawe"
            width={140}
            height={40}
            priority
            className="h-auto w-[140px]"
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

      {/* Formulaire */}
      <form
        id="sign-up-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Formulaire d'inscription"
      >
        <FieldGroup>

          {/* Nom complet + Nom d'utilisateur sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                    placeholder="Amara Diallo"
                    autoComplete="name"
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
            <Controller
              name="userName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Utilisateur</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                    placeholder="amara_d"
                    autoComplete="username"
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
          </div>

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
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  placeholder="amara@example.com"
                  autoComplete="email"
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

          {/* Mot de passe + indicateur de force */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={`pwd-strength ${fieldState.invalid ? `${field.name}-error` : ""}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {/* Barre de force */}
                {pwd && (
                  <div id="pwd-strength" aria-live="polite" className="mt-1.5">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-[3px] rounded-full transition-colors duration-300"
                          style={{
                            background: i <= strength ? STRENGTH_COLORS[strength] : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
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

          {/* Confirmer le mot de passe */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Confirmer le mot de passe</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  placeholder="••••••••"
                  autoComplete="new-password"
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

        </FieldGroup>
      </form>

      {/* Micro-reassurance */}
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Gratuit · Aucune carte requise
      </p>

      {/* CTA principal */}
      <Button
        form="sign-up-form"
        type="submit"
        disabled={isLoading}
        aria-label="Créer mon compte"
        className="w-full bg-primary hover:bg-secondary text-white h-11"
      >
        {isLoading ? "Création en cours…" : "Créer mon compte"}
      </Button>

       

      {/* Lien connexion */}
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
  );
}