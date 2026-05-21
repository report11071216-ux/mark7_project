import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login`
    );
  }

  const cookieStore = await cookies();

  const response = NextResponse.redirect(
    `${requestUrl.origin}/onboarding`
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (error || !user) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login`
    );
  }

  const { data: memberships } = await supabase
    .from("guild_members")
    .select("guilds(code)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (memberships?.guilds) {
    response.headers.set(
      "Location",
      `${requestUrl.origin}/guild/${
        (memberships.guilds as any).code
      }`
    );
  }

  return response;
}
