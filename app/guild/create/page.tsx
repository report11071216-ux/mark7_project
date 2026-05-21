import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuildCreateForm from "@/components/GuildCreateForm";

export default async function GuildCreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          🏰 새 길드 만들기
        </h1>
        <p className="mb-8 text-gray-600">
          나만의 길드를 만들고 친구들을 초대하세요
        </p>

        <GuildCreateForm userId={user.id} />
      </div>
    </main>
  );
}
