import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLightningActivity } from "./lightning.functions";
import {
  REFRESH_INTERVAL_MS,
  type LightningData,
  type LightningStatus,
} from "./config";

export function useLightning() {
  const fetchLightning = useServerFn(getLightningActivity);

  const query = useQuery<LightningData>({
    queryKey: ["lightning"],
    queryFn: () => fetchLightning(),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const failed = Boolean(query.error);
  const data = query.data;
  const status: LightningStatus = failed ? "INDISPONIVEL" : (data?.status ?? "NORMAL");

  return {
    ...query,
    data,
    failed,
    status,
    /** Última atualização válida (mantida mesmo quando a API falha). */
    lastValidAt: data?.updatedAt ?? null,
  };
}
