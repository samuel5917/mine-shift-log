import { useQuery } from "@tanstack/react-query";
import { Wrench, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR, SHIFT_LABEL } from "@/lib/domain";

export function MaintenanceCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-equipments"],
    queryFn: async () => {
      const { data: report, error } = await supabase
        .from("shift_reports")
        .select(
          "id, report_date, shift, shift_report_equipment(code, name, situation, display_order)",
        )
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!report) return { report: null, lines: [] };
      const lines = (report.shift_report_equipment ?? [])
        .filter((l) => l.situation === "MANUTENCAO")
        .sort((a, b) => a.display_order - b.display_order);
      return { report, lines };
    },
  });

  const lines = data?.lines ?? [];

  return (
    <section className="card-lift overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-manutencao/15">
            <Wrench size={14} className="text-status-manutencao-foreground" />
          </span>
          Equipamentos em manutenção
        </h2>
        <span className="text-xs text-muted-foreground">
          {data?.report
            ? `Informe de ${formatDateBR(data.report.report_date)} — ${SHIFT_LABEL[data.report.shift]}`
            : "Nenhum informe registrado"}
        </span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="shimmer h-10 rounded-md" />
            <div className="shimmer h-10 rounded-md" />
          </div>
        ) : lines.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-status-operando/20 bg-status-operando/5 px-4 py-3">
            <CheckCircle2 size={20} className="text-status-operando-foreground" />
            <p className="text-sm font-medium text-card-foreground">
              Nenhum equipamento em manutenção
            </p>
          </div>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lines.map((l) => (
                <li
                  key={l.code}
                  className="card-lift group flex items-center gap-2.5 rounded-lg border border-border/60 bg-background px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-status-manutencao/15">
                    <AlertCircle size={13} className="text-status-manutencao-foreground" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{l.code}</span>
                    <span className="block truncate text-xs text-muted-foreground">{l.name}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {lines.length} equipamento{lines.length > 1 ? "s" : ""} em manutenção
            </p>
          </>
        )}
      </div>
    </section>
  );
}
