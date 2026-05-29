"use server";
import { createClient } from "@/lib/supabase/server";

type CreateInput = { grade: string; name: string; imageUrl: string };
type Result = { ok: true; archived?: boolean; holders?: number } | { ok: false; error: string };

const VALID_GRADES = ["common", "rare", "unique", "epic"];

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

export async function createCard(input: CreateInput): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = (input.name ?? "").trim();
  if (!VALID_GRADES.includes(input.grade)) return { ok: false, error: "등급이 올바르지 않아요." };
  if (!name) return { ok: false, error: "카드 이름을 입력하세요." };
  if (!input.imageUrl) return { ok: false, error: "카드 이미지가 없어요." };

  const { error } = await auth.supabase.from("attendance_cards").insert({
    grade: input.grade,
    name,
    image_url: input.imageUrl,
    is_active: true,
  });
  if (error) {
    return { ok: false, error: `등록 실패: ${error.message}` };
  }
  return { ok: true };
}

export async function toggleCardActive(cardId: string, isActive: boolean): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("attendance_cards")
    .update({ is_active: isActive })
    .eq("id", cardId);
  if (error) return { ok: false, error: `변경 실패: ${error.message}` };
  return { ok: true };
}

export async function deleteCard(cardId: string): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { count } = await auth.supabase
    .from("user_cards")
    .select("id", { count: "exact", head: true })
    .eq("card_id", cardId);

  if ((count ?? 0) > 0) {
    const { error } = await auth.supabase
      .from("attendance_cards")
      .update({ is_active: false })
      .eq("id", cardId);
    if (error) return { ok: false, error: `비활성 실패: ${error.message}` };
    return { ok: true, archived: true, holders: count ?? 0 };
  }

  const { error } = await auth.supabase
    .from("attendance_cards")
    .delete()
    .eq("id", cardId);
  if (error) return { ok: false, error: `삭제 실패: ${error.message}` };
  return { ok: true, archived: false };
}

// ── 11연 패키지 가격 설정 ──
export async function savePackPrice(price: number, active: boolean): Promise<Result> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "가격이 올바르지 않아요." };
  }

  const { error } = await auth.supabase
    .from("platform_settings")
    .upsert(
      { key: "card_pack", value: { price: Math.floor(price), active } },
      { onConflict: "key" }
    );
  if (error) return { ok: false, error: `저장 실패: ${error.message}` };

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/cards");
  return { ok: true };
}
