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



const formSchema = z.object({
  email: z.string().min(1, "L'adresse e-mail est requise.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

type FormValues = z.infer<typeof formSchema>;



export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setServerError(null);
      console.log(data);
      // appel API connexion
    } catch (error) {
      setServerError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
      console.error("Erreur lors de la connexion :", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-0">

      {/* Logo */}
      <div className="mb-8">
        <Link href="/" aria-label="Retour à l'accueil Ikawe">
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
        <h1 className="text-xl font-bold mb-1">Se connecter</h1>
        <p className="text-sm text-muted-foreground">
          Quel plaisir de vous revoir ! Connectez-vous pour voir ce que vous avez manqué.
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

      <form
        id="sign-in"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Formulaire de connexion"
      >
        <FieldGroup>

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

          {/* Mot de passe */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
                    style={{ color: "#C8963E" }}
                    tabIndex={0}
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  placeholder="••••••••"
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

       
        <Button
          type="submit"
          disabled={isLoading}
          aria-label="Se connecter"
          className="w-full bg-primary hover:bg-secondary text-white h-11 mt-6"
        >
          {isLoading ? "Connexion en cours…" : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Pas encore de compte ?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium hover:underline"
          style={{ color: "#C8963E" }}
        >
          S'inscrire
        </Link>
      </p>
    </div>
  );
}