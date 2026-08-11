import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ClipboardList, Wrench, Settings, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import logo from "@/assets/trindade-logo.png";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/informes", label: "Meus Informes", icon: ClipboardList },
  { to: "/equipamentos", label: "Equipamentos", icon: Wrench },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Trindade Mineração" className="h-8 w-auto" width={1536} height={512} />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith(item.to) && "bg-accent text-accent-foreground",
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={signOut}
            className="ml-auto hidden items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent md:flex"
          >
            <LogOut size={16} /> Sair
          </button>
          <button
            className="ml-auto rounded-md border p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open ? (
          <div className="border-t bg-card px-4 pb-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-destructive"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
