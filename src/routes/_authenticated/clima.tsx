import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLightning } from "@/lib/lightning/use-lightning";
import {
  ALERT_DISTANCE_KM,
  ATTENTION_DISTANCE_KM,
  LIGHTNING_STATUS_CLASS,
  LIGHTNING_STATUS_DESCRIPTION,
  LIGHTNING_STATUS_DOT,
  LIGHTNING_STATUS_LABEL,
  MONITOR_RADIUS_KM,
  OPERATION_LOCATION,
  SINCE_MINUTES,
  formatTime,
} from "@/lib/lightning/config";

const LightningMap = lazy(() => import("@/components/weather/LightningMap"));

export const Route = createFileRoute("/_authenticated/clima")({
  head: () => ({
    meta: [
      { title: "Clima e Raios | Informe de Turno" },
      {
        name: "description",
        content: "Monitoramento de descargas atmosféricas próximas à operação de mineração.",
      },
      { property: "og:title", content: "Clima e Raios | Informe de Turno" },
      {
        property: "og:description",
        content: "Monitoramento de descargas atmosféricas próximas à operação de mineração.",
      },
    ],
  }),
  component: Clima,
});

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-md bg-muted" />;
}

function Clima() {
  const { data, status, failed, isFetching, refetch } = useLightning();
  const flashes = data?.flashes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Zap size={22} /> Clima — Atividade de raios
          </h1>
          <p className="text-sm text-muted-foreground">
            {OPERATION_LOCATION.name} · raio monitorado de {MONITOR_RADIUS_KM} km · janela de{" "}
            {SINCE_MINUTES} minutos
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? "animate-spin" : undefined} /> Atualizar
        </Button>
      </div>

      <div className={`rounded-lg px-4 py-3 text-base font-semibold ${LIGHTNING_STATUS_CLASS[status]}`}>
        {LIGHTNING_STATUS_DOT[status]} {LIGHTNING_STATUS_LABEL[status]}
        <span className="ml-2 text-sm font-normal opacity-90">
          {LIGHTNING_STATUS_DESCRIPTION[status]}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Descargas (${SINCE_MINUTES} min)`} value={failed ? "—" : String(data?.count ?? 0)} />
        <Stat
          label="Distância mais próxima"
          value={failed || data?.nearestKm == null ? "—" : `${data.nearestKm.toFixed(1)} km`}
        />
        <Stat label="Última descarga" value={formatTime(data?.lastFlashAt)} />
        <Stat label="Atualizado às" value={formatTime(data?.updatedAt, true)} />
      </div>

      <div className="h-[520px] overflow-hidden rounded-lg border bg-card p-2">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <LightningMap flashes={flashes} />
          </Suspense>
        </ClientOnly>
      </div>

      <p className="text-xs text-muted-foreground">
        Círculos: vermelho ≤ {ALERT_DISTANCE_KM} km (alerta), amarelo ≤ {ATTENTION_DISTANCE_KM} km
        (atenção), verde = limite de {MONITOR_RADIUS_KM} km. Os limites são parâmetros configuráveis e
        não substituem o protocolo oficial de segurança.
      </p>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-card-foreground">Descargas recentes</h2>
        </div>
        {flashes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {failed
              ? "Não foi possível atualizar os dados de raios."
              : "Nenhuma descarga detectada na janela monitorada."}
          </p>
        ) : (
          <ul className="divide-y">
            {flashes.slice(0, 20).map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-card-foreground">{f.distanceKm.toFixed(1)} km da operação</span>
                <span className="text-muted-foreground">{formatTime(f.at, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}
