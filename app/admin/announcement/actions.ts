"use server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function saveAnnouncement(
  message: string,
  link: string,
  active: boolean
) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .update({ value: { message, link, active } })
    .eq("key", "plaza_announcement");
  if (error) throw new Error(error.message);
  revalidatePath("/plaza");
  revalidatePath("/admin/announcement");
}
