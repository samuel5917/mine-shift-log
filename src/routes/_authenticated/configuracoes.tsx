import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Wrench } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteAiKey,
  getAiStatus,
  saveAiKey,
  testAiConnection,
} from "@/lib/ai/gemini.functions";
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

function AiSettingsCard() {
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [connOk, setConnOk] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const status = useServerFn(getAiStatus);
  const save = useServerFn(saveAiKey);
  const test = useServerFn(testAiConnection);
  const remove = useServerFn(deleteAiKey);

  const { data } = useQuery({ queryKey: ["ai_status"], queryFn: () => status({}) });

  const saveKey = useMutation({
    mutationFn: async () => save({ data: { apiKey } }),
    onSuccess: () => {
      setApiKey("");
      setConnOk(null);
      toast.success("API Key salva");
      queryClient.invalidateQueries({ queryKey: ["ai_status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearKey = useMutation({
    mutationFn: async () => remove({}),
    onSuccess: () => {
      setConnOk(null);
      toast.success("API Key removida");
      queryClient.invalidateQueries({ queryKey: ["ai_status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function testar() {
    if (testing) return;
    setTesting(true);
    try {
      await test({});
      setConnOk(true);
      toast.success("Gemini conectado");
    } catch (e) {
      setConnOk(false);
      toast.error(
        e instanceof Error
          ? e.message
          : "Não foi possível realizar a revisão com IA. Verifique sua conexão e a configuração da API Key.",
      );
    } finally {
      setTesting(false);
    }
  }

  const statusLabel =
    connOk === false
      ? "🟠 Erro na conexão"
      : data?.configured
        ? "🟢 Gemini conectado"
        : "🔴 Gemini não configurado";

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-muted-foreground" />
        <h2 className="font-semibold text-card-foreground">Inteligência Artificial</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Provedor: <span className="font-medium text-card-foreground">Google Gemini</span>
      </p>
      <p className="text-sm font-medium">{statusLabel}</p>
      <div className="space-y-2">
        <Label htmlFor="gemini">API Key</Label>
        <Input
          id="gemini"
          type="password"
          autoComplete="off"
          placeholder={data?.configured ? `Chave salva (${data.hint})` : "Cole sua API Key do Gemini"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A chave é armazenada com segurança no backend e nunca fica exposta no navegador.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => saveKey.mutate()} disabled={apiKey.trim().length < 10 || saveKey.isPending}>
          Salvar API Key
        </Button>
        <Button variant="outline" onClick={testar} disabled={testing || !data?.configured}>
          {testing ? "Testando..." : "Testar conexão"}
        </Button>
        {data?.configured ? (
          <Button variant="ghost" onClick={() => clearKey.mutate()} disabled={clearKey.isPending}>
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
