"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveGuildAppearance(
  guildId: string,
  guildCode: string,
  data: {
    primary_color: string;
    background_color: string;
    welcome_message: string;
    banner_url: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || !["master", "submaster"].includes(member.role)) {
    throw new Error("권한이 없어요");
  }

  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      {
        guild_id: guildId,
        primary_color: data.primary_color,
        background_color: data.background_color,
        welcome_message: data.welcome_message,
        banner_url: data.banner_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/guild/${guildCode}`);
  revalidatePath(`/guild/${guildCode}/admin`);
}
