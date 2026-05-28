import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 로그인된 유저는 랜딩 안 보여줌 — 길드 있으면 길드 홈, 없으면 온보딩
  if (user) {
    const { data: membership } = await supabase
      .from("guild_members")
      .select("guilds(code)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const guildInfo = membership?.guilds as any;
    const code = Array.isArray(guildInfo)
      ? guildInfo[0]?.code
      : guildInfo?.code;

    if (code) {
      redirect(`/guild/${code}`);
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  );
}
