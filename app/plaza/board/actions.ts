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
