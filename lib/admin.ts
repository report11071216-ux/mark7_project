import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.is_platform_admin !== true) {
    redirect("/");
  }

  return { supabase, user, profile };
}
