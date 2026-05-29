"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveGuildAppearance(
  guildId: string,
  guildCode: string,
  data: {
    primary_color: string;
    background_color: string;
    welcome_message: string;
    banner_url: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    throw new Error("권한이 없어요");
  }
  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      {
        guild_id: guildId,
        primary_color: data.primary_color,
        background_color: data.background_color,
        welcome_message: data.welcome_message,
        banner_url: data.banner_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/guild/${guildCode}`, "layout");
  revalidatePath(`/guild/${guildCode}/admin`);
}

// ── 배너 이미지 업로드 (guild-banners 버킷) ──
type BannerResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadGuildBanner(
  guildId: string,
  formData: FormData
): Promise<BannerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { ok: false, error: "길드 마스터/부마스터만 변경할 수 있어요." };
  }

  const file = formData.get("image");
  if (!file || typeof file === "string") {
    return { ok: false, error: "이미지를 선택해 주세요." };
  }
  const f = file as File;
  if (!f.type.startsWith("image/")) {
    return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
  }
  if (f.size > 5 * 1024 * 1024) {
    return { ok: false, error: "이미지는 5MB 이하만 가능해요." };
  }

  const ext = (f.name.split(".").pop() || "png").toLowerCase();
  const path = `${guildId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("guild-banners")
    .upload(path, f, { contentType: f.type, upsert: false });
  if (upErr) {
    return { ok: false, error: `업로드 실패: ${upErr.message}` };
  }

  const { data: pub } = supabase.storage
    .from("guild-banners")
    .getPublicUrl(path);

  return { ok: true, url: pub.publicUrl };
}
// ── 카드 스타일 저장 (solid / glass-light / glass-dark) ──
export async function saveCardStyle(
  guildId: string,
  guildCode: string,
  cardStyle: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { success: false, error: "마스터/부마스터만 변경할 수 있어요." };
  }

  const valid = ["solid", "glass-light", "glass-dark"];
  if (!valid.includes(cardStyle)) {
    return { success: false, error: "올바르지 않은 스타일이에요." };
  }

  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      { guild_id: guildId, card_style: cardStyle },
      { onConflict: "guild_id" }
    );
  if (error) {
    return { success: false, error: `저장 실패: ${error.message}` };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/guild/${guildCode}`);
  return { success: true };
}
