import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PenSquare } from "lucide-react";
import { createPost } from "../actions";

export default async function NewBoardPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <Link href="/plaza" className="text-slate-400 hover:text-blue-600 transition">광장</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/plaza/board" className="text-slate-400 hover:text-blue-600 transition">게시판</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 font-bold">새 글 작성</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="plaza-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PenSquare className="w-4 h-4 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900">새 글 작성</h1>
          </div>

          <form action={createPost} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                카테고리
              </label>
              <div className="flex gap-4">
                {["자유", "길드모집", "질문"].map((cat) => (
                  <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      defaultChecked={cat === "자유"}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                제목
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="제목을 입력하세요"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                내용
              </label>
              <textarea
                name="content"
                required
                rows={12}
                placeholder="내용을 입력하세요..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href="/plaza/board"
                className="text-xs font-mono text-slate-400 hover:text-blue-600 transition"
              >
                ← 취소
              </Link>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
              >
                작성 완료
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
