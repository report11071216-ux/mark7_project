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

// 좋아요 토글 — 안 눌렀으면 추가, 이미 눌렀으면 취소
export async function toggleGuildPostLike(guildCode: string, postId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .maybeSingle();
  if (!post) {
    return { success: false, error: "글을 찾을 수 없습니다" };
  }

  // 이미 좋아요 눌렀는지 확인
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const current = post.like_count ?? 0;

  if (existing) {
    // 취소
    await supabase.from("post_likes").delete().eq("id", existing.id);
    await supabase
      .from("posts")
      .update({ like_count: Math.max(0, current - 1) })
      .eq("id", postId);

    revalidatePath(`/guild/${guildCode.toUpperCase()}/posts/${postId}`);
    return { success: true, liked: false, likeCount: Math.max(0, current - 1) };
  } else {
    // 추가
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await supabase
      .from("posts")
      .update({ like_count: current + 1 })
      .eq("id", postId);

    revalidatePath(`/guild/${guildCode.toUpperCase()}/posts/${postId}`);
    return { success: true, liked: true, likeCount: current + 1 };
  }
}

export async function deleteGuildPost(guildCode: string, postId: string) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) {
    return { success: false, error: "글을 찾을 수 없습니다" };
  }
  if (post.author_id !== user.id) {
    return { success: false, error: "본인 글만 삭제할 수 있습니다" };
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${code}/posts`);
  return { success: true };
}
