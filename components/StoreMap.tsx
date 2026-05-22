"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { UserStore } from "@/lib/types";

function makeColorIcon(color: string) {
  return L.divIcon({
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ stores }: { stores: UserStore[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = stores
      .filter(s => s.latitude !== null && s.longitude !== null)
      .map(s => [s.latitude!, s.longitude!] as [number, number]);
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

interface Props {
  stores: UserStore[];
  storeItemCounts?: Record<string, number>;
  itemsLabel?: string;
}

export default function StoreMap({ stores, storeItemCounts, itemsLabel }: Props) {
  const withCoords = stores.filter(s => s.latitude !== null && s.longitude !== null);
  if (withCoords.length === 0) return null;

  const first: [number, number] = [withCoords[0].latitude!, withCoords[0].longitude!];

  return (
    <MapContainer
      center={first}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: 280, width: "100%", borderRadius: 16, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stores={withCoords} />
      {withCoords.map(store => (
        <Marker
          key={store.id}
          position={[store.latitude!, store.longitude!]}
          icon={makeColorIcon(store.color)}
        >
          <Popup>
            <strong style={{ color: store.color }}>{store.name}</strong>
            <br />
            {itemsLabel && storeItemCounts && (
              <><span style={{ fontSize: 12 }}>
                {itemsLabel.replace("{n}", String(storeItemCounts[store.id] ?? 0))}
              </span><br /></>
            )}
            <a
              href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#3b82f6" }}
            >
              Google Maps ↗
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
