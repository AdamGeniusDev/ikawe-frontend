"use client";

import { useEffect, useState,useRef } from "react";
import dynamic from "next/dynamic";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

// ─── Globe config ─────────────────────────────────────────────────────────────

const globeConfig = {
  pointSize: 3,
  globeColor: "#ffffff",
  showAtmosphere: true,
  atmosphereColor: "#C8963E",
  atmosphereAltitude: 0.08,
  emissive: "#ffffff",
  emissiveIntensity: 0.05,
  shininess: 0.6,
  polygonColor: "rgba(13,31,15,0.3)",
  ambientLight: "#ffffff",
  directionalLeftLight: "#C8963E",
  directionalTopLight: "#ffffff",
  pointLight: "#C8963E",
  arcTime: 1200,
  arcLength: 0.85,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 14.6937, lng: -17.4441 }, // Dakar centré
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

// Palette brand
const COLORS = [
  "#C8963E", // or brand principal
  "#E0AA55", // or medium
  "#C8963E", // or brand — fréquence doublée
  "#0D1F0F", // vert brand profond
  "#1A3D1C", // vert brand clair
] as const;

// ─── Arcs statiques — déclarés HORS du composant pour être stables ─────────────
// Majorité partent/arrivent en Afrique pour renforcer le message "ancré en Afrique"
const SAMPLE_ARCS = [
  // Rayonnement depuis l'Afrique de l'Ouest (hub principal)
  { order: 1,  startLat: 14.6937,   startLng: -17.4441,  endLat: 48.8566,    endLng: 2.3522,    arcAlt: 0.4, color: "#C8963E" }, // Dakar → Paris
  { order: 1,  startLat: 14.6937,   startLng: -17.4441,  endLat: 40.7128,    endLng: -74.006,   arcAlt: 0.5, color: "#E0AA55" }, // Dakar → New York
  { order: 1,  startLat: 14.6937,   startLng: -17.4441,  endLat: 6.3703,     endLng: 2.3912,    arcAlt: 0.1, color: "#0D1F0F" }, // Dakar → Cotonou
  { order: 2,  startLat: 6.5244,    startLng: 3.3792,    endLat: 51.5072,    endLng: -0.1276,   arcAlt: 0.35, color: "#C8963E" }, // Lagos → Londres
  { order: 2,  startLat: 6.5244,    startLng: 3.3792,    endLat: 1.3521,     endLng: 103.8198,  arcAlt: 0.5, color: "#E0AA55" }, // Lagos → Singapour
  { order: 2,  startLat: 6.5244,    startLng: 3.3792,    endLat: 14.6937,    endLng: -17.4441,  arcAlt: 0.1, color: "#1A3D1C" }, // Lagos → Dakar
  { order: 3,  startLat: -1.2921,   startLng: 36.8219,   endLat: 28.6139,    endLng: 77.209,    arcAlt: 0.4, color: "#C8963E" }, // Nairobi → Delhi
  { order: 3,  startLat: -1.2921,   startLng: 36.8219,   endLat: 35.6762,    endLng: 139.6503,  arcAlt: 0.5, color: "#E0AA55" }, // Nairobi → Tokyo
  { order: 3,  startLat: -1.2921,   startLng: 36.8219,   endLat: 6.5244,     endLng: 3.3792,    arcAlt: 0.2, color: "#0D1F0F" }, // Nairobi → Lagos
  { order: 4,  startLat: -25.7479,  startLng: 28.2293,   endLat: 34.0522,    endLng: -118.2437, arcAlt: 0.6, color: "#C8963E" }, // Pretoria → LA
  { order: 4,  startLat: -25.7479,  startLng: 28.2293,   endLat: -1.2921,    endLng: 36.8219,   arcAlt: 0.25, color: "#1A3D1C" }, // Pretoria → Nairobi
  { order: 4,  startLat: 3.848,     startLng: 11.5021,   endLat: 48.8566,    endLng: 2.3522,    arcAlt: 0.35, color: "#E0AA55" }, // Yaoundé → Paris
  { order: 5,  startLat: 12.3647,   startLng: -1.5338,   endLat: 51.5072,    endLng: -0.1276,   arcAlt: 0.4, color: "#C8963E" }, // Ouaga → Londres
  { order: 5,  startLat: 5.5600,    startLng: -0.2057,   endLat: 52.52,      endLng: 13.405,    arcAlt: 0.4, color: "#0D1F0F" }, // Accra → Berlin
  { order: 5,  startLat: 18.0735,   startLng: -15.9582,  endLat: 14.6937,    endLng: -17.4441,  arcAlt: 0.05, color: "#1A3D1C" }, // Nouakchott → Dakar
  // Connexions inter-africaines
  { order: 6,  startLat: 33.9716,   startLng: -6.8498,   endLat: 6.5244,     endLng: 3.3792,    arcAlt: 0.2, color: "#C8963E" }, // Rabat → Lagos
  { order: 6,  startLat: 30.0444,   startLng: 31.2357,   endLat: -1.2921,    endLng: 36.8219,   arcAlt: 0.2, color: "#E0AA55" }, // Le Caire → Nairobi
  { order: 7,  startLat: 15.5007,   startLng: 32.5599,   endLat: 3.848,      endLng: 11.5021,   arcAlt: 0.15, color: "#0D1F0F" }, // Khartoum → Yaoundé
  { order: 7,  startLat: -18.9249,  startLng: 47.5185,   endLat: -25.7479,   endLng: 28.2293,   arcAlt: 0.2, color: "#1A3D1C" }, // Antananarivo → Pretoria
  // Quelques liaisons monde→Afrique (données qui arrivent)
  { order: 8,  startLat: 37.7749,   startLng: -122.4194, endLat: 14.6937,    endLng: -17.4441,  arcAlt: 0.55, color: "#E0AA55" }, // SF → Dakar
  { order: 8,  startLat: 35.6762,   startLng: 139.6503,  endLat: 6.5244,     endLng: 3.3792,    arcAlt: 0.55, color: "#C8963E" }, // Tokyo → Lagos
  { order: 9,  startLat: 22.3193,   startLng: 114.1694,  endLat: -1.2921,    endLng: 36.8219,   arcAlt: 0.5, color: "#E0AA55" }, // HK → Nairobi
  { order: 9,  startLat: -33.8688,  startLng: 151.2093,  endLat: -25.7479,   endLng: 28.2293,   arcAlt: 0.45, color: "#C8963E" }, // Sydney → Pretoria
] as const;

// ─── Particles config — stable, définie hors composant ───────────────────────
const PARTICLES_OPTIONS = {
  particles: {
    number: { value: 30 },
    move: { enable: true, speed: 0.25 },
    links: { enable: true, distance: 140, color: "#C8963E", opacity: 0.12 },
    color: { value: "#0D1F0F" },
    opacity: { value: 0.25 },
    size: { value: { min: 1, max: 2 } },
  },
  interactivity: {
    events: { onHover: { enable: true, mode: "grab" } },
    modes: { grab: { distance: 180, links: { opacity: 0.3 } } },
  },
  background: { color: "transparent" },
} as const;

// ─── Dynamic import SSR-safe ──────────────────────────────────────────────────
const World = dynamic(
  () => import("@/components/ui/globe").then((m) => m.World),
  { ssr: false }
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function HeroGlobe() {
  const [particlesReady, setParticlesReady] = useState(false);
  // Guard pour éviter la double init en React 18 StrictMode
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      aria-label="Présentation de la plateforme Ikawe"
    >
      {/* Particles background */}
      {particlesReady && (
        <Particles
          className="absolute inset-0 z-0"
          options={PARTICLES_OPTIONS}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 flex flex-col lg:flex-row items-center gap-12">

        {/* ── Colonne texte ── */}
        <div className="flex-1 flex flex-col items-start justify-center gap-6 pb-10">
          <span className="flex gap-3 text-sm font-semibold text-primary rounded-full shadow p-3">
            <Database size={20} className="text-secondary" aria-hidden="true" />
            Plateforme de données africaines
          </span>

          <h1 className="text-2xl md:text-5xl font-bold text-primary dark:text-white leading-tight">
            Centralisez et Annotez vos{" "}
            <span className="text-secondary">données Africaines</span>
          </h1>

          <p className="text-md text-neutral-500 max-w-md">
            Une plateforme unifiée pour gérer, enrichir et partager des datasets
            multimodaux. Speech, traduction, images — tout en un seul endroit.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Button
              aria-label="Créer un compte gratuitement"
              className="bg-primary hover:bg-secondary text-white px-8 py-6 text-base"
            >
              Commencer gratuitement
            </Button>
            <Button
              variant="outline"
              aria-label="En savoir plus sur Ikawe"
              className="px-8 py-6 text-base"
            >
              En savoir plus
            </Button>
          </div>

          {/* Micro-reassurance sous les CTAs */}
          <p className="text-xs text-neutral-400 -mt-2">
            Gratuit · Aucune carte requise · Prêt en 5 minutes
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-2 pt-6 border-t border-border w-full">
            <div>
              <p className="text-2xl font-bold text-secondary dark:text-white">10k+</p>
              <p className="text-sm text-neutral-500">Contributeurs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary dark:text-white">50+</p>
              <p className="text-sm text-neutral-500">Langues</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary dark:text-white">1M+</p>
              <p className="text-sm text-neutral-500">Données collectées</p>
            </div>
          </div>
        </div>

        {/* ── Globe ── */}
        <div
          className="flex-1 w-full flex items-center justify-center"
          aria-hidden="true"
          role="presentation"
        >
          <span className="sr-only">
            Globe interactif illustrant les connexions de données à travers l'Afrique et le monde
          </span>
          <div className="w-full max-w-[600px] aspect-square">
            <World data={SAMPLE_ARCS} globeConfig={globeConfig} />
          </div>
        </div>
      </div>
    </section>
  );
}