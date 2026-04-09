"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";

// ─── Icônes SVG inline — robustes, zéro dépendance asset ─────────────────────

const SpeechIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <rect width="56" height="56" rx="16" fill="#C8963E" fillOpacity="0.12" />
    <path
      d="M28 14c-5.523 0-10 4.477-10 10v4a10 10 0 0020 0v-4c0-5.523-4.477-10-10-10z"
      stroke="#C8963E"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 28c0 7.732 6.268 14 14 14s14-6.268 14-14"
      stroke="#C8963E"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line x1="28" y1="42" x2="28" y2="46" stroke="#C8963E" strokeWidth="2" strokeLinecap="round" />
    <line x1="23" y1="46" x2="33" y2="46" stroke="#C8963E" strokeWidth="2" strokeLinecap="round" />
    <line x1="22" y1="26" x2="26" y2="26" stroke="#0D1F0F" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="29" x2="30" y2="29" stroke="#0D1F0F" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="32" x2="27" y2="32" stroke="#0D1F0F" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TranslationIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <rect width="56" height="56" rx="16" fill="#C8963E" fillOpacity="0.12" />
    <path
      d="M14 20h16M22 14v6M16 26s2 4 6 6M32 26s-2 4-6 6"
      stroke="#C8963E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M30 34l4-10 4 10M31.5 31h5"
      stroke="#0D1F0F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26 16h14a2 2 0 012 2v14"
      stroke="#C8963E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="3 2"
    />
  </svg>
);

const ImageIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <rect width="56" height="56" rx="16" fill="#C8963E" fillOpacity="0.12" />
    <rect x="12" y="16" width="32" height="24" rx="3" stroke="#C8963E" strokeWidth="2" />
    <circle cx="21" cy="25" r="3" fill="#C8963E" fillOpacity="0.5" />
    <path
      d="M12 34l9-8 7 6 4-4 8 8"
      stroke="#C8963E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Bounding box */}
    <rect
      x="30"
      y="18"
      width="10"
      height="10"
      rx="1"
      stroke="#0D1F0F"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
    />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const dataTypes = [
  {
    Icon: SpeechIcon,
    title: "Speech / Audio",
    description: "TTS, STT, Speaker ID, reconnaissance d'émotions",
    features: [
      "Segmentation audio automatique",
      "Transcription multilingue",
      "Labellisation d'émotions",
      "Support multi-formats (WAV, MP3)",
    ],
  },
  {
    Icon: TranslationIcon,
    title: "Traduction & Texte",
    description: "Multilingue, dialectes, alignement de phrases",
    features: [
      "Traduction automatique",
      "Alignement de paires de phrases",
      "Support de dialectes africains",
      "Validation de cohérence",
    ],
  },
  {
    Icon: ImageIcon,
    title: "Images & Vision",
    description: "Classification, OCR, détection d'objets",
    features: [
      "Détection et labellisation d'objets",
      "Description visuelle automatique",
      "OCR multilingue",
      "Bounding boxes intelligentes",
    ],
  },
];

// ─── Sub-component mémoïsé ────────────────────────────────────────────────────

type DataTypeCardProps = (typeof dataTypes)[number];

const DataTypeCard = memo(function DataTypeCard({
  Icon,
  title,
  description,
  features,
}: DataTypeCardProps) {
  return (
    <Card className="p-8 bg-gradient-card border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="flex justify-center mb-6">
        <Icon />
      </div>

      <h3 className="text-2xl font-bold mb-1 text-center">{title}</h3>
      <p className="text-muted-foreground text-center text-sm mb-6">{description}</p>

      <ul className="space-y-3" aria-label={`Fonctionnalités ${title}`}>
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <div
              className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
});

// ─── Section ──────────────────────────────────────────────────────────────────

export default function DataTypes() {
  return (
    <section id="datatypes" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Types de{" "}
            <span className="text-secondary">Données Supportées</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Gérez tous vos types de données multimodales avec des outils spécialisés
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {dataTypes.map((type) => (
            <DataTypeCard key={type.title} {...type} />
          ))}
        </div>
      </div>
    </section>
  );
}