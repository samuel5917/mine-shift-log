import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, ShieldCheck, ImageDown, ArrowRight, Sparkles } from "lucide-react";
import logo from "@/assets/trindade-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Informe de Turno | Trindade Mineração" },
      {
        name: "description",
        content:
          "Sistema para criação, gestão e exportação em PNG dos informes de turno de equipamentos da Trindade Mineração.",
      },
      { property: "og:title", content: "Informe de Turno | Trindade Mineração" },
      {
        property: "og:description",
        content: "Crie, edite e exporte informes de turno de equipamentos de mineração.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Informes rápidos",
    desc: "Edição direta na linha: situação, frente de operação e estacionamento.",
    accent: "oklch(0.46 0.13 152)",
  },
  {
    icon: ImageDown,
    title: "Exportação PNG",
    desc: "Gere a imagem do informe pronta para enviar, fiel ao modelo corporativo.",
    accent: "oklch(0.55 0.15 200)",
  },
  {
    icon: ShieldCheck,
    title: "Dados isolados",
    desc: "Cada usuário acessa apenas os próprios equipamentos e informes.",
    accent: "oklch(0.5 0.12 250)",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 10%, oklch(0.46 0.13 152) 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, oklch(0.5 0.12 250) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, oklch(0.55 0.15 200) 0%, transparent 60%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.2 0.02 250) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.2 0.02 250) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <header className="relative z-10 border-b border-border/50 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <img
            src={logo}
            alt="Trindade Mineração"
            className="h-9 w-auto transition-transform duration-300 hover:scale-105"
            width={1536}
            height={512}
          />
          <Button asChild className="shadow-md">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-24">
        <div className="animate-fade-in-up stagger-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles size={14} /> Trindade Mineração
          </span>
        </div>

        <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-foreground md:text-6xl animate-fade-in-up stagger-2">
          Informe de Turno de <span className="text-gradient">Equipamentos</span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-in-up stagger-3">
          Controle a situação da frota, registre as frentes de operação e exporte o informe do turno
          em segundos.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up stagger-4">
          <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
            <Link to="/auth">
              Acessar o sistema <ArrowRight size={18} />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Persistência completa · Isolamento por usuário
          </span>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`card-lift group relative overflow-hidden rounded-xl border border-border/60 bg-card p-7 shadow-sm hover:shadow-xl animate-fade-in-up stagger-${i + 3}`}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                style={{ background: f.accent }}
              />
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                style={{ background: `${f.accent}15` }}
              >
                <f.icon size={24} style={{ color: f.accent }} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-card-foreground">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="mt-4 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-primary/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 rounded-xl border border-border/40 bg-card/40 px-8 py-6 backdrop-blur-sm animate-fade-in-up stagger-6">
          {[
            { label: "Tipos de equipamento", value: "10" },
            { label: "Situações", value: "4" },
            { label: "Turnos", value: "2" },
            { label: "Exportação", value: "PNG" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          Trindade Mineração · Sistema de Informes de Turno
        </div>
      </footer>
    </div>
  );
}
