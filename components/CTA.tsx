import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const REASSURANCES = [
  "Gratuit pour démarrer",
  "Aucune carte requise",
  "Prêt en 5 minutes",
];

export default function CTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-secondary p-12 md:p-16 shadow-glow">
            <div className="relative z-10 text-center text-primary">

              <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto">
                Prêt à transformer vos données ?
              </h2>
              <p className="text-lg md:text-xl mb-8 opacity-80">
                Rejoignez la plateforme de référence pour les données africaines
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base"
                  aria-label="Créer un compte gratuitement"
                >
                  Créer mon compte
                  <ArrowRight size={20} aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  className="px-8 py-6 text-base border-primary/40 text-primary hover:bg-primary/10"
                  aria-label="Voir la documentation"
                >
                  Voir la documentation
                </Button>
              </div>

              {/* Micro-reassurances */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {REASSURANCES.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 text-sm text-primary/70"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-primary/60"
                      aria-hidden="true"
                    />
                    {item}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}