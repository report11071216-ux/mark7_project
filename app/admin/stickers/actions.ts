"use server";
import { createClient } from "@/lib/supabase/server";

type CreateInput = {
  name: string;
  price: number;
  coverUrl: string;
  stickerUrls: string[];
};

type Result = { ok: true } | { ok: false; error: string };

async function assertPlatformAdmin(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) {
    return { ok: false, error: "플랫폼 관리자만 등록할 수 있어요." };
  }
  return { ok: true };
}

export async function createStickerPack(input: CreateInput): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error ?? "권한 없음" };

  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, error: "팩 이름을 입력하세요." };
  if (!input.price || input.price < 0) return { ok: false, error: "가격이 올바르지 않아요." };
  if (!input.coverUrl) return { ok: false, error: "대표 이미지가 없어요." };
  const stickers = (input.stickerUrls ?? []).filter((u) => u);
  if (stickers.length !== 5) return { ok: false, error: "이모티콘 5개가 필요해요." };

  const supabase = await createClient();

  // 1. shop_items에 팩 등록
  const { data: pack, error: packErr } = await supabase
    .from("shop_items")
    .insert({
      shop_type: "guild",
      category: "이모티콘팩",
      name,
      price: input.price,
      image_url: input.coverUrl,
      is_active: true,
    })
    .select("id")
    .single();

  if (packErr || !pack) {
    return { ok: false, error: `팩 등록 실패: ${packErr?.message ?? "알 수 없음"}` };
  }

  // 2. stickers에 5개 등록
  const rows = stickers.map((url, i) => ({
    shop_item_id: pack.id,
    image_url: url,
    sort_order: i,
  }));

  const { error: stickerErr } = await supabase.from("stickers").insert(rows);

  if (stickerErr) {
    // 팩은 만들어졌는데 이모티콘 실패 → 팩 롤백(삭제)
    await supabase.from("shop_items").delete().eq("id", pack.id);
    return { ok: false, error: `이모티콘 등록 실패: ${stickerErr.message}` };
  }

  return { ok: true };
}
