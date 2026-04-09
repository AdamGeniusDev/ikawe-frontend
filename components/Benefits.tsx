import { Card } from "@/components/ui/card";
import { Zap, Globe, Lock, TrendingUp, Users, Workflow } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Gain de Temps",
    description: "Annotation automatique par IA pour accélérer votre workflow jusqu'à 10x",
  },
  {
    icon: Globe,
    title: "Focus Africain",
    description: "Spécialement conçu pour les langues, dialectes et contextes africains",
  },
  {
    icon: Lock,
    title: "Données Sécurisées",
    description: "Vos données sont protégées avec des protocoles de sécurité robustes",
  },
  {
    icon: TrendingUp,
    title: "Qualité Optimale",
    description: "Validation et révision intégrées pour garantir l'excellence",
  },
  {
    icon: Users,
    title: "Communauté Active",
    description: "Partagez et téléchargez des datasets avec d'autres chercheurs",
  },
  {
    icon: Workflow,
    title: "Workflow Flexible",
    description: "Adaptez les processus d'annotation à vos besoins spécifiques",
  },
];

const Benefits = () => {
  return (
    <section id="benefits" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="text-center mx-auto mb-16 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Pourquoi Choisir{" "}
            <span className="text-secondary">
              ikawe?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground  text-center">
            Une plateforme pensée pour maximiser votre productivité et la qualité de vos datasets
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-card border-border hover:shadow-card transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
