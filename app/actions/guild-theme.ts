"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type LayoutColumns } from "@/lib/guild-layout-config";

// 위젯 빌더 저장 — 좌/중/우 컬럼 배치를 version 2 포맷으로 저장
export async function saveCustomLayout(
  guildId: string,
  guildCode: string,
  columns: LayoutColumns
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
        layout_config: { version: 2, columns: columns },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/guild/${guildCode}`);
}
