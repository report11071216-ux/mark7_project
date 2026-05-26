"use server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

type CreateItemInput = {
  shop_type: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  frame_url: string;
  duration_hours: number | null;
};

export async function createShopItem(input: CreateItemInput) {
  await requireAdmin();
  const supabase = await createClient();

  if (!input.name.trim()) {
    return { success: false, error: "상품명을 입력하세요" };
  }
  if (input.price < 0) {
    return { success: false, error: "가격이 올바르지 않습니다" };
  }

  // 프로필카드인데 프레임 이미지를 안 올렸으면 썸네일을 프레임으로 사용
  const isProfileCard = input.category.includes("프로필카드");
  const finalFrameUrl =
    input.frame_url || (isProfileCard ? input.image_url : "") || null;

  const { error } = await supabase.from("shop_items").insert({
    shop_type: input.shop_type,
    category: input.category,
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    image_url: input.image_url || null,
    frame_url: finalFrameUrl,
    duration_hours: input.duration_hours,
    is_active: true,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/shop");
  return { success: true };
}

export async function toggleShopItem(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("shop_items")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/shop");
  return { success: true };
}

export async function deleteShopItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("shop_items").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/shop");
  return { success: true };
}
