import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RaidGrid, { type RaidEntry } from "@/components/guild/RaidGrid";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function RaidsPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code").eq("code", code).single(),
  ]);
  if (!user || !guild) notFound();

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const isStaff = membership.role === "master" || membership.role === "submaster";

  const { data: rawRaids } = await supabase
    .from("raids")
    .select("id, title, image_url, gold_normal, gold_hard, gold_nightmare, created_at")
    .eq("guild_id", guild.id)
    .order("created_at", { ascending: false });

  const raids: RaidEntry[] = (rawRaids ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    image_url: r.image_url,
    gold_normal: r.gold_normal ?? 0,
    gold_hard: r.gold_hard ?? 0,
    gold_nightmare: r.gold_nightmare ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div className="mb-6 flex gap-2">
        <Link
          href={"/guild/" + guild.code + "/raids"}
          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300"
        >
          레이드 도감
        </Link>
        <Link
          href={"/guild/" + guild.code + "/raids/calendar"}
          className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
        >
          캘린더
        </Link>
      </div>

      <RaidGrid
        guildCode={guild.code}
        guildName={guild.name}
        raids={raids}
        isStaff={isStaff}
      />
    </div>
  );
}
