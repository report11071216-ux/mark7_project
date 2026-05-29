import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackgroundForm from "@/components/admin/BackgroundForm";

export const dynamic = "force-dynamic";

export default async function AdminBackgroundsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) redirect("/");

  const { data: backgrounds } = await supabase
    .from("shop_items")
    .select("id, name, price, image_url, is_active, created_at")
    .eq("category", "길드배경")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PLATFORM ADMIN</p>
          <h1 className="text-xl font-bold text-slate-900">길드 배경 등록</h1>
          <p className="text-sm text-slate-500 mt-1">
            길드 홈페이지 전체 배경으로 쓰일 이미지를 등록해요. 길드샵에서 포인트로 판매됩니다.
          </p>
        </div>

        <BackgroundForm />

        <div className="mt-10">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">등록된 배경</p>
          {(backgrounds ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">아직 등록된 배경이 없어요.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(backgrounds ?? []).map((b) => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.price.toLocaleString()}P</p>
                    </div>
                    {!b.is_active && (
                      <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 shrink-0">비활성</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
