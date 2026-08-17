import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  OPERATION_LOCATION,
  MONITOR_RADIUS_KM,
  SINCE_MINUTES,
  boundingBox,
  distanceKm,
  statusForDistance,
  type Flash,
  type LightningData,
} from "./config";

const ENDPOINT = "https://api.warpulse.com/v1/flashes";

type RawFlash = {
  flash_id: number;
  lat: number;
  lon: number;
  flash_timestamp_utc: string;
  type?: string | null;
};

/** Normaliza o timestamp da API (UTC sem sufixo Z). */
function toIso(value: string): string {
  const raw = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Consulta a WarPulse Lightning API. A API Key nunca sai do servidor. */
export const getLightningActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LightningData> => {
    const apiKey = process.env["WARPULSE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de monitoramento de raios não configurado.");

    const box = boundingBox(MONITOR_RADIUS_KM);
    const url = new URL(ENDPOINT);
    url.searchParams.set("since_minutes", String(SINCE_MINUTES));
    url.searchParams.set("min_lat", box.min_lat.toFixed(4));
    url.searchParams.set("max_lat", box.max_lat.toFixed(4));
    url.searchParams.set("min_lon", box.min_lon.toFixed(4));
    url.searchParams.set("max_lon", box.max_lon.toFixed(4));
    url.searchParams.set("limit", "500");

    let res: Response;
    try {
      res = await fetch(url, { headers: { "X-API-Key": apiKey } });
    } catch {
      throw new Error("Não foi possível atualizar os dados de raios.");
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[WarPulse] erro", res.status, body.slice(0, 500));
      throw new Error("Não foi possível atualizar os dados de raios.");
    }

    const json = (await res.json().catch(() => null)) as { flashes?: RawFlash[] } | null;
    const raw = Array.isArray(json?.flashes) ? json.flashes : [];

    const flashes: Flash[] = raw
      .map((f) => ({
        id: f.flash_id,
        lat: f.lat,
        lon: f.lon,
        at: toIso(f.flash_timestamp_utc),
        type: f.type ?? null,
        distanceKm: distanceKm(
          OPERATION_LOCATION.latitude,
          OPERATION_LOCATION.longitude,
          f.lat,
          f.lon,
        ),
      }))
      // Só considera descargas realmente dentro do raio monitorado.
      .filter((f) => f.distanceKm <= MONITOR_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearestKm = flashes.length > 0 ? (flashes[0] as Flash).distanceKm : null;
    const lastFlashAt =
      flashes.length > 0
        ? flashes.reduce((acc, f) => (f.at > acc ? f.at : acc), (flashes[0] as Flash).at)
        : null;

    const status = statusForDistance(nearestKm);

    return {
      flashes,
      count: flashes.length,
      nearestKm,
      lastFlashAt,
      updatedAt: new Date().toISOString(),
      status: status === "INDISPONIVEL" ? "NORMAL" : status,
    };
  });
