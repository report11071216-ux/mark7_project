"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 6자리 길드 코드 생성 (헷갈리는 0/O/1/I 제외)
function generateGuildCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGuild(
  prevState: { error: string | null },
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || name.length < 2) {
    return { error: "길드 이름은 2자 이상이어야 합니다." };
  }

  if (name.length > 30) {
    return { error: "길드 이름은 30자 이하여야 합니다." };
  }

  // 고유 코드 생성 (중복 시 최대 10번 재시도)
  let code = generateGuildCode();
  for (let attempts = 0; attempts < 10; attempts++) {
    const { data: existing } = await supabase
      .from("guilds")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateGuildCode();
  }

  // 길드 생성
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .insert({
      name,
      description: description || null,
      code,
      master_id: user.id,
      member_count: 1,
      max_members: 50,
      is_recruiting: true,
      total_points: 0,
    })
    .select()
    .single();

  if (guildError || !guild) {
    return { error: `길드 생성 실패: ${guildError?.message ?? "알 수 없는 오류"}` };
  }

  // 마스터를 멤버로 추가
  const { error: memberError } = await supabase
    .from("guild_members")
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      role: "master",
      points: 0,
    });

  if (memberError) {
    return { error: `멤버 등록 실패: ${memberError.message}` };
  }

  redirect(`/guild/${guild.code}`);
}

export async function joinGuild(
  prevState: { error: string | null },
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const rawCode = String(formData.get("code") ?? "");
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (code.length !== 6) {
    return { error: "길드 코드는 6자리여야 합니다." };
  }

  // 길드 조회
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .select("id, code, name, member_count, max_members, is_recruiting")
    .eq("code", code)
    .maybeSingle();

  if (guildError || !guild) {
    return { error: "해당 길드 코드를 찾을 수 없습니다." };
  }

  if (!guild.is_recruiting) {
    return { error: "이 길드는 현재 모집 중이 아닙니다." };
  }

  if ((guild.member_count ?? 0) >= (guild.max_members ?? 50)) {
    return { error: "이 길드는 정원이 가득 찼습니다." };
  }

  // 이미 가입했는지 확인
  const { data: existing } = await supabase
    .from("guild_members")
    .select("id")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 이미 멤버라면 그냥 해당 길드로 이동
    redirect(`/guild/${guild.code}`);
  }

  // 멤버 추가
  const { error: memberError } = await supabase
    .from("guild_members")
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      role: "member",
      points: 0,
    });

  if (memberError) {
    return { error: `가입 실패: ${memberError.message}` };
  }

  // 길드 멤버 수 증가
  await supabase
    .from("guilds")
    .update({ member_count: (guild.member_count ?? 0) + 1 })
    .eq("id", guild.id);

  redirect(`/guild/${guild.code}`);
}
