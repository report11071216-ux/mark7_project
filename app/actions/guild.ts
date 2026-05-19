"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type GuildInfoInput = {
  guildId: string;
  guildCode: string;
  name: string;
  description: string;
  maxMembers: number;
  isRecruiting: boolean;
};

export async function updateGuildInfo(input: GuildInfoInput) {
  const supabase = createClient();

  // 1. 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 2. 마스터 + 현재 멤버 수 확인
  const { data: guild } = await supabase
    .from("guilds")
    .select("master_id, member_count")
    .eq("id", input.guildId)
    .maybeSingle();

  if (!guild || guild.master_id !== user.id) {
    return { success: false, error: "길드 마스터만 수정할 수 있습니다." };
  }

  // 3. 입력 검증
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 30) {
    return { success: false, error: "길드 이름은 2~30자 사이여야 합니다." };
  }

  if (input.description.length > 1000) {
    return { success: false, error: "길드 소개는 1000자 이내로 작성해주세요." };
  }

  if (input.maxMembers < guild.member_count) {
    return {
      success: false,
      error: `현재 멤버 수(${guild.member_count}명)보다 적게 설정할 수 없습니다.`,
    };
  }

  if (input.maxMembers < 1 || input.maxMembers > 500) {
    return { success: false, error: "최대 인원은 1~500명으로 설정해주세요." };
  }

  // 4. 업데이트
  const { error } = await supabase
    .from("guilds")
    .update({
      name: trimmedName,
      description: input.description.trim() || null,
      max_members: input.maxMembers,
      is_recruiting: input.isRecruiting,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.guildId);

  if (error) {
    // 이름 UNIQUE 위반
    if (error.code === "23505") {
      return { success: false, error: "이미 사용 중인 길드 이름입니다." };
    }
    return { success: false, error: "저장 중 오류: " + error.message };
  }

  // 5. 관련 페이지 캐시 갱신
  revalidatePath(`/g/${input.guildCode}`);
  revalidatePath(`/g/${input.guildCode}/admin`);
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-guilds");

  return { success: true };
}
