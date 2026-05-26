"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type NewPostInput = {
  title: string;
  content: string;
  is_notice: boolean;
};

export async function createGuildPost(guildCode: string, input: NewPostInput) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { success: false, error: "길드 멤버만 글을 쓸 수 있습니다" };
  }

  // 공지는 마스터·부마스터만
  const isStaff = membership.role === "master" || membership.role === "submaster";
  const finalIsNotice = isStaff ? input.is_notice : false;

  if (!input.title.trim() || !input.content.trim()) {
    return { success: false, error: "제목과 내용을 입력하세요" };
  }

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      guild_id: guild.id,
      author_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      is_notice: finalIsNotice,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "등록 실패" };
  }

  revalidatePath(`/guild/${code}/posts`);
  return { success: true, postId: inserted.id };
}
