"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function purchaseItem(
  guildCode: string,
  itemId: string,
  guildId: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data, error } = await supabase.rpc("purchase_shop_item", {
    p_item_id: itemId,
    p_guild_id: guildId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; item_name?: string; price?: number };

  if (result.success) {
    revalidatePath(`/guild/${guildCode}/shop`);
    revalidatePath(`/guild/${guildCode}`);
  }

  return result;
}

export async function activateMegaphone(
  guildCode: string,
  purchaseId: string,
  message: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data, error } = await supabase.rpc("activate_megaphone", {
    p_purchase_id: purchaseId,
    p_message: message,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };

  if (result.success) {
    revalidatePath(`/guild/${guildCode}/shop`);
    revalidatePath("/plaza");
  }

  return result;
}
