import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, Check, Download, Loader as Loader2, Plus, Search, Trash2, ImageDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EquipmentIcon } from "@/components/EquipmentIcon";
import { ReportSheet, type SheetLine } from "@/components/ReportSheet";
import {
  CATEGORY_TITLE,
  SITUATIONS,
  SITUATION_LABEL,
  SITUATION_UI_CLASS,
  reportFileName,
  type Category,
  type Situation,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/informe/$id")({
  validateSearch: (search: Record<string, unknown>): { export?: true } =>
    search["export"] === true || search["export"] === "true" ? { export: true } : {},
  head: () => ({
    meta: [
      { title: "Editar informe | Informe de Turno" },
      {
        name: "description",
        content: "Edite situações e frentes de operação e exporte o informe em PNG.",
      },
      { property: "og:title", content: "Editar informe | Informe de Turno" },
      { property: "og:description", content: "Edite situações e frentes de operação do turno." },
    ],
  }),
  component: InformeEditor,
});

type SaveState = "idle" | "saving" | "saved" | "error";

interface Line {
  id: string;
  equipment_id: string | null;
  code: string;
  name: string;
  type_prefix: string;
  category: string;
  situation: Situation;
  operation_front: string;
  parking_front: string;
  display_order: number;
}

function InformeEditor() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [filterSituation, setFilterSituation] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [term, setTerm] = useState("");
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: report } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_reports")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: serverLines } = useQuery({
    queryKey: ["report-lines", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_report_equipment")
        .select("*")
        .eq("report_id", id)
        .order("display_order");
      if (error) throw error;
      return data as Line[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user!.id)
        .maybeSingle();
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

  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => {
    if (serverLines) setLines(serverLines);
  }, [serverLines]);

  useEffect(() => {
    if (search.export && lines.length > 0) setPreview(true);
  }, [search.export, lines.length]);

  async function persist(lineId: string, patch: Partial<Line>) {
    setSaveState("saving");
    const { error } = await supabase.from("shift_report_equipment").update(patch).eq("id", lineId);
    if (error) {
      setSaveState("error");
      toast.error("Erro ao salvar");
      return;
    }
    await supabase
      .from("shift_reports")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaveState("saved");
  }

  function updateLine(lineId: string, patch: Partial<Line>, debounce = 700) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
    setSaveState("saving");
    const key = lineId + Object.keys(patch).join(",");
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => void persist(lineId, patch), debounce);
  }

  const updateHeader = useMutation({
    mutationFn: async (patch: { report_date?: string; shift?: number; show_parking?: boolean }) => {
      setSaveState("saving");
      const { error } = await supabase.from("shift_reports").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["report", id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => {
      setSaveState("error");
      toast.error("Erro ao salvar");
    },
  });

  const removeLine = useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase.from("shift_report_equipment").delete().eq("id", lineId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipamento removido do informe");
      queryClient.invalidateQueries({ queryKey: ["report-lines", id] });
    },
  });

  const addLine = useMutation({
    mutationFn: async (equipmentId: string) => {
      const equipment = (equipments ?? []).find((e) => e.id === equipmentId);
      if (!equipment) throw new Error("Equipamento não encontrado");
      const { data: auth } = await supabase.auth.getUser();
      const maxOrder = Math.max(0, ...lines.map((l) => l.display_order));
      const { error } = await supabase.from("shift_report_equipment").insert({
        user_id: auth.user!.id,
        report_id: id,
        equipment_id: equipment.id,
        code: equipment.code,
        name: equipment.name,
        type_prefix: equipment.equipment_types?.code_prefix ?? equipment.code.split("-")[0],
        category: equipment.equipment_types?.category ?? "auxiliar",
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipamento adicionado");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["report-lines", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function moveLine(lineId: string, direction: -1 | 1) {
    const ordered = [...lines].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((l) => l.id === lineId);
    const target = index + direction;
    const a = ordered[index];
    const b = ordered[target];
    if (!a || !b) return;
    setLines(
      lines.map((l) =>
        l.id === a.id
          ? { ...l, display_order: b.display_order }
          : l.id === b.id
            ? { ...l, display_order: a.display_order }
            : l,
      ),
    );
    setSaveState("saving");
    await supabase
      .from("shift_report_equipment")
      .update({ display_order: b.display_order })
      .eq("id", a.id);
    await supabase
      .from("shift_report_equipment")
      .update({ display_order: a.display_order })
      .eq("id", b.id);
    setSaveState("saved");
    queryClient.invalidateQueries({ queryKey: ["report-lines", id] });
  }

  const ordered = useMemo(
    () => [...lines].sort((a, b) => a.display_order - b.display_order),
    [lines],
  );

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase();
    return ordered.filter((l) => {
      const okSituation = filterSituation === "all" || l.situation === filterSituation;
      const okType = filterType === "all" || l.type_prefix === filterType;
      const okTerm = !t || l.code.toLowerCase().includes(t) || l.name.toLowerCase().includes(t);
      return okSituation && okType && okTerm;
    });
  }, [ordered, filterSituation, filterType, term]);

  const typePrefixes = useMemo(
    () => Array.from(new Set(ordered.map((l) => l.type_prefix))).sort(),
    [ordered],
  );

  async function exportPng() {
    if (!sheetRef.current || !report) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(sheetRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = reportFileName(report.report_date, report.shift);
      link.href = dataUrl;
      link.click();
      toast.success("Exportação concluída");
    } catch {
      toast.error("Não foi possível gerar a imagem");
    } finally {
      setExporting(false);
    }
  }

  const sheetLines: SheetLine[] = ordered.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    type_prefix: l.type_prefix,
    category: l.category,
    situation: l.situation,
    operation_front: l.operation_front,
    parking_front: l.parking_front,
  }));

  const available = (equipments ?? []).filter(
    (e) => !ordered.some((l) => l.equipment_id === e.id && l.code === e.code),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/informes" })}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Informe de Turno</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {saveState === "saving" ? (
              <>
                <Loader2 className="animate-spin" size={14} /> Salvando...
              </>
            ) : saveState === "error" ? (
              <span className="text-destructive">Erro ao salvar</span>
            ) : saveState === "saved" ? (
              <>
                <Check size={14} /> Salvo
              </>
            ) : null}
          </span>
          <Button onClick={() => setPreview(true)}>
            <ImageDown size={16} /> Exportar informe
          </Button>
        </div>
      </div>

      {report ? (
        <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={report.report_date}
              onChange={(e) => updateHeader.mutate({ report_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Turno</Label>
            <Select
              value={String(report.shift)}
              onValueChange={(v) => updateHeader.mutate({ shift: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1º Turno</SelectItem>
                <SelectItem value="2">2º Turno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3 pb-2">
            <Switch
              id="parking"
              checked={report.show_parking}
              onCheckedChange={(v) => updateHeader.mutate({ show_parking: v })}
            />
            <Label htmlFor="parking">Frente de estacionamento (produção)</Label>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="pl-9"
            placeholder="Pesquisar equipamento..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={filterSituation} onValueChange={setFilterSituation}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            {SITUATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SITUATION_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {typePrefixes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Adicionar equipamento
        </Button>
      </div>

      {(["auxiliar", "producao"] as Category[]).map((cat) => {
        const group = visible.filter((l) => l.category === cat);
        if (group.length === 0) return null;
        return (
          <div key={cat} className="overflow-x-auto rounded-lg border bg-card">
            <div className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold uppercase tracking-wide">
              {CATEGORY_TITLE[cat]}
            </div>
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">Equipamento</th>
                  <th className="w-44 px-4 py-2 font-semibold">Situação</th>
                  <th className="px-4 py-2 font-semibold">Frente de Operação</th>
                  {cat === "producao" && report?.show_parking ? (
                    <th className="px-4 py-2 font-semibold">Frente de Estacionamento</th>
                  ) : null}
                  <th className="w-32 px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-1.5">
                      <span className="flex items-center gap-2 font-medium whitespace-nowrap text-card-foreground">
                        <EquipmentIcon prefix={l.type_prefix} />
                        {l.code} - {l.name}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      <Select
                        value={l.situation}
                        onValueChange={(v) => updateLine(l.id, { situation: v as Situation }, 0)}
                      >
                        <SelectTrigger
                          className={`h-9 font-semibold ${SITUATION_UI_CLASS[l.situation]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SITUATIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {SITUATION_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-1.5">
                      <Input
                        className="h-9"
                        value={l.operation_front}
                        placeholder="Ex.: B-1110, Planta 02, Sob demanda"
                        onChange={(e) => updateLine(l.id, { operation_front: e.target.value })}
                      />
                    </td>
                    {cat === "producao" && report?.show_parking ? (
                      <td className="px-4 py-1.5">
                        <Input
                          className="h-9"
                          value={l.parking_front}
                          placeholder="Opcional"
                          onChange={(e) => updateLine(l.id, { parking_front: e.target.value })}
                        />
                      </td>
                    ) : null}
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end">
                        <Button size="icon" variant="ghost" onClick={() => void moveLine(l.id, -1)}>
                          <ArrowUp size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => void moveLine(l.id, 1)}>
                          <ArrowDown size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeLine.mutate(l.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar equipamento ao informe</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todos os equipamentos já estão neste informe.
              </p>
            ) : (
              available.map((e) => (
                <button
                  key={e.id}
                  onClick={() => addLine.mutate(e.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <EquipmentIcon prefix={e.equipment_types?.code_prefix ?? ""} />
                  {e.code} - {e.name}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview}
        onOpenChange={(o) => {
          setPreview(o);
          if (!o && search.export) navigate({ to: "/informe/$id", params: { id }, search: {} });
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-auto rounded border bg-white p-2">
            <div ref={sheetRef} className="origin-top-left">
              {report ? (
                <ReportSheet
                  lines={sheetLines}
                  reportDate={report.report_date}
                  shift={report.shift}
                  showParking={report.show_parking}
                  logoUrl={profile?.profile?.logo_url ?? null}
                />
              ) : null}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreview(false)}>
              Voltar
            </Button>
            <Button onClick={() => void exportPng()} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}{" "}
              Exportar PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
