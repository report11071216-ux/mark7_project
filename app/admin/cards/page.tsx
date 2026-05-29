import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CardForm from "@/components/admin/CardForm";

export const dynamic = "force-dynamic";

const GRADE_LABEL: { [key: string]: string } = {
  common: "커먼", rare: "레어", unique: "유니크", epic: "에픽",
};
const GRADE_ORDER = ["common", "rare", "unique", "epic"];
const GRADE_RING: { [key: string]: string } = {
  common: "ring-slate-300", rare: "ring-blue-400", unique: "ring-violet-500", epic: "ring-red-500",
};

export default async function AdminCardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) redirect("/");

  const { data: cards } = await supabase
    .from("attendance_cards")
    .select("id, grade, name, image_url, is_active, created_at")
    .order("created_at", { ascending: false });

  // 등급별 그룹 + 카운트
  const byGrade: { [key: string]: any[] } = { common: [], rare: [], unique: [], epic: [] };
  for (const c of cards ?? []) {
    if (byGrade[c.grade]) byGrade[c.grade].push(c);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PLATFORM ADMIN</p>
          <h1 className="text-xl font-bold text-slate-900">출석 카드 등록</h1>
          <p className="text-sm text-slate-500 mt-1">
            출석 시 뽑히는 카드를 등록해요. 등급별로 여러 장 등록하면 뽑기 풀에서 랜덤으로 나옵니다.
          </p>
        </div>

        <CardForm />

        <div className="mt-10 space-y-6">
          {GRADE_ORDER.map((g) => (
            <div key={g}>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                {GRADE_LABEL[g]} <span className="text-slate-300">({byGrade[g].length}종)</span>
              </p>
              {byGrade[g].length === 0 ? (
                <p className="text-sm text-slate-400">아직 없어요.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {byGrade[g].map((c) => (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className={`w-full h-full object-cover ring-2 ${GRADE_RING[c.grade]}`} />
                        ) : null}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        {!c.is_active && (
                          <span className="text-[10px] text-slate-400">비활성</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
