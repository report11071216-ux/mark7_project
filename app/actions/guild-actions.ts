"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function extractPathsByBucket(
  urls: (string | null | undefined)[],
  bucketName: string
): string[] {
  const marker = `/${bucketName}/`;
  const out: string[] = [];
  for (const u of urls) {
    if (!u) continue;
    const idx = u.indexOf(marker);
    if (idx === -1) continue;
    const path = u.substring(idx + marker.length).split("?")[0];
    if (path) out.push(path);
  }
  return out;
}

export async function deleteGuild(
  guildId: string,
  confirmCode: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: guild, error: guildErr } = await supabase
    .from("guilds")
    .select("id, code, master_id")
    .eq("id", guildId)
    .maybeSingle();

  if (guildErr || !guild) {
    return { error: "길드를 찾을 수 없습니다." };
  }

  if (guild.master_id !== user.id) {
    return { error: "길드 마스터만 삭제할 수 있어요." };
  }

  const normalizedInput = (confirmCode ?? "").trim().toUpperCase();
  const expected = (guild.code ?? "").toUpperCase();
  if (!normalizedInput || normalizedInput !== expected) {
    return { error: "입력한 길드 코드가 일치하지 않습니다." };
  }

  // ─ Storage 정리 ─
  // 길드 자랑 이미지
  const { data: showcases } = await supabase
    .from("guild_showcases")
    .select("image_url")
    .eq("guild_id", guildId);
  const showcasePaths = extractPathsByBucket(
    (showcases ?? []).map((s: any) => s.image_url),
    "guild-showcases"
  );
  if (showcasePaths.length > 0) {
    await supabase.storage.from("guild-showcases").remove(showcasePaths);
  }

  // 레이드 이미지
  const { data: raids } = await supabase
    .from("raids")
    .select("image_url")
    .eq("guild_id", guildId);
  const raidPaths = extractPathsByBucket(
    (raids ?? []).map((r: any) => r.image_url),
    "raid-images"
  );
  if (raidPaths.length > 0) {
    await supabase.storage.from("raid-images").remove(raidPaths);
  }

  // ─ DB 삭제 (모든 자식 테이블 CASCADE) ─
  const { error: deleteError } = await supabase
    .from("guilds")
    .delete()
    .eq("id", guildId);

  if (deleteError) {
    return { error: `길드 삭제 실패: ${deleteError.message}` };
  }

  redirect("/plaza");
}
