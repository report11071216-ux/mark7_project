import { createClient } from "@/lib/supabase/server";

export type EffectConf = { [key: string]: any };
export type DesignConf = { [effect: string]: EffectConf };
export type GradeDesigns = { [grade: string]: DesignConf };

// 전 길드 공통 등급 디자인 설정을 한 번 조회
export async function getCardGradeDesigns(): Promise<GradeDesigns> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "card_grade_designs")
    .maybeSingle();
  return (data?.value ?? {}) as GradeDesigns;
}

// 특정 등급의 디자인 설정 꺼내기 (없으면 null → GuildCard가 기본 프리셋 사용)
export function pickDesign(designs: GradeDesigns, grade: string | undefined | null): DesignConf | null {
  const g = grade ?? "free";
  return designs[g] ?? null;
}
