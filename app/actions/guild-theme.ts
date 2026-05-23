"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { THEMES, type ThemeWidget } from "@/lib/themes";

export async function saveGuildTheme(guildId: string, themeId: string, guildCode: string) {
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

  const theme = THEMES.find((t) => t.id === themeId);
  const widgets = theme?.widgets ?? [];

  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      {
        guild_id: guildId,
        layout_config: { theme: themeId, custom: false, widgets },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/guild/${guildCode}`);
}

export async function saveCustomLayout(
  guildId: string,
  guildCode: string,
  widgets: ThemeWidget[]
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

  const { data: current } = await supabase
    .from("guild_themes")
    .select("layout_config")
    .eq("guild_id", guildId)
    .maybeSingle();

  const currentConfig = (current?.layout_config ?? {}) as { theme?: string };

  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      {
        guild_id: guildId,
        layout_config: {
          theme: currentConfig.theme ?? "conquest",
          custom: true,
          widgets,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/guild/${guildCode}`);
}
