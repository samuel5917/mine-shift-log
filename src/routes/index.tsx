import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, ShieldCheck, ImageDown } from "lucide-react";
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
  { icon: ClipboardList, title: "Informes rápidos", desc: "Edição direta na linha: situação, frente de operação e estacionamento." },
  { icon: ImageDown, title: "Exportação PNG", desc: "Gere a imagem do informe pronta para enviar, fiel ao modelo corporativo." },
  { icon: ShieldCheck, title: "Dados isolados", desc: "Cada usuário acessa apenas os próprios equipamentos e informes." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <img src={logo} alt="Trindade Mineração" className="h-9 w-auto" width={1536} height={512} />
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Informe de Turno de Equipamentos
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Controle a situação da frota, registre as frentes de operação e exporte o informe do turno em
          segundos.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/auth">Acessar o sistema</Link>
          </Button>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6">
              <f.icon className="text-primary" size={22} />
              <h2 className="mt-3 font-semibold text-card-foreground">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
