import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 명시적 next 파라미터가 있으면 우선
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // 사용자가 속한 길드 조회 (가장 먼저 가입한 길드)
      const { data: memberships } = await supabase
        .from("guild_members")
        .select("guild_id, guilds(code)")
        .eq("user_id", data.user.id)
        .order("joined_at", { ascending: true })
        .limit(1);

      if (memberships && memberships.length > 0 && memberships[0].guilds) {
        const guildCode = (memberships[0].guilds as any).code;
        return NextResponse.redirect(`${origin}/guild/${guildCode}`);
      }

      // 길드가 없으면 온보딩으로
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
