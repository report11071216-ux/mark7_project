"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(guildCode: string, postId: string, content: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "댓글 내용을 입력하세요" };
  }
  if (trimmed.length > 1000) {
    return { success: false, error: "댓글은 1000자 이하로 작성해주세요" };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${guildCode.toUpperCase()}/posts/${postId}`);
  return { success: true };
}

export async function deleteComment(guildCode: string, postId: string, commentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) {
    return { success: false, error: "댓글을 찾을 수 없습니다" };
  }
  if (comment.author_id !== user.id) {
    return { success: false, error: "본인 댓글만 삭제할 수 있습니다" };
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${guildCode.toUpperCase()}/posts/${postId}`);
  return { success: true };
}
