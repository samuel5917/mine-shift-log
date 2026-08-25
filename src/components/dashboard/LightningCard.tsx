import { Link } from "@tanstack/react-router";
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

export function LightningCard() {
  const { data, status, failed, isFetching, refetch } = useLightning();

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <Zap size={16} /> Atividade de raios
        </h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Atualizar dados de raios"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : undefined} />
        </Button>
      </div>

      <div className="space-y-3 p-4">
        <div
          className={`rounded-md px-3 py-2 text-sm font-semibold ${LIGHTNING_STATUS_CLASS[status]}`}
        >
          {LIGHTNING_STATUS_DOT[status]} {LIGHTNING_STATUS_LABEL[status]}
        </div>
        <p className="text-xs text-muted-foreground">{LIGHTNING_STATUS_DESCRIPTION[status]}</p>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border bg-background px-3 py-2">
            <dt className="text-xs text-muted-foreground">Descargas ({SINCE_MINUTES} min)</dt>
            <dd className="font-semibold text-foreground">{failed ? "—" : (data?.count ?? 0)}</dd>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <dt className="text-xs text-muted-foreground">Mais próxima</dt>
            <dd className="font-semibold text-foreground">
              {failed || data?.nearestKm == null ? "—" : `${data.nearestKm.toFixed(1)} km`}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          {OPERATION_LOCATION.name} · raio de {MONITOR_RADIUS_KM} km · alerta ≤ {ALERT_DISTANCE_KM}{" "}
          km · atenção ≤ {ATTENTION_DISTANCE_KM} km
        </p>
        <p className="text-xs text-muted-foreground">
          Última descarga: {formatTime(data?.lastFlashAt)} · Atualizado às{" "}
          {formatTime(data?.updatedAt)}
        </p>

        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link to="/clima">
            <Zap size={14} /> Ver mapa completo
          </Link>
        </Button>
      </div>
    </section>
  );
}
