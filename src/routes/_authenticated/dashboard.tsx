import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FilePlus2, ClipboardList, Wrench, Settings, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SITUATION_LABEL, SITUATION_UI_CLASS, SHIFT_LABEL, formatDateBR, todayISO, type Situation } from "@/lib/domain";
import { createReportForToday } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Informe de Turno" },
      { name: "description", content: "Visão geral da frota e dos informes de turno recentes." },
      { property: "og:title", content: "Dashboard | Informe de Turno" },
      { property: "og:description", content: "Visão geral da frota e dos informes de turno recentes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user!.id).maybeSingle();
      return { profile: data, email: auth.user?.email ?? "" };
    },
  });

  const { data: equipments } = useQuery({
    queryKey: ["equipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipments")
        .select("*, equipment_types(*)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_reports")
        .select("*, shift_report_equipment(id, situation)")
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // First access: create the example equipment list for this user.
  const seed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("seed_default_equipments");
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipments"] }),
  });

  useEffect(() => {
    if (equipments && equipments.length === 0 && seed.isIdle) seed.mutate();
  }, [equipments, seed]);

  const latest = reports?.[0];
  const lines = latest?.shift_report_equipment ?? [];
  const count = (s: Situation) => lines.filter((l) => l.situation === s).length;

  const newReport = useMutation({
    mutationFn: () => createReportForToday(),
    onSuccess: (id) => {
      toast.success("Informe criado");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate({ to: "/informe/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Informe de Turno</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.profile?.name || profile?.email} · {formatDateBR(todayISO())}
          </p>
        </div>
        <Button onClick={() => newReport.mutate()} disabled={newReport.isPending}>
          <FilePlus2 size={16} /> Novo informe
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Equipamentos</p>
          <p className="mt-1 text-3xl font-bold text-card-foreground">{equipments?.length ?? 0}</p>
        </div>
        {(["OPERANDO", "DISPONIVEL", "MANUTENCAO", "INDISPONIVEL"] as Situation[]).map((s) => (
          <div key={s} className="rounded-lg border bg-card p-4">
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${SITUATION_UI_CLASS[s]}`}>
              {SITUATION_LABEL[s]}
            </span>
            <p className="mt-1 text-3xl font-bold text-card-foreground">{count(s)}</p>
          </div>
        ))}
      </div>
      {latest ? (
        <p className="text-xs text-muted-foreground">
          Situações referentes ao informe de {formatDateBR(latest.report_date)} — {SHIFT_LABEL[latest.shift]}.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-14 justify-start" onClick={() => newReport.mutate()}>
          <FilePlus2 size={18} /> Novo informe
        </Button>
        <Button variant="outline" className="h-14 justify-start" asChild>
          <Link to="/informes">
            <ClipboardList size={18} /> Meus informes
          </Link>
        </Button>
        <Button variant="outline" className="h-14 justify-start" asChild>
          <Link to="/equipamentos">
            <Wrench size={18} /> Equipamentos
          </Link>
        </Button>
        <Button variant="outline" className="h-14 justify-start" asChild>
          <Link to="/configuracoes">
            <Settings size={18} /> Configurações
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-card-foreground">Informes recentes</h2>
        </div>
        {reports && reports.length > 0 ? (
          <ul className="divide-y">
            {reports.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-card-foreground">
                  {formatDateBR(r.report_date)} - {SHIFT_LABEL[r.shift]}
                </span>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/informe/$id" params={{ id: r.id }}>
                    Abrir <ArrowRight size={14} />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum informe criado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
