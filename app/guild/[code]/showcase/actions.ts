"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getShowcaseResetBoundary } from "@/lib/showcase";

type UploadResult = { ok: true } | { ok: false; error: string };

export async function uploadShowcase(
  guildCode: string,
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const code = guildCode.toUpperCase();
  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) return { ok: false, error: "길드를 찾을 수 없어요." };

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["master", "submaster"].includes(membership.role)) {
    return { ok: false, error: "길드 마스터/부마스터만 자랑할 수 있어요." };
  }

  // 하루 1장 — 오늘 자랑 구간(오전 6시 KST 이후)에 이미 올렸는지
  const boundary = getShowcaseResetBoundary();
  const { data: todayRows } = await supabase
    .from("guild_showcases")
    .select("id")
    .eq("guild_id", guild.id)
    .gte("created_at", boundary)
    .limit(1);
  if (todayRows && todayRows.length > 0) {
    return { ok: false, error: "오늘은 이미 자랑했어요. 내일 오전 6시 이후 다시 가능해요." };
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
  const path = `${guild.id}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("guild-showcases")
    .upload(path, f, { contentType: f.type, upsert: false });
  if (upErr) {
    return { ok: false, error: `업로드 실패: ${upErr.message}` };
  }

  const { data: pub } = supabase.storage
    .from("guild-showcases")
    .getPublicUrl(path);

  const { error: insErr } = await supabase
    .from("guild_showcases")
    .insert({
      guild_id: guild.id,
      image_url: pub.publicUrl,
      created_by: user.id,
    });
  if (insErr) {
    return { ok: false, error: `등록 실패: ${insErr.message}` };
  }

  revalidatePath("/plaza");
  revalidatePath(`/guild/${code}`);
  return { ok: true };
}
