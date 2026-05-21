"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Bell,
  CalendarDays,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Shield,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

interface SidebarProps {
  guildCode: string;
  guildName: string;
  guildLogoUrl: string | null;
  userRole: string;
  userName: string;
  userAvatarUrl: string | null;
  memberCount: number;
}

export function Sidebar({
  guildCode,
  guildName,
  guildLogoUrl,
  userRole,
  userName,
  userAvatarUrl,
  memberCount,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isStaff = userRole === "master" || userRole === "submaster";

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    toast.success("로그아웃되었어요");
    router.push("/");
    router.refresh();
  };

  const baseUrl = `/guild/${guildCode}`;
  const menu = [
    { icon: Home, label: "홈", href: baseUrl },
    { icon: Bell, label: "공지", href: `${baseUrl}/posts` },
    { icon: CalendarDays, label: "레이드", href: `${baseUrl}/raids` },
    { icon: Users, label: "멤버", href: `${baseUrl}/members`, badge: memberCount },
    { icon: MessageCircle, label: "채팅", href: `${baseUrl}/chat` },
  ];

  const isPlazaActive = pathname.startsWith("/plaza");

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border bg-card/30 backdrop-blur-sm">
      {/* 길드 헤더 */}
      <div className="p-5 border-b border-border">
        <Link href={baseUrl} className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-glow-violet group-hover:shadow-[0_0_24px_hsl(263_80%_65%_/_0.6)] transition-shadow">
            {guildLogoUrl ? (
              <img
                src={guildLogoUrl}
                alt={guildName}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Shield className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-white text-base truncate">
              {guildName}
            </div>
            <div className="font-mono text-[10px] text-violet-300 tracking-wider">
              {guildCode}
            </div>
          </div>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="mono-label px-3 pt-3 pb-2">MENU</p>
        {menu.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== baseUrl && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-violet-500/15 text-white shadow-[inset_2px_0_0_hsl(263_80%_65%)]"
                  : "text-muted-foreground hover:text-white hover:bg-violet-500/5"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-violet-300" : "text-muted-foreground group-hover:text-violet-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* 광장 섹션 (전역) */}
        <p className="mono-label px-3 pt-6 pb-2">DISCOVER</p>
        <Link
          href="/plaza"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
            isPlazaActive
              ? "bg-cyan-500/15 text-white shadow-[inset_2px_0_0_hsl(189_94%_55%)]"
              : "text-muted-foreground hover:text-white hover:bg-cyan-500/5"
          )}
        >
          <Trophy
            className={cn(
              "w-4 h-4 shrink-0 transition-colors",
              isPlazaActive ? "text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300"
            )}
          />
          <span className="flex-1">광장</span>
          <span className="text-[10px] font-mono text-cyan-400/60 uppercase">
            랭킹
          </span>
        </Link>

        {isStaff && (
          <>
            <p className="mono-label px-3 pt-6 pb-2">ADMIN</p>
            <Link
              href={`${baseUrl}/admin`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`${baseUrl}/admin`)
                  ? "bg-amber-500/15 text-white shadow-[inset_2px_0_0_hsl(45_90%_55%)]"
                  : "text-muted-foreground hover:text-white hover:bg-amber-500/5"
              )}
            >
              <Settings className="w-4 h-4 text-amber-400/80 shrink-0" />
              <span>관리자 패널</span>
            </Link>
          </>
        )}
      </nav>

      {/* 프로필 영역 */}
      <div className="p-3 border-t border-border space-y-2">
        <Link
          href={`${baseUrl}/me`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-violet-500/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 overflow-hidden">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {userName[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {userName}
            </div>
            <Badge
              variant={userRole === "master" ? "master" : "default"}
              size="sm"
              className="mt-0.5"
            >
              {userRole === "master"
                ? "마스터"
                : userRole === "submaster"
                  ? "부마스터"
                  : "멤버"}
            </Badge>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-rose-300 hover:bg-rose-500/5 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
