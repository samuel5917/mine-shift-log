import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2, FilePlus2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SHIFT_LABEL, formatDateBR, todayISO } from "@/lib/domain";
import { createReportForToday, duplicateReport } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/informes")({
  head: () => ({
    meta: [
      { title: "Equipamentos | Informe de Turno" },
      { name: "description", content: "Histórico de informes de turno criados, com duplicar e exportar." },
      { property: "og:title", content: "Equipamentos | Informe de Turno" },
      { property: "og:description", content: "Histórico de informes de turno criados." },
    ],
  }),
  component: InformesPage,
});

function InformesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dup, setDup] = useState<{ id: string; date: string; shift: string } | null>(null);
  const [creating, setCreating] = useState<{ date: string; shift: string } | null>(null);

  const { data: reports } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_reports")
        .select("*, shift_report_equipment(id)")
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: ({ date, shift }: { date: string; shift: string }) =>
      createReportForToday(date, Number(shift)),
    onSuccess: (id) => {
      toast.success("Informe criado");
      setCreating(null);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate({ to: "/informe/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: ({ id, date, shift }: { id: string; date: string; shift: string }) =>
      duplicateReport(id, date, Number(shift)),
    onSuccess: (id) => {
      toast.success("Informe duplicado");
      setDup(null);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate({ to: "/informe/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informe excluído");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
        <Button onClick={() => setCreating({ date: todayISO(), shift: "1" })}>
          <FilePlus2 size={16} /> Novo informe
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Turno</th>
              <th className="px-4 py-3 font-semibold">Equipamentos</th>
              <th className="px-4 py-3 font-semibold">Criado em</th>
              <th className="px-4 py-3 font-semibold">Alterado em</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(reports ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium text-card-foreground">{formatDateBR(r.report_date)}</td>
                <td className="px-4 py-2">{SHIFT_LABEL[r.shift]}</td>
                <td className="px-4 py-2">{r.shift_report_equipment?.length ?? 0}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(r.updated_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/informe/$id" params={{ id: r.id }}>
                        Abrir
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDup({ id: r.id, date: todayISO(), shift: String(r.shift) })}
                    >
                      <Copy size={14} /> Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/informe/$id" params={{ id: r.id }} search={{ export: true }}>
                        <ExternalLink size={14} /> Exportar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleting(r.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {reports && reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum informe criado ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={creating !== null} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo informe</DialogTitle>
          </DialogHeader>
          {creating ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cdate">Data</Label>
                <Input
                  id="cdate"
                  type="date"
                  value={creating.date}
                  onChange={(e) => setCreating({ ...creating, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={creating.shift} onValueChange={(v) => setCreating({ ...creating, shift: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Turno</SelectItem>
                    <SelectItem value="2">2º Turno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreating(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => create.mutate(creating)} disabled={create.isPending}>
                  Criar informe
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dup !== null} onOpenChange={(o) => !o && setDup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar informe</DialogTitle>
          </DialogHeader>
          {dup ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ddate">Data</Label>
                <Input
                  id="ddate"
                  type="date"
                  value={dup.date}
                  onChange={(e) => setDup({ ...dup, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={dup.shift} onValueChange={(v) => setDup({ ...dup, shift: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Turno</SelectItem>
                    <SelectItem value="2">2º Turno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDup(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => duplicate.mutate(dup)} disabled={duplicate.isPending}>
                  Duplicar
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este informe?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
