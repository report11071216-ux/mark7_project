"use server";
import { createClient } from "@/lib/supabase/server";

type CreateInput = { name: string; price: number; imageUrl: string };
type Result = { ok: true } | { ok: false; error: string };

async function assertPlatformAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인이 필요해요." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) {
    return { ok: false as const, error: "플랫폼 관리자만 등록할 수 있어요." };
  }
  return { ok: true as const, supabase };
}

export async function createBackground(input: CreateInput): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, error: "배경 이름을 입력하세요." };
  if (!input.price || input.price < 0) return { ok: false, error: "가격이 올바르지 않아요." };
  if (!input.imageUrl) return { ok: false, error: "배경 이미지가 없어요." };

  const { error } = await auth.supabase.from("shop_items").insert({
    shop_type: "guild",
    category: "길드배경",
    name,
    price: input.price,
    image_url: input.imageUrl,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: `등록 실패: ${error.message}` };
  }
  return { ok: true };
}
