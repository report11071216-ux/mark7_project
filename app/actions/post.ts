"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success?: boolean;
  error?: string;
  postId?: string;
};

export async function createPost(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const guildId = formData.get("guild_id") as string | null;
  const category =
    (formData.get("category") as string) || "free";

  if (!title || title.length < 2) {
    return {
      error: "제목은 2글자 이상이어야 합니다.",
    };
  }

  if (!content || content.length < 2) {
    return {
      error: "내용을 입력해주세요.",
    };
  }

  if (title.length > 100) {
    return {
      error: "제목은 100자 이내여야 합니다.",
    };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      title,
      content,
      guild_id: guildId || null,
      category: guildId ? "free" : category,
    })
    .select()
    .single();

  if (error) {
    return {
      error: "글 작성 중 오류: " + error.message,
    };
  }

  revalidatePath("/");

  if (guildId) {
    revalidatePath(`/g/`);
  }

  return {
    success: true,
    postId: post.id,
  };
}

export async function createComment(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const content = (formData.get("content") as string)?.trim();
  const postId = formData.get("post_id") as string;

  if (!content || content.length < 1) {
    return {
      error: "댓글 내용을 입력해주세요.",
    };
  }

  if (content.length > 500) {
    return {
      error: "댓글은 500자 이내여야 합니다.",
    };
  }

  const { error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
    });

  if (error) {
    return {
      error: "댓글 작성 오류: " + error.message,
    };
  }

  revalidatePath(`/posts/${postId}`);

  return { success: true };
}

export async function deletePost(
  postId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "삭제 중 오류" };
  }

  revalidatePath("/");

  return { success: true };
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "삭제 중 오류" };
  }

  revalidatePath(`/posts/${postId}`);

  return { success: true };
}

export async function incrementViewCount(postId: string) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("view_count")
    .eq("id", postId)
    .single();

  if (post) {
    await supabase
      .from("posts")
      .update({
        view_count: post.view_count + 1,
      })
      .eq("id", postId);
  }
}
