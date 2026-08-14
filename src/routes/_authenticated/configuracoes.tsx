import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EquipmentIcon } from "@/components/EquipmentIcon";
import logo from "@/assets/trindade-logo.png";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Informe de Turno" },
      { name: "description", content: "Ajuste seu nome, senha, tipos de equipamento e a logo do relatório." },
      { property: "og:title", content: "Configurações | Informe de Turno" },
      { property: "og:description", content: "Ajuste sua conta e a logo do relatório." },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [password, setPassword] = useState("");

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user!.id)
        .maybeSingle();
      return { profile, email: auth.user?.email ?? "" };
    },
  });

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.name ?? "");
      setLogoUrl(data.profile.logo_url ?? "");
    }
  }, [data]);

  const { data: types } = useQuery({
    queryKey: ["equipment_types"],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("equipment_types").select("*").order("sort_order");
      if (error) throw error;
      return rows;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ name, logo_url: logoUrl || null })
        .eq("id", auth.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="font-semibold text-card-foreground">Perfil</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={data?.email ?? ""} disabled />
          </div>
          <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            Salvar perfil
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="font-semibold text-card-foreground">Alterar senha</h2>
          <div className="space-y-2">
            <Label htmlFor="pw">Nova senha</Label>
            <Input
              id="pw"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={() => changePassword.mutate()}
            disabled={password.length < 6 || changePassword.isPending}
          >
            Alterar senha
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="font-semibold text-card-foreground">Logo do relatório</h2>
          <img src={logoUrl || logo} alt="Logo do relatório" className="h-12 w-auto" />
          <div className="space-y-2">
            <Label htmlFor="logo">URL da logo (opcional)</Label>
            <Input
              id="logo"
              placeholder="Deixe vazio para usar a logo da Trindade Mineração"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => saveProfile.mutate()}>
            Salvar logo
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Tipos de equipamento</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/equipamentos">
                <Wrench size={14} /> Gerenciar equipamentos
              </Link>
            </Button>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2">
            {(types ?? []).map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                <EquipmentIcon prefix={t.code_prefix} />
                <span className="font-medium">{t.code_prefix}</span>
                <span className="text-muted-foreground">{t.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <AiSettingsCard />
      </div>
    </div>
  );
}
