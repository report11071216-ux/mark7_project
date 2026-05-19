import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuildJoinForm from "@/components/GuildJoinForm";
import Navbar from "@/components/Navbar";

export default async function GuildJoinPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            🎟️ 길드 입장
          </h1>
          <p className="mb-8 text-gray-600">
            길드 마스터에게 받은 입장 코드를 입력하세요
          </p>

          <GuildJoinForm userId={user.id} />
        </div>
      </main>
    </>
  );
}
