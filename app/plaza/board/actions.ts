"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;

  if (!title?.trim() || !content?.trim()) return;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: title.trim(),
      content: content.trim(),
      category,
      author_id: user.id,
      is_notice: false,
      view_count: 0,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/plaza/board");
  redirect(`/plaza/board/${data.id}`);
}

export async function createComment(postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: "댓글 작성 실패" };

  revalidatePath(`/plaza/board/${postId}`);
  return { error: null };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  revalidatePath("/plaza/board");
  redirect("/plaza/board");
}
// ── 광장 글 좋아요 토글 ──
export async function togglePostLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  // 이미 눌렀는지 확인
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 취소
    await supabase
      .from("post_likes")
      .delete()
      .eq("id", existing.id);
  } else {
    // 추가
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });
    if (error) {
      return { success: false, error: `좋아요 실패: ${error.message}` };
    }
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/plaza/board/${postId}`);
  revalidatePath("/plaza");
  return { success: true, liked: !existing };
}
