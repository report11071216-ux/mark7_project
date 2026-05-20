import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // 응답 객체를 먼저 만들고, 쿠키를 이 객체에 직접 쓴다
  const response = NextResponse.redirect(`${origin}/onboarding`);
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 명시적 next 파라미터가 있으면 우선
  if (next) {
    const nextResponse = NextResponse.redirect(`${origin}${next}`);
    // 이미 set된 쿠키들을 새 응답으로 옮긴다
    response.cookies.getAll().forEach((cookie) => {
      nextResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return nextResponse;
  }

  // 사용자가 속한 길드 조회
  const { data: memberships } = await supabase
    .from("guild_members")
    .select("guild_id, guilds(code)")
    .eq("user_id", data.user.id)
    .order("joined_at", { ascending: true })
    .limit(1);

  let redirectPath = "/onboarding";
  if (memberships && memberships.length > 0 && memberships[0].guilds) {
    const guildCode = (memberships[0].guilds as any).code;
    redirectPath = `/guild/${guildCode}`;
  }

  // 최종 리다이렉트 응답 생성, 쿠키 옮기기
  const finalResponse = NextResponse.redirect(`${origin}${redirectPath}`);
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return finalResponse;
}
