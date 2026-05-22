import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/ranking";
import { Trophy, ShoppingBag, Sparkles, Gamepad2 } from "lucide-react";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import RecruitingGuilds, { type RecruitingGuild } from "@/components/plaza/RecruitingGuilds";
import MyProfileCard from "@/components/plaza/MyProfileCard";
import MyGuildsList, { type MyGuildItem } from "@/components/plaza/MyGuildsList";
import SideRanking, { type RankedSide } from "@/components/plaza/SideRanking";
import GameContentWidgets from "@/components/plaza/GameContentWidgets";

export const revalidate = 60;

export default async function PlazaPage() {
  const supabase = await createClient();
  const weekStart = getWeekStart();

  const [
    userResult,
    recruitingResult,
    weeklyRankingResult,
    rawPostsResult,
    totalCountResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("guilds")
      .select("id, code, name, logo_url, member_count, max_members, description")
      .eq("is_recruiting", true)
      .lt("member_count", 50)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("weekly_guild_ranking")
      .select("id, code, name, logo_url, weekly_points")
      .order("weekly_points", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id, title, category, is_notice, view_count, created_at, guild_id, author_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("guilds").select("*", { count: "exact", head: true }),
  ]);

  const user = userResult.data.user;
  const recruitingRaw = recruitingResult.data;
  const weeklyRaw = weeklyRankingResult.data;
  const rawPosts = rawPostsResult.data;
  const totalGuildCount = totalCountResult.count;

  const recruitingGuilds: RecruitingGuild[] = (recruitingRaw ?? []).map((g) => ({
    id: g.id,
    code: g.cod
