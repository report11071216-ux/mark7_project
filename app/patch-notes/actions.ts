"use server";
import { createClient } from "@/lib/supabase/server";

export async function markPatchNotesRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("mark_patch_notes_read");
}
