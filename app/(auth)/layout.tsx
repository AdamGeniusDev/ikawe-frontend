export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Panneau gauche — brand ── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center gap-10 flex-1 relative overflow-hidden"
        style={{ background: "#0D1F0F" }}
        aria-hidden="true"
      >
        {/* Cercles décoratifs */}
        <div
          className="absolute rounded-full"
          style={{
            width: 360,
            height: 360,
            background: "#C8963E",
            opacity: 0.07,
            top: -120,
            right: -80,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: "#C8963E",
            opacity: 0.07,
            bottom: -60,
            left: -60,
          }}
        />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center max-w-md">
          <div className="flex flex-col gap-2">
            <h2
              className="text-3xl font-bold leading-snug"
              style={{ color: "#E0AA55" }}
            >
              La plateforme des données africaines
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Centralisez, annotez et partagez vos datasets multimodaux —
              speech, traduction, images et bien plus.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { value: "50+",  label: "Langues" },
              { value: "10k+", label: "Contributeurs" },
              { value: "1M+",  label: "Données collectées" },
            ].map(({ value, label }, i, arr) => (
              <div key={label} className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: "#C8963E" }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 lg:max-w-140 flex items-center justify-center bg-background px-6 py-12">
        {children}
      </div>
    </div>
  );
}