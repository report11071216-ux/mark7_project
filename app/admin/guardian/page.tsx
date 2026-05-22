import { requireAdmin } from "@/lib/admin";
import GuardianManager from "@/components/admin/GuardianManager";

export const dynamic = "force-dynamic";

export default async function AdminGuardianPage() {
  const { supabase } = await requireAdmin();

  const [indexResult, imagesResult, weaknessesResult] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "current_guardian_index")
      .maybeSingle(),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "guardian_images")
      .maybeSingle(),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "guardian_weaknesses")
      .maybeSingle(),
  ]);

  const currentIndex = Number(indexResult.data?.value ?? 0);
  const guardianImages = (imagesResult.data?.value ?? {}) as { [key: string]: string };
  const guardianWeaknesses = (weaknessesResult.data?.value ?? {}) as {
    [key: string]: { name: string; color: string }[];
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">가디언 토벌 관리</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          카드를 클릭하면 이번 주 가디언이 변경돼요. 이미지·취약속성은 광장에 바로 반영됩니다.
        </p>
      </div>
      <GuardianManager
        currentIndex={currentIndex}
        guardianImages={guardianImages}
        guardianWeaknesses={guardianWeaknesses}
      />
    </div>
  );
}
