"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import type { PresetUnit } from "@/lib/types";

// ── Preset Units ─────────────────────────────────────────────────────────────

export async function createPresetUnit(
  data: { unit_name_th: string; unit_name_en: string; sort_order: number }
): Promise<PresetUnit | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("preset_units")
    .insert(data)
    .select()
    .single<PresetUnit>();
  if (error) return { error: error.message };
  return row;
}

export async function updatePresetUnit(
  id: string,
  data: { unit_name_th?: string; unit_name_en?: string; sort_order?: number }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_units").update(data).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deletePresetUnit(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_units").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

