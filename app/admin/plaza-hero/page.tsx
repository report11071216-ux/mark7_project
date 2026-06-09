import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlazaHeroEditor from "./PlazaHeroEditor";

export default async function AdminPlazaHeroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_platform_admin) redirect("/");

  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "plaza_hero")
    .maybeSingle();

  const value = (setting?.value ?? {}) as {
    active?: boolean;
    image_url?: string;
    title?: string;
    subtitle?: string;
    show_stats?: boolean;
  };

  const initial = {
    active: value.active ?? true,
    image_url: value.image_url ?? "",
    title: value.title ?? "길드패스",
    subtitle: value.subtitle ?? "",
    show_stats: value.show_stats ?? true,
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">광장 배너 관리</h1>
        <p className="text-sm text-zinc-500 mb-6">광장 상단 히어로 배너의 이미지와 문구를 설정합니다.</p>
        <PlazaHeroEditor initial={initial} />
      </div>
    </div>
  );
}
