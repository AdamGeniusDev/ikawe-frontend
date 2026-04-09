"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, Share2, Database, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Upload,
    title: "Upload & Centralisation",
    description:
      "Importez vos données depuis diverses sources et créez des datasets unifiés en quelques clics.",
    accent: false,
  },
  {
    icon: Sparkles,
    title: "Annotation Intelligente",
    description:
      "Annotation automatique avec IA ou manuelle avec des outils adaptés à chaque type de donnée.",
    accent: true, // card mise en avant
  },
  {
    icon: Share2,
    title: "Publication Facile",
    description:
      "Partagez vos datasets enrichis avec la communauté — comme sur Kaggle, mais pour l'Afrique.",
    accent: false,
  },
  {
    icon: Database,
    title: "Agrégation de Données",
    description:
      "Fusionnez plusieurs datasets similaires pour créer des corpus plus riches et cohérents.",
    accent: false,
  },
  {
    icon: Search,
    title: "Recherche Avancée",
    description:
      "Trouvez facilement les datasets dont vous avez besoin avec des filtres puissants.",
    accent: false,
  },
  {
    icon: Users,
    title: "Gestion Collaborative",
    description:
      "Workflow complet avec rôles, validation et révision par des annotateurs.",
    accent: false,
  },
];

// ─── Sub-component mémoïsé pour éviter les re-renders inutiles ───────────────

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: boolean;
};

const FeatureCard = memo(function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = false,
}: FeatureCardProps) {
  return (
    <Card
      className={`
        p-6 border-border transition-all duration-300
        hover:-translate-y-1 hover:shadow-card
        ${accent
          ? "bg-primary text-white border-primary"
          : "bg-gradient-card"
        }
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center mb-4
          ${accent ? "bg-secondary" : "bg-secondary"}
        `}
      >
        <Icon
          className={`h-6 w-6 ${accent ? "text-white" : "text-primary"}`}
          aria-hidden="true"
        />
      </div>
      <h3
        className={`text-xl font-semibold mb-2 ${
          accent ? "text-white" : ""
        }`}
      >
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${accent ? "text-white/80" : "text-muted-foreground"}`}>
        {description}
      </p>
    </Card>
  );
});

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">

        {/* Header — layout asymétrique : titre à gauche, description à droite */}
        <div className="flex flex-col items-center gap-4 mb-16 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Fonctionnalités{" "}
            <span className="text-secondary">Puissantes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tout ce dont vous avez besoin pour gérer vos données africaines en un seul endroit
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}