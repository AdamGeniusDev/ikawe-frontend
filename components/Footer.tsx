import Image from "next/image";

const FOOTER_LINKS = {
  Produit: [
    { href: "#features",    label: "Fonctionnalités" },
    { href: "#data-types",  label: "Types de données" },
    { href: "#",            label: "Tarifs" },
    { href: "#",            label: "Documentation" },
  ],
  Ressources: [
    { href: "#", label: "Guide de démarrage" },
    { href: "#", label: "Tutoriels" },
    { href: "#", label: "API" },
    { href: "#", label: "Blog" },
  ],
  Entreprise: [
    { href: "#", label: "À propos" },
    { href: "#", label: "Contact" },
    { href: "#", label: "Confidentialité" },
    { href: "#", label: "CGU" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="space-y-4">
            <div style={{ position: "relative", width: "70px", height: "70px" }}>
              <Image
                src="/assets/logo.svg"
                fill
                style={{ objectFit: "contain" }}
                alt="Logo Ikawe"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              La plateforme de centralisation et d'annotation de données africaines
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-semibold mb-4">{heading}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-secondary transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ikawe. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}