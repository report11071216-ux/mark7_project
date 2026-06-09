import { createClient } from "@/lib/supabase/server";
import { getPatchTagMeta } from "@/lib/patch-note-tags";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarkRead from "./MarkRead";

export const revalidate = 60;

type Note = {
  id: string;
  version: string | null;
  title: string;
  body: string;
  tag: string;
  created_at: string;
};

export default async function PatchNotesPage() {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("patch_notes")
    .select("id, version, title, body, tag, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const list = (notes ?? []) as Note[];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <MarkRead />
      <div className="mx-auto max-w-2xl">
        <Link href="/plaza" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          광장으로
        </Link>

        <h1 className="text-3xl font-bold text-zinc-900 mb-1">업데이트 소식</h1>
        <p className="text-zinc-500 mb-8">길드패스는 계속 발전하고 있어요. 새 소식을 확인하세요.</p>

        {list.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-16">아직 업데이트 소식이 없습니다.</p>
        ) : (
          <div className="relative pl-6">
            {/* 타임라인 세로선 */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200" />
            <div className="space-y-8">
              {list.map((n) => {
                const meta = getPatchTagMeta(n.tag);
                return (
                  <div key={n.id} className="relative">
                    {/* 타임라인 점 */}
                    <div
                      className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: meta.text }}
                    />
                    <div className="rounded-xl border border-zinc-200 bg-white p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[11px] font-bold rounded px-2 py-0.5"
                          style={{ backgroundColor: meta.bg, color: meta.text }}
                        >
                          {meta.label}
                        </span>
                        {n.version && (
                          <span className="text-xs font-mono text-zinc-400">{n.version}</span>
                        )}
                        <span className="text-xs text-zinc-400 ml-auto">
                          {new Date(n.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-2">{n.title}</h2>
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
