"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useRef, useState, useEffect } from "react";
import { Search, Navigation, Loader2, X } from "lucide-react";
import { useLocale } from "@/lib/locale";

// Orange teardrop pin icon
const PIN_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="#f97316" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

// Exposes the Leaflet map instance via ref
function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  mapRef.current = map;
  return null;
}

// Handles map tap + marker drag
function DragPin({
  pos, setPos,
}: {
  pos: [number, number];
  setPos: (p: [number, number]) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  useMapEvents({ click(e) { setPos([e.latlng.lat, e.latlng.lng]); } });
  return (
    <Marker
      draggable
      position={pos}
      ref={markerRef}
      icon={PIN_ICON}
      eventHandlers={{
        dragend() {
          const ll = markerRef.current?.getLatLng();
          if (ll) setPos([ll.lat, ll.lng]);
        },
      }}
    />
  );
}

type SearchResult = { lat: number; lng: number; label: string; sublabel: string };

interface Props {
  initialPos?: [number, number];
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

const BKK: [number, number] = [13.7563, 100.5018];

export default function LocationPicker({ initialPos, onConfirm, onCancel }: Props) {
  const { t } = useLocale();
  const s = t.shopping;
  const [markerPos, setMarkerPos] = useState<[number, number]>(initialPos ?? BKK);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Nominatim search with 600ms debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=th,en`;
        const res = await fetch(url);
        const data: Record<string, string>[] = await res.json();
        setResults(data.map(r => {
          const parts = r.display_name.split(",");
          return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: parts[0].trim(), sublabel: parts.slice(1, 3).join(",").trim() };
        }));
      } catch { setResults([]); } finally { setSearching(false); }
    }, 600);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const flyTo = (pos: [number, number]) => {
    setMarkerPos(pos);
    mapRef.current?.flyTo(pos, 16, { duration: 1.2 });
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { flyTo([p.coords.latitude, p.coords.longitude]); setLocating(false); },
      () => setLocating(false),
    );
  };

  const handlePickResult = (r: SearchResult) => {
    flyTo([r.lat, r.lng]);
    setQuery(r.label);
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Search row */}
      <div className="relative px-3 pt-3 pb-1 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={s.searchPlace}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-outline rounded-xl bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted" />
            )}
          </div>
          <button onClick={handleGPS} disabled={locating}
            title={s.useMyLocation}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-outline bg-surface text-orange-500 hover:bg-elevated disabled:opacity-50 transition-colors">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          </button>
        </div>

        {/* Search dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-3 right-3 mt-0.5 bg-surface border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
            {results.map((r, i) => (
              <button key={i} onClick={() => handlePickResult(r)}
                className="w-full text-left px-4 py-3 hover:bg-elevated transition-colors border-b border-border/50 last:border-0">
                <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                {r.sublabel && <p className="text-xs text-muted truncate mt-0.5">{r.sublabel}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-muted text-center pb-1.5 shrink-0">{s.pinHint}</p>

      {/* Map */}
      <div className="flex-1 min-h-0 px-3 pb-2">
        <div className="h-full rounded-xl overflow-hidden border border-border" style={{ minHeight: 240 }}>
          <MapContainer
            center={markerPos}
            zoom={14}
            scrollWheelZoom
            style={{ width: "100%", height: "100%", minHeight: 240 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController mapRef={mapRef} />
            <DragPin pos={markerPos} setPos={setMarkerPos} />
          </MapContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-5 pt-1 shrink-0 space-y-2.5">
        <p className="text-xs text-secondary text-center font-mono">
          {markerPos[0].toFixed(6)},&nbsp;{markerPos[1].toFixed(6)}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm bg-elevated hover:bg-border text-secondary transition-colors">
            {t.common.cancel}
          </button>
          <button onClick={() => onConfirm(markerPos[0], markerPos[1])}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
            {s.confirmLocation}
          </button>
        </div>
      </div>
    </div>
  );
}
