"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";



interface NavLink {
  href: string;
  label: string;
  sectionId: string; 
}

const NAV_LINKS: NavLink[] = [
  { href: "/#features",  label: "Fonctionnalités", sectionId: "features"  },
  { href: "/#datatypes", label: "Types de Données", sectionId: "datatypes" },
  { href: "/#benefits",  label: "Avantages",        sectionId: "benefits"  },
];


//pour l'animation du scroll de section active dans la navbar
function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState<string>("");

  const ratioMap = useRef<Record<string, number>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratioMap.current[entry.target.id] = entry.intersectionRatio;
        });

        const best = Object.entries(ratioMap.current).reduce(
          (acc, [id, ratio]) => (ratio > acc.ratio ? { id, ratio } : acc),
          { id: "", ratio: 0 }
        );

        if (best.ratio > 0) setActiveId(best.id);
      },
      {
        rootMargin: "-64px 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}



export default function Navbar() {
  const [open, setOpen] = useState(false);
  const sectionIds = NAV_LINKS.map((l) => l.sectionId);
  const activeId = useActiveSection(sectionIds);

 
  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) {
    e.preventDefault();
    setOpen(false);

    const target = document.getElementById(sectionId);
    if (!target) return;

    const navbarHeight = 64;
    const top =
      target.getBoundingClientRect().top + window.scrollY - navbarHeight;

    window.scrollTo({ top, behavior: "smooth" });

  
    history.pushState(null, "", `#${sectionId}`);
  }

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" aria-label="Ikawe — accueil">
          <div style={{ position: "relative", width: "80px", height: "80px" }}>
            <Image
              src="/assets/logo.svg"
              fill
              style={{ objectFit: "contain" }}
              alt="Logo Ikawe"
            />
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label, sectionId }) => {
            const isActive = activeId === sectionId;
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, sectionId)}
                className="relative text-sm font-medium transition-colors duration-200"
                style={{
                  color: isActive ? "#C8963E" : undefined,
                }}
                // Fallback CSS si JS désactivé : classe Tailwind
                data-active={isActive}
                aria-current={isActive ? "location" : undefined}
              >
                {label}

                {/* Underline animé sous le lien actif */}
                <span
                  className="absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: "#C8963E",
                    width: isActive ? "100%" : "0%",
                  }}
                />
              </a>
            );
          })}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href='/signIn'>
          <Button
            variant="outline"
            aria-label="Se connecter à son compte"
            className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Connexion
          </Button>
          </Link>
          
          <Link href='/signUp'>
          <Button
            aria-label="Créer un compte gratuitement"
            className="bg-primary hover:bg-secondary text-white"
          >
            Commencer
          </Button>
          </Link>    
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-primary hover:bg-accent transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden bg-card border-t border-border px-4 pb-4 pt-2 flex flex-col gap-1"
        >
          {NAV_LINKS.map(({ href, label, sectionId }) => {
            const isActive = activeId === sectionId;
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, sectionId)}
                className="py-2 text-sm font-medium transition-colors duration-200"
                style={{ color: isActive ? "#C8963E" : undefined }}
                aria-current={isActive ? "location" : undefined}
              >
                {label}
              </a>
            );
          })}
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full border-primary text-primary"
            >
              Connexion
            </Button>
            <Button className="w-full bg-primary hover:bg-secondary text-white">
              Commencer
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}