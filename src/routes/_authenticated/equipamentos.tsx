import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentIcon } from "@/components/EquipmentIcon";

export const Route = createFileRoute("/_authenticated/equipamentos")({
  head: () => ({
    meta: [
      { title: "Equipamentos | Informe de Turno" },
      { name: "description", content: "Cadastro de equipamentos da frota: código, nome, tipo e status." },
      { property: "og:title", content: "Equipamentos | Informe de Turno" },
      { property: "og:description", content: "Cadastro de equipamentos da frota de mineração." },
    ],
  }),
  component: EquipamentosPage,
});

interface FormState {
  id?: string;
  code: string;
  name: string;
  type_id: string;
  active: boolean;
}

const EMPTY: FormState = { code: "", name: "", type_id: "", active: true };

function EquipamentosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; code: string } | null>(null);

  const { data: types } = useQuery({
    queryKey: ["equipment_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_types").select("*").order("sort_order");
      if (error) throw error;
      return data;
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (equipments ?? []).filter((e) => {
      const matchesTerm =
        !term || e.code.toLowerCase().includes(term) || e.name.toLowerCase().includes(term);
      const matchesType = typeFilter === "all" || e.type_id === typeFilter;
      return matchesTerm && matchesType;
    });
  }, [equipments, search, typeFilter]);

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const { data: auth } = await supabase.auth.getUser();
      if (state.id) {
        const { error } = await supabase
          .from("equipments")
          .update({ code: state.code, name: state.name, type_id: state.type_id, active: state.active })
          .eq("id", state.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(0, ...(equipments ?? []).map((e) => e.display_order));
        const { error } = await supabase.from("equipments").insert({
          user_id: auth.user!.id,
          code: state.code,
          name: state.name,
          type_id: state.type_id,
          active: state.active,
          display_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, state) => {
      toast.success(state.id ? "Equipamento atualizado" : "Equipamento criado");
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("equipments").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipamento excluído");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => {
      const list = [...(equipments ?? [])];
      const index = list.findIndex((e) => e.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return;
      const a = list[index];
      const b = list[target];
      if (!a || !b) return;
      await supabase.from("equipments").update({ display_order: b.display_order }).eq("id", a.id);
      await supabase.from("equipments").update({ display_order: a.display_order }).eq("id", b.id);

    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipments"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
        <Button onClick={() => setForm({ ...EMPTY, type_id: types?.[0]?.id ?? "" })}>
          <Plus size={16} /> Novo equipamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pl-9"
            placeholder="Pesquisar equipamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(types ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.code_prefix} - {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Equipamento</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Ativo</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2 font-medium text-card-foreground">
                    <EquipmentIcon prefix={e.equipment_types?.code_prefix ?? ""} />
                    {e.code} - {e.name}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{e.equipment_types?.name}</td>
                <td className="px-4 py-2">
                  <Switch
                    checked={e.active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: e.id, active: v })}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move.mutate({ id: e.id, direction: -1 })}>
                      <ArrowUp size={15} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move.mutate({ id: e.id, direction: 1 })}>
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: e.id,
                          code: e.code,
                          name: e.name,
                          type_id: e.type_id,
                          active: e.active,
                        })
                      }
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleting({ id: e.id, code: e.code })}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="space-y-4"
              onSubmit={(ev) => {
                ev.preventDefault();
                save.mutate(form);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  required
                  placeholder="EH-0001"
                  value={form.code}
                  onChange={(ev) => setForm({ ...form, code: ev.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  required
                  placeholder="Escavadeira"
                  value={form.name}
                  onChange={(ev) => setForm({ ...form, name: ev.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type_id} onValueChange={(v) => setForm({ ...form, type_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(types ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.code_prefix} - {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                  id="active"
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={save.isPending || !form.type_id}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O equipamento {deleting?.code} será removido do cadastro. Informes já criados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
