import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
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
        content:
          "Manutenção, tarefas do turno, Blend, Diretriz e atividade de raios em um só painel.",
      },
      { property: "og:title", content: "Dashboard | Informe de Turno" },
      {
        property: "og:description",
        content:
          "Manutenção, tarefas do turno, Blend, Diretriz e atividade de raios em um só painel.",
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
      const { data, error } = await supabase.from("equipments").select("id").order("display_order");
      if (error) throw error;
      return data;
    },
  });

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
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays size={14} className="text-primary/60" />
          {profile?.profile?.name || profile?.email} · {formatDateBR(todayISO())}
        </p>
      </div>

      <div className="animate-fade-in-up stagger-2">
        <MaintenanceCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="animate-fade-in-up stagger-3">
          <TasksCard />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <LightningCard />
        </div>
        <div className="animate-fade-in-up stagger-5">
          <BlendCard />
        </div>
        <div className="animate-fade-in-up stagger-6">
          <DiretrizCard />
        </div>
      </div>
    </div>
  );
}
