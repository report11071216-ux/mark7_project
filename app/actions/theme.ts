"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ThemeInput = {
  guildId: string;
  guildCode: string;
  primaryColor: string;
  backgroundColor: string;
  bannerUrl: string;
  welcomeMessage: string;
};

export async function updateGuildTheme(input: ThemeInput) {
  const supabase = createClient();

  // 1. 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 2. 마스터 권한 확인 (서버 측 이중 검증)
  const { data: guild } = await supabase
    .from("guilds")
    .select("master_id")
    .eq("id", input.guildId)
    .maybeSingle();

  if (!guild || guild.master_id !== user.id) {
    return { success: false, error: "길드 마스터만 수정할 수 있습니다." };
  }

  // 3. 색상 형식 검증 (#RRGGBB)
  const colorRegex = /^#[0-9a-fA-F]{6}$/;
  if (
    !colorRegex.test(input.primaryColor) ||
    !colorRegex.test(input.backgroundColor)
  ) {
    return { success: false, error: "색상 형식이 올바르지 않습니다." };
  }

  // 4. URL 길이 제한 (DB 안정성)
  if (input.bannerUrl && input.bannerUrl.length > 500) {
    return { success: false, error: "배너 URL이 너무 깁니다." };
  }
  if (input.welcomeMessage.length > 500) {
    return { success: false, error: "환영 메시지는 500자 이내로 작성해주세요." };
  }

  // 5. 업데이트
  const { error } = await supabase
    .from("guild_themes")
    .update({
      primary_color: input.primaryColor,
      background_color: input.backgroundColor,
      banner_url: input.bannerUrl || null,
      welcome_message: input.welcomeMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq("guild_id", input.guildId);

  if (error) {
    return { success: false, error: "저장 중 오류: " + error.message };
  }

  // 6. 캐시 갱신 (길드 페이지에 즉시 반영)
  revalidatePath(`/g/${input.guildCode}`);
  revalidatePath(`/g/${input.guildCode}/admin`);

  return { success: true };
}
