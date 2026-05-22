"use server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function setGuardianIndex(index: number) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .update({ value: index })
    .eq("key", "current_guardian_index");
  if (error) throw new Error(error.message);
  revalidatePath("/plaza");
  revalidatePath("/admin/guardian");
}

export async function setGuardianImage(index: number, imageUrl: string) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "guardian_images")
    .maybeSingle();
  const current = (data?.value ?? {}) as { [key: string]: string };
  const updated = { ...current, [String(index)]: imageUrl };
  const { error } = await supabase
    .from("platform_settings")
    .update({ value: updated })
    .eq("key", "guardian_images");
  if (error) throw new Error(error.message);
  revalidatePath("/plaza");
  revalidatePath("/admin/guardian");
}

export async function setGuardianWeaknesses(
  index: number,
  weaknesses: { name: string; color: string }[]
) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "guardian_weaknesses")
    .maybeSingle();
  const current = (data?.value ?? {}) as { [key: string]: { name: string; color: string }[] };
  const updated = { ...current, [String(index)]: weaknesses };
  const { error } = await supabase
    .from("platform_settings")
    .update({ value: updated })
    .eq("key", "guardian_weaknesses");
  if (error) throw new Error(error.message);
  revalidatePath("/plaza");
  revalidatePath("/admin/guardian");
}
