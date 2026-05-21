// app/posts/new/page.tsx 교체
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PostForm from "@/components/PostForm";

type Props = {
  searchParams: { guild?: string };
};

export default async function NewPostPage({ searchParams }: Props) {
  const supabase = await createClient(); // ← await 추가
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let guildId: string | undefined;
  let guildName: string | undefined;

  if (searchParams.guild) {
    const { data: guild } = await supabase
      .from("guilds")
      .select("id, name")
      .eq("code", searchParams.guild.toUpperCase())
      .maybeSingle();
    if (guild) {
      guildId = guild.id;
      guildName = guild.name;
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            ✏️ 새 글 작성
          </h1>
          <PostForm guildId={guildId} guildName={guildName} />
        </div>
      </main>
    </>
  );
}
