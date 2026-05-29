import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StickerPackForm from "@/components/admin/StickerPackForm";

export const dynamic = "force-dynamic";

export default async function AdminStickersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_platform_admin) {
    redirect("/");
  }

  // 기존 이모티콘팩 목록 (관리용)
  const { data: packs } = await supabase
    .from("shop_items")
    .select("id, name, price, image_url, is_active, created_at")
    .eq("category", "이모티콘팩")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PLATFORM ADMIN</p>
          <h1 className="text-xl font-bold text-slate-900">이모티콘팩 등록</h1>
          <p className="text-sm text-slate-500 mt-1">
            이모티콘 5개를 묶어 한 팩으로 등록해요. 길드샵에서 포인트로 판매됩니다.
          </p>
        </div>

        <StickerPackForm />

        {/* 등록된 팩 목록 */}
        <div className="mt-10">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">등록된 팩</p>
          {(packs ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">아직 등록된 팩이 없어요.</p>
          ) : (
            <div className="space-y-2">
              {(packs ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.price.toLocaleString()}P</p>
                  </div>
                  {!p.is_active && (
                    <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                      비활성
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
