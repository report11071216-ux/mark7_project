"use server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

type CardInput = {
  name: string;
  description: string;
  image_url: string;
  design: any;
  price: number;
};

export async function createGuildCard(input: CardInput) {
  await requireAdmin();
  const supabase = await createClient();
  if (!input.name.trim()) {
    return { success: false, error: "상품 이름을 입력하세요" };
  }
  if (typeof input.price !== "number" || isNaN(input.price) || input.price < 0) {
    return { success: false, error: "가격이 올바르지 않습니다" };
  }
  const { error } = await supabase.from("guild_nameplate_cards").insert({
    name: input.name.trim(),
    description: input.description.trim() || null,
    image_url: input.image_url || null,
    design: input.design ?? {},
    price: input.price,
    is_active: true,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/guild-cards");
  return { success: true };
}

export async function toggleGuildCard(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("guild_nameplate_cards")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/guild-cards");
  return { success: true };
}

export async function deleteGuildCard(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("guild_nameplate_cards").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/guild-cards");
  return { success: true };
}
