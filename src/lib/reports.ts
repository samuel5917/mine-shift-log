import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/domain";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada");
  return data.user.id;
}

/** Creates a new report populated with every active equipment of the user. */
export async function createReportForToday(date = todayISO(), shift = 1): Promise<string> {
  const userId = await requireUserId();

  const { data: report, error } = await supabase
    .from("shift_reports")
    .insert({ user_id: userId, report_date: date, shift })
    .select()
    .single();
  if (error) throw error;

  const { data: equipments, error: eqError } = await supabase
    .from("equipments")
    .select("*, equipment_types(code_prefix, category)")
    .eq("active", true)
    .order("display_order");
  if (eqError) throw eqError;

  if (equipments && equipments.length > 0) {
    const rows = equipments.map((e, i) => ({
      user_id: userId,
      report_id: report.id,
      equipment_id: e.id,
      code: e.code,
      name: e.name,
      type_prefix: e.equipment_types?.code_prefix ?? e.code.split("-")[0],
      category: e.equipment_types?.category ?? "auxiliar",
      situation: "DISPONIVEL",
      operation_front: "",
      parking_front: "",
      display_order: i + 1,
    }));
    const { error: linesError } = await supabase.from("shift_report_equipment").insert(rows);
    if (linesError) throw linesError;
  }

  return report.id;
}

/** Duplicates an existing report into a new date/shift, keeping situations and fronts. */
export async function duplicateReport(reportId: string, date: string, shift: number): Promise<string> {
  const userId = await requireUserId();

  const { data: source, error } = await supabase
    .from("shift_reports")
    .select("*, shift_report_equipment(*)")
    .eq("id", reportId)
    .single();
  if (error) throw error;

  const { data: report, error: insertError } = await supabase
    .from("shift_reports")
    .insert({ user_id: userId, report_date: date, shift, show_parking: source.show_parking })
    .select()
    .single();
  if (insertError) throw insertError;

  const lines = source.shift_report_equipment ?? [];
  if (lines.length > 0) {
    const rows = lines
      .sort((a, b) => a.display_order - b.display_order)
      .map((l) => ({
        user_id: userId,
        report_id: report.id,
        equipment_id: l.equipment_id,
        code: l.code,
        name: l.name,
        type_prefix: l.type_prefix,
        category: l.category,
        situation: l.situation,
        operation_front: l.operation_front,
        parking_front: l.parking_front,
        display_order: l.display_order,
      }));
    const { error: linesError } = await supabase.from("shift_report_equipment").insert(rows);
    if (linesError) throw linesError;
  }

  return report.id;
}
