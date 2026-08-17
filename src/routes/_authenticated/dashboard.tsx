import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR, todayISO } from "@/lib/domain";
import { MaintenanceCard } from "@/components/dashboard/MaintenanceCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { BlendCard } from "@/components/dashboard/BlendCard";
import { DiretrizCard } from "@/components/dashboard/DiretrizCard";
import { LightningCard } from "@/components/dashboard/LightningCard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Informe de Turno" },
      {
        name: "description",
        content: "Manutenção, tarefas do turno, Blend, Diretriz e atividade de raios em um só painel.",
      },
      { property: "og:title", content: "Dashboard | Informe de Turno" },
      {
        property: "og:description",
        content: "Manutenção, tarefas do turno, Blend, Diretriz e atividade de raios em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
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
      const { data, error } = await supabase.from("equipments").select("id").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Primeiro acesso: cria a lista de equipamentos de exemplo do usuário.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.profile?.name || profile?.email} · {formatDateBR(todayISO())}
        </p>
      </div>

      <MaintenanceCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <TasksCard />
        <LightningCard />
        <BlendCard />
        <DiretrizCard />
      </div>
    </div>
  );
}
