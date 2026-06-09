"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Result = { success: boolean; error?: string };

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();
  return { supabase, ok: Boolean(profile?.is_platform_admin) };
}

export async function createPatchNote(input: {
  title: string;
  body: string;
  tag: string;
  version: string;
  isPublished: boolean;
}): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { success: false, error: "권한이 없습니다" };

  const { error } = await supabase.rpc("create_patch_note", {
    p_title: input.title,
    p_body: input.body,
    p_tag: input.tag,
    p_version: input.version,
    p_is_published: input.isPublished,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/patch-notes");
  revalidatePath("/patch-notes");
  revalidatePath("/plaza");
  return { success: true };
}

export async function updatePatchNote(input: {
  id: string;
  title: string;
  body: string;
  tag: string;
  version: string;
  isPublished: boolean;
}): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { success: false, error: "권한이 없습니다" };

  const { error } = await supabase.rpc("update_patch_note", {
    p_id: input.id,
    p_title: input.title,
    p_body: input.body,
    p_tag: input.tag,
    p_version: input.version,
    p_is_published: input.isPublished,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/patch-notes");
  revalidatePath("/patch-notes");
  revalidatePath("/plaza");
  return { success: true };
}

export async function deletePatchNote(id: string): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { success: false, error: "권한이 없습니다" };

  const { error } = await supabase.rpc("delete_patch_note", { p_id: id });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/patch-notes");
  revalidatePath("/patch-notes");
  revalidatePath("/plaza");
  return { success: true };
}
