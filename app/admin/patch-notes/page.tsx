import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PatchNoteManager from "./PatchNoteManager";

export default async function AdminPatchNotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) redirect("/");

  const { data: notes } = await supabase
    .from("patch_notes")
    .select("id, version, title, body, tag, is_published, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">패치노트 관리</h1>
        <p className="text-sm text-zinc-500 mb-6">플랫폼 관리자 전용 · 작성한 글은 광장과 패치노트 페이지에 노출됩니다.</p>
        <PatchNoteManager notes={notes ?? []} />
      </div>
    </div>
  );
}
