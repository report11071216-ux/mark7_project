"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HeroValue = {
  active: boolean;
  image_url: string;
  title: string;
  subtitle: string;
  show_stats: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, ok: Boolean(profile?.is_platform_admin) };
}

// 이미지 업로드 → public URL 반환
export async function uploadHeroImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "권한이 없습니다" };

  const file = formData.get("image");
  if (!file || typeof file === "string") {
    return { ok: false, error: "이미지를 선택해 주세요." };
  }
  const f = file as File;
  if (!f.type.startsWith("image/")) {
    return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
  }
  if (f.size > 5 * 1024 * 1024) {
    return { ok: false, error: "이미지는 5MB 이하만 가능해요." };
  }

  const ext = (f.name.split(".").pop() || "png").toLowerCase();
  const path = `hero/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("plaza-banners")
    .upload(path, f, { contentType: f.type, upsert: false });
  if (upErr) {
    return { ok: false, error: `업로드 실패: ${upErr.message}` };
  }

  const { data: pub } = supabase.storage
    .from("plaza-banners")
    .getPublicUrl(path);

  return { ok: true, url: pub.publicUrl };
}

// 히어로 설정 저장 (RPC 경유)
export async function saveHero(value: HeroValue): Promise<Result> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { ok: false, error: "권한이 없습니다" };

  const { error } = await supabase.rpc("update_plaza_hero", { p_value: value });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/plaza");
  revalidatePath("/admin/plaza-hero");
  return { ok: true };
}
