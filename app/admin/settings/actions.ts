"use server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function updateSetting(key: string, value: number) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .update({ value })
    .eq("key", key);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
