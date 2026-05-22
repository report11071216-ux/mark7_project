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
    .upsert(
      { key: "guardian_images", value: updated, description: "가디언별 이미지 URL" },
      { onConflict: "key" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/plaza");
  revalidatePath("/admin/guardian");
}
