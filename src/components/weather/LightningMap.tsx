import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ALERT_DISTANCE_KM,
  ATTENTION_DISTANCE_KM,
  MONITOR_RADIUS_KM,
  OPERATION_LOCATION,
  formatTime,
  type Flash,
} from "@/lib/lightning/config";

export default function LightningMap({ flashes }: { flashes: Flash[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const center: L.LatLngExpression = [
      OPERATION_LOCATION.latitude,
      OPERATION_LOCATION.longitude,
    ];
    const map = L.map(el, { center, zoom: 10, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    L.circleMarker(center, {
      radius: 6,
      color: "#0f766e",
      fillColor: "#0f766e",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip(OPERATION_LOCATION.name, { permanent: false });

    const rings: Array<[number, string]> = [
      [ALERT_DISTANCE_KM, "#dc2626"],
      [ATTENTION_DISTANCE_KM, "#ca8a04"],
      [MONITOR_RADIUS_KM, "#16a34a"],
    ];
    for (const [km, color] of rings) {
      L.circle(center, {
        radius: km * 1000,
        color,
        weight: 1,
        fill: false,
        dashArray: "4 4",
      }).addTo(map);
    }

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const f of flashes) {
      const color =
        f.distanceKm <= ALERT_DISTANCE_KM
          ? "#dc2626"
          : f.distanceKm <= ATTENTION_DISTANCE_KM
            ? "#ca8a04"
            : "#2563eb";
      L.circleMarker([f.lat, f.lon], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1,
      })
        .bindPopup(
          `<strong>Descarga</strong><br/>${f.distanceKm.toFixed(1)} km da operação<br/>${formatTime(f.at, true)}`,
        )
        .addTo(layer);
    }
  }, [flashes]);

  return <div ref={containerRef} className="h-full w-full rounded-md" />;
}
