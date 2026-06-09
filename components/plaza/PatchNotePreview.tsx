import { createClient } from "@/lib/supabase/server";
import { getPatchTagMeta } from "@/lib/patch-note-tags";
import Link from "next/link";
import { Megaphone, ChevronRight } from "lucide-react";

export default async function PatchNotePreview() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patch_notes")
    .select("id, version, title, tag, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = data?.[0];
  if (!latest) return null;

  const meta = getPatchTagMeta(latest.tag);

  return (
    <Link
      href="/patch-notes"
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 transition-colors"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: meta.bg }}>
        <Megaphone className="w-4 h-4" style={{ color: meta.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold" style={{ color: meta.text }}>{meta.label}</span>
          <span className="text-[11px] text-zinc-400">새 업데이트</span>
        </div>
        <p className="text-sm font-semibold text-zinc-800 truncate">{latest.title}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
    </Link>
  );
}
