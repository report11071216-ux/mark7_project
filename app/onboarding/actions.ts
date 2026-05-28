"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isValidServer } from "@/lib/lostark-servers";
import { sendGuildWebhook, buildWelcomeMessage } from "@/lib/discord";

const GUILD_LIMIT = 2;
const GUILD_LIMIT_MSG =
  "최대 2개까지 길드에 참여할 수 있어요. 추가 길드는 결제 단계 이후 가능해요.";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { count: existingCount } = await supabase
    .from("guild_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((existingCount ?? 0) >= GUILD_LIMIT) {
    return { error: GUILD_LIMIT_MSG };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const server = String(formData.get("server") ?? "").trim();
  if (!name || name.length < 2) {
    return { error: "길드 이름은 2자 이상이어야 합니다." };
  }
  if (name.length > 30) {
    return { error: "길드 이름은 30자 이하여야 합니다." };
  }
  if (!isValidServer(server)) {
    return { error: "서버를 선택해 주세요." };
  }
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
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .insert({
      name,
      description: description || null,
      server,
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
  const supabase = await createClient();
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
  const { data: existing } = await supabase
    .from("guild_members")
    .select("id")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect(`/guild/${guild.code}`);
  }

  const { count: existingCount } = await supabase
    .from("guild_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((existingCount ?? 0) >= GUILD_LIMIT) {
    return { error: GUILD_LIMIT_MSG };
  }

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
  await supabase
    .from("guilds")
    .update({ member_count: (guild.member_count ?? 0) + 1 })
    .eq("id", guild.id);

  // ── 환영 알림 (redirect 전에 발송) ──
  try {
    const [profileRes, themeRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, main_character_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("guild_themes")
        .select("welcome_message")
        .eq("guild_id", guild.id)
        .maybeSingle(),
    ]);
    const memberName =
      profileRes.data?.main_character_name ||
      profileRes.data?.username ||
      "새 길드원";
    const content = buildWelcomeMessage(
      memberName,
      themeRes.data?.welcome_message
    );
    await sendGuildWebhook(guild.id, "welcome", content);
  } catch {
    // 알림 실패는 가입을 막지 않음
  }

  redirect(`/guild/${guild.code}`);
}
