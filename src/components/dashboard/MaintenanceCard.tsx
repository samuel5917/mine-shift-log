import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR, SHIFT_LABEL } from "@/lib/domain";

/** Equipamentos em manutenção conforme o informe de turno mais recente. */
export function MaintenanceCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-equipments"],
    queryFn: async () => {
      const { data: report, error } = await supabase
        .from("shift_reports")
        .select("id, report_date, shift, shift_report_equipment(code, name, situation, display_order)")
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
    <section className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <Wrench size={16} /> Equipamentos em manutenção
        </h2>
        <span className="text-xs text-muted-foreground">
          {data?.report
            ? `Informe de ${formatDateBR(data.report.report_date)} — ${SHIFT_LABEL[data.report.shift]}`
            : "Nenhum informe registrado"}
        </span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : lines.length === 0 ? (
          <p className="text-sm font-medium text-card-foreground">
            🟢 Nenhum equipamento em manutenção
          </p>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lines.map((l) => (
                <li
                  key={l.code}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <span aria-hidden>🔴</span>
                  <span className="text-sm font-semibold text-foreground">{l.code}</span>
                  <span className="truncate text-sm text-muted-foreground">— {l.name}</span>
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
