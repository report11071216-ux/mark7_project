import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardEyebrow,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuroraBackground } from "@/components/landing/AuroraBackground";
import { Plus, Hash, Shield } from "lucide-react";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 이미 가입한 길드 확인
  const { data: memberships } = await supabase
    .from("guild_members")
    .select("guilds(code)")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0 && memberships[0].guilds) {
    const guildCode = (memberships[0].guilds as any).code;
    redirect(`/guild/${guildCode}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <AuroraBackground variant="subtle" />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 text-violet-400 mx-auto mb-4" />
          <p className="mono-label mb-3">WELCOME · GET STARTED</p>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            어디로 가시겠어요?
          </h1>
          <p className="text-muted-foreground text-lg">
            새로 길드를 만들거나, 친구의 길드에 참여할 수 있어요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/onboarding/create" className="block">
            <Card variant="gradient" hover className="p-8 h-full">
              <Plus className="w-10 h-10 text-violet-400 mb-6" />
              <CardEyebrow className="text-cyan-300">FOR LEADERS</CardEyebrow>
              <CardTitle className="mt-2 mb-3 text-2xl">
                새 길드 만들기
              </CardTitle>
              <CardDescription className="leading-relaxed">
                나만의 길드를 처음부터 만드세요. 길드 코드가 자동 생성되고,
                멤버를 초대할 수 있어요.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/onboarding/join" className="block">
            <Card variant="outlined" hover className="p-8 h-full">
              <Hash className="w-10 h-10 text-cyan-400 mb-6" />
              <CardEyebrow>FOR MEMBERS</CardEyebrow>
              <CardTitle className="mt-2 mb-3 text-2xl">
                길드 코드로 참여
              </CardTitle>
              <CardDescription className="leading-relaxed">
                마스터에게 받은 6자리 길드 코드를 입력하면 바로 참여할 수 있어요.
              </CardDescription>
            </Card>
          </Link>
        </div>

        <p className="text-center mt-12 text-xs text-muted-foreground font-mono tracking-wider">
          · 베타 기간 무료 · 카드 등록 불필요 · 언제든 길드 추가 가능
        </p>
      </div>
    </main>
  );
}
