"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import type { PresetUnit, PresetCategory } from "@/lib/types";

// ── Preset Units ─────────────────────────────────────────────────────────────

export async function createPresetUnit(
  data: { unit_name_th: string; unit_name_en: string }
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
  data: { unit_name_th?: string; unit_name_en?: string }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_units").update(data).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function setPresetUnitActive(
  id: string,
  is_active: boolean
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_units").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ── Preset Categories ─────────────────────────────────────────────────────────

export async function createPresetCategory(
  data: { name_th: string; name_en: string }
): Promise<PresetCategory | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("preset_categories")
    .insert(data)
    .select()
    .single<PresetCategory>();
  if (error) return { error: error.message };
  return row;
}

export async function updatePresetCategory(
  id: string,
  data: { name_th?: string; name_en?: string }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_categories").update(data).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function setPresetCategoryActive(
  id: string,
  is_active: boolean
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("preset_categories").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
