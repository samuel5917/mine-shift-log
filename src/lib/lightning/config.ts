/**
 * Configuração centralizada do monitoramento de raios.
 *
 * ATENÇÃO: a localização abaixo é TEMPORÁRIA (Barão de Cocais - MG).
 * Substitua apenas aqui pelas coordenadas exatas da mina quando disponíveis.
 */
export const OPERATION_LOCATION = {
  name: "Barão de Cocais — MG",
  latitude: -19.94,
  longitude: -43.48,
} as const;

/** Raio monitorado ao redor da operação (km). */
export const MONITOR_RADIUS_KM = 30;

/**
 * Limites de distância (km) usados para os estados visuais.
 * São parâmetros configuráveis — não representam protocolo oficial de segurança.
 */
export const ALERT_DISTANCE_KM = 10;
export const ATTENTION_DISTANCE_KM = 20;
export const NORMAL_DISTANCE_KM = MONITOR_RADIUS_KM;

/** Janela de consulta na API (minutos). */
export const SINCE_MINUTES = 15;

/** Intervalo de atualização automática (ms). */
export const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export type LightningStatus = "NORMAL" | "ATENCAO" | "ALERTA" | "INDISPONIVEL";

export const LIGHTNING_STATUS_LABEL: Record<LightningStatus, string> = {
  NORMAL: "SEM ALERTA DE RAIOS",
  ATENCAO: "ATENÇÃO",
  ALERTA: "ALERTA DE RAIOS",
  INDISPONIVEL: "DADOS INDISPONÍVEIS",
};

export const LIGHTNING_STATUS_DESCRIPTION: Record<LightningStatus, string> = {
  NORMAL: "Nenhuma descarga detectada próxima da operação.",
  ATENCAO: "Atividade elétrica detectada próxima da operação.",
  ALERTA: "Descargas elétricas detectadas próximas da operação.",
  INDISPONIVEL: "Não foi possível atualizar os dados de raios.",
};

export const LIGHTNING_STATUS_DOT: Record<LightningStatus, string> = {
  NORMAL: "🟢",
  ATENCAO: "🟡",
  ALERTA: "🔴",
  INDISPONIVEL: "🟠",
};

/** Classes de cor para os estados (usa os tokens do tema). */
export const LIGHTNING_STATUS_CLASS: Record<LightningStatus, string> = {
  NORMAL: "bg-status-operando text-status-operando-foreground",
  ATENCAO: "bg-status-indisponivel text-status-indisponivel-foreground",
  ALERTA: "bg-status-manutencao text-status-manutencao-foreground",
  INDISPONIVEL: "bg-muted text-muted-foreground",
};

/** Distância em km entre dois pontos (Haversine). */
export function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Bounding box aproximada a partir da operação e do raio configurado. */
export function boundingBox(radiusKm = MONITOR_RADIUS_KM) {
  const { latitude, longitude } = OPERATION_LOCATION;
  const dLat = radiusKm / 111.32;
  const dLon = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  return {
    min_lat: latitude - dLat,
    max_lat: latitude + dLat,
    min_lon: longitude - dLon,
    max_lon: longitude + dLon,
  };
}

export function statusForDistance(nearestKm: number | null): LightningStatus {
  if (nearestKm === null) return "NORMAL";
  if (nearestKm <= ALERT_DISTANCE_KM) return "ALERTA";
  if (nearestKm <= ATTENTION_DISTANCE_KM) return "ATENCAO";
  return "NORMAL";
}

export type Flash = {
  id: number;
  lat: number;
  lon: number;
  at: string;
  type: string | null;
  distanceKm: number;
};

export type LightningData = {
  flashes: Flash[];
  count: number;
  nearestKm: number | null;
  lastFlashAt: string | null;
  updatedAt: string;
  status: Exclude<LightningStatus, "INDISPONIVEL">;
};

export function formatTime(iso: string | null | undefined, withSeconds = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  });
}
