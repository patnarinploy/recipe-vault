"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, X, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { createUserStore, updateUserStore } from "@/app/actions/stores";
import type { UserStore } from "@/lib/types";
import { useLocale } from "@/lib/locale";

const DynamicLocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

export const STORE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export default function StoreFormInline({
  store, onSave, onCancel,
}: {
  store?: UserStore;
  onSave: (saved: UserStore) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const s = t.shopping;
  const [name, setName]             = useState(store?.name ?? "");
  const [color, setColor]           = useState(store?.color ?? STORE_COLORS[4]);
  const [lat, setLat]               = useState(store?.latitude  != null ? String(store.latitude)  : "");
  const [lng, setLng]               = useState(store?.longitude != null ? String(store.longitude) : "");
  const [mapPickerOpen, setMapOpen] = useState(false);
  const [saving, setSaving]         = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error(s.storeName); return; }
    setSaving(true);
    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;
    try {
      if (store) {
        const res = await updateUserStore(store.id, { name, color, latitude: latNum, longitude: lngNum });
        if ("error" in res) { toast.error(res.error); setSaving(false); return; }
        onSave({ ...store, name: name.trim(), color, latitude: latNum, longitude: lngNum });
      } else {
        const res = await createUserStore(name, color, latNum, lngNum);
        if ("error" in res) { toast.error(res.error); setSaving(false); return; }
        onSave(res as UserStore);
      }
    } catch {
      toast.error(t.common.error);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-900/30 p-4 space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 block">{s.storeName}</label>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder={s.storeNamePh}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) handleSave(); if (e.key === "Escape") onCancel(); }}
            className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-surface text-foreground"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 block">{s.storeColor}</label>
          <div className="flex gap-2 flex-wrap">
            {STORE_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 shrink-0"
                style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 block">{s.storeLocation}</label>
          {lat && lng && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-elevated rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-xs text-secondary font-mono flex-1 truncate">
                {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
              </span>
              <a href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-0.5 shrink-0">
                <ExternalLink className="w-3 h-3" /> {s.viewGoogleMaps}
              </a>
              <button onClick={() => { setLat(""); setLng(""); }}
                className="text-muted hover:text-red-500 shrink-0 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button type="button" onClick={() => setMapOpen(true)}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-orange-400 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 text-sm text-orange-500 hover:text-orange-600 transition-colors">
            <MapPin className="w-4 h-4" />
            {lat && lng ? s.changeLocation : s.setOnMap}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors">
            {t.common.cancel}
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
            <Check className="w-4 h-4" /> {t.common.save}
          </button>
        </div>
      </div>

      {/* Full-screen map picker */}
      {mapPickerOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col" style={{ background: "var(--bg)" }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <h3 className="font-semibold text-foreground text-sm flex-1">{s.setOnMap}</h3>
            <button onClick={() => setMapOpen(false)} className="p-1 text-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <DynamicLocationPicker
              initialPos={lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined}
              onConfirm={(newLat, newLng) => {
                setLat(newLat.toFixed(6));
                setLng(newLng.toFixed(6));
                setMapOpen(false);
              }}
              onCancel={() => setMapOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
