"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Home, Bell, CalendarDays, Users, MessageCircle,
  Settings, LogOut, Shield, Trophy, Menu, X, ShoppingBag, Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

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
  guildCode, guildName, guildLogoUrl,
  userRole, userName, userAvatarUrl, memberCount,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isStaff = userRole === "master" || userRole === "submaster";
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    { icon: ShoppingBag, label: "상점", href: `${baseUrl}/shop` },
    { icon: Package, label: "길드 보관함", href: `${baseUrl}/inventory` },
  ];

  const isPlazaActive = pathname.startsWith("/plaza");

  const roleLabel =
    userRole === "master" ? "마스터" :
    userRole === "submaster" ? "부마스터" : "멤버";

  return (
    <>
      {/* ── 데스크탑 사이드바 ── */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="p-5 border-b border-border">
          <Link href={baseUrl} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-glow-violet group-hover:shadow-[0_0_24px_hsl(263_80%_65%_/_0.6)] transition-shadow">
              {guildLogoUrl ? (
                <img src={guildLogoUrl} alt={guildName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-white text-base truncate">{guildName}</div>
              <div className="font-mono text-[10px] text-violet-300 tracking-wider">{guildCode}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="mono-label px-3 pt-3 pb-2">MENU</p>
          {menu.map((item) => {
            const isActive = pathname === item.href || (item.href !== baseUrl && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-violet-500/15 text-white shadow-[inset_2px_0_0_hsl(263_80%_65%)]"
                  : "text-muted-foreground hover:text-white hover:bg-violet-500/5"
              )}>
                <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-violet-300" : "text-muted-foreground group-hover:text-violet-300")} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground">{item.badge}</span>
                )}
              </Link>
            );
          })}

          <p className="mono-label px-3 pt-6 pb-2">DISCOVER</p>
          <Link href="/plaza" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
            isPlazaActive
              ? "bg-cyan-500/15 text-white shadow-[inset_2px_0_0_hsl(189_94%_55%)]"
              : "text-muted-foreground hover:text-white hover:bg-cyan-500/5"
          )}>
            <Trophy className={cn("w-4 h-4 shrink-0 transition-colors", isPlazaActive ? "text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300")} />
            <span className="flex-1">광장</span>
            <span className="text-[10px] font-mono text-cyan-400/60 uppercase">랭킹</span>
          </Link>

          {isStaff && (
            <>
              <p className="mono-label px-3 pt-6 pb-2">ADMIN</p>
              <Link href={`${baseUrl}/admin`} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`${baseUrl}/admin`)
                  ? "bg-amber-500/15 text-white shadow-[inset_2px_0_0_hsl(45_90%_55%)]"
                  : "text-muted-foreground hover:text-white hover:bg-amber-500/5"
              )}>
                <Settings className="w-4 h-4 text-amber-400/80 shrink-0" />
                <span>관리자 패널</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Link href={`${baseUrl}/me`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-violet-500/5 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 overflow-hidden">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{userName[0]?.toUpperCase() ?? "?"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userName}</div>
              <Badge variant={userRole === "master" ? "master" : "default"} size="sm" className="mt-0.5">
                {roleLabel}
              </Badge>
            </div>
          </Link>
          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-rose-300 hover:bg-rose-500/5 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* ── 모바일 상단 헤더 ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-border">
        <Link href={baseUrl} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            {guildLogoUrl ? (
              <img src={guildLogoUrl} alt={guildName} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Shield className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">{guildName}</p>
            <p className="text-[10px] font-mono text-violet-300">{guildCode}</p>
          </div>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-violet-500/10 text-muted-foreground hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── 모바일 하단 탭 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-card/90 backdrop-blur-sm border-t border-border">
        {menu.map((item) => {
          const isActive = pathname === item.href || (item.href !== baseUrl && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative",
              isActive ? "text-violet-300" : "text-muted-foreground"
            )}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── 모바일 드로어 ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-72 h-full bg-card flex flex-col border-l border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="text-sm font-bold text-white">메뉴</p>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-violet-500/10 text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="mono-label px-3 pt-2 pb-2">DISCOVER</p>
              <Link href="/plaza" onClick={() => setDrawerOpen(false)} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isPlazaActive ? "bg-cyan-500/15 text-white" : "text-muted-foreground hover:text-white hover:bg-cyan-500/5"
              )}>
                <Trophy className={cn("w-4 h-4", isPlazaActive ? "text-cyan-300" : "text-muted-foreground")} />
                <span className="flex-1">광장</span>
                <span className="text-[10px] font-mono text-cyan-400/60">랭킹</span>
              </Link>

              {isStaff && (
                <>
                  <p className="mono-label px-3 pt-4 pb-2">ADMIN</p>
                  <Link href={`${baseUrl}/admin`} onClick={() => setDrawerOpen(false)} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    pathname.startsWith(`${baseUrl}/admin`) ? "bg-amber-500/15 text-white" : "text-muted-foreground hover:text-white hover:bg-amber-500/5"
                  )}>
                    <Settings className="w-4 h-4 text-amber-400/80" />
                    <span>관리자 패널</span>
                  </Link>
                </>
              )}
            </div>

            <div className="p-3 border-t border-border space-y-2">
              <Link href={`${baseUrl}/me`} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-violet-500/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{userName[0]?.toUpperCase() ?? "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{userName}</div>
                  <Badge variant={userRole === "master" ? "master" : "default"} size="sm" className="mt-0.5">
                    {roleLabel}
                  </Badge>
                </div>
              </Link>
              <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-rose-300 hover:bg-rose-500/5 transition-colors">
                <LogOut className="w-4 h-4 shrink-0" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
