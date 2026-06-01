"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Badge } from "@/components/ui/badge";
import {
  Home, ClipboardList, CalendarDays, Users, MessageCircle,
  Settings, LogOut, Shield, Trophy, Menu, X, ShoppingBag, Package, Sprout,
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
  primaryColor?: string;
  backgroundColor?: string;
}

// 테마색을 깊게 어둡게 — 색조는 살리되 거의 검정에 가까운 톤
function darkTint(hex: string, keep: number) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return "rgb(13,13,18)";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgb(${Math.round(r * keep)},${Math.round(g * keep)},${Math.round(b * keep)})`;
}

function hexToRgba(hex: string, a: number) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return `rgba(124,58,237,${a})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function Sidebar({
  guildCode, guildName, guildLogoUrl,
  userRole, userName, userAvatarUrl, memberCount,
  primaryColor,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isStaff = userRole === "master" || userRole === "submaster";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accent = primaryColor ?? "#7c3aed";
  const sidebarBg = darkTint(accent, 0.13);
  const borderCol = darkTint(accent, 0.32);
  const textMain = "#ffffff";
  const textMuted = "#9ca3af";
  const accentActive = hexToRgba(accent, 0.22);

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
    { icon: ClipboardList, label: "게시판", href: `${baseUrl}/posts` },
    { icon: CalendarDays, label: "레이드", href: `${baseUrl}/raids` },
    { icon: Users, label: "멤버", href: `${baseUrl}/members`, badge: memberCount },
    { icon: Sprout, label: "성장", href: `${baseUrl}/growth` },
    { icon: MessageCircle, label: "채팅", href: `${baseUrl}/chat` },
    { icon: ShoppingBag, label: "상점", href: `${baseUrl}/shop` },
    { icon: Package, label: "길드 보관함", href: `${baseUrl}/inventory` },
  ];

  const isPlazaActive = pathname.startsWith("/plaza");

  const roleLabel =
    userRole === "master" ? "마스터" :
    userRole === "submaster" ? "부마스터" : "멤버";

  const linkBase =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative hover:bg-white/[0.06]";

  function menuLinkStyle(active: boolean) {
    if (active) {
      return { backgroundColor: accentActive, color: textMain, boxShadow: `inset 2px 0 0 ${accent}` };
    }
    return { color: textMuted };
  }

  function renderMenuItems(onClick?: () => void) {
    return menu.map((item) => {
      const isActive = pathname === item.href || (item.href !== baseUrl && pathname.startsWith(item.href));
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={linkBase}
          style={menuLinkStyle(isActive)}
        >
          <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? accent : textMuted }} />
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="text-[10px] font-mono" style={{ color: textMuted }}>{item.badge}</span>
          )}
        </Link>
      );
    });
  }

  function userBlock(onClick?: () => void) {
    return (
      <>
        <Link
          href="/mypage"
          onClick={onClick}
          className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: accent }}
          >
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{userName[0]?.toUpperCase() ?? "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: textMain }}>{userName}</div>
            <Badge variant={userRole === "master" ? "master" : "default"} size="sm" className="mt-0.5">
              {roleLabel}
            </Badge>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-rose-300 hover:bg-rose-500/10"
          style={{ color: textMuted }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>로그아웃</span>
        </button>
      </>
    );
  }

  return (
    <>
      {/* ── 데스크탑 사이드바 ── */}
      <aside
        className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col border-r"
        style={{ backgroundColor: sidebarBg, borderColor: borderCol }}
      >
        <div className="p-5 border-b" style={{ borderColor: borderCol }}>
          <Link href={baseUrl} className="flex items-center gap-3 group">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent }}
            >
              {guildLogoUrl ? (
                <img src={guildLogoUrl} alt={guildName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base truncate" style={{ color: textMain }}>{guildName}</div>
              <div className="font-mono text-[10px] tracking-wider" style={{ color: accent }}>{guildCode}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-3 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>MENU</p>
          {renderMenuItems()}

          <p className="px-3 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>DISCOVER</p>
          <Link href="/plaza" className={linkBase} style={menuLinkStyle(isPlazaActive)}>
            <Trophy className="w-4 h-4 shrink-0" style={{ color: isPlazaActive ? accent : textMuted }} />
            <span className="flex-1">광장</span>
            <span className="text-[10px] font-mono uppercase" style={{ color: textMuted }}>랭킹</span>
          </Link>

          {isStaff && (
            <>
              <p className="px-3 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>ADMIN</p>
              <Link
                href={`${baseUrl}/admin`}
                className={linkBase}
                style={menuLinkStyle(pathname.startsWith(`${baseUrl}/admin`))}
              >
                <Settings className="w-4 h-4 shrink-0" style={{ color: pathname.startsWith(`${baseUrl}/admin`) ? accent : textMuted }} />
                <span>관리자 패널</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t space-y-2" style={{ borderColor: borderCol }}>
          {userBlock()}
        </div>
      </aside>

      {/* ── 모바일 상단 헤더 ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: sidebarBg, borderColor: borderCol }}
      >
        <Link href={baseUrl} className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: accent }}
          >
            {guildLogoUrl ? (
              <img src={guildLogoUrl} alt={guildName} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Shield className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: textMain }}>{guildName}</p>
            <p className="text-[10px] font-mono" style={{ color: accent }}>{guildCode}</p>
          </div>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          style={{ color: textMuted }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── 모바일 하단 탭 (주요 5개만) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t"
        style={{ backgroundColor: sidebarBg, borderColor: borderCol }}
      >
        {menu.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || (item.href !== baseUrl && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative"
              style={{ color: isActive ? accent : textMuted }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: accent }}
                >
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
          <div
            className="relative ml-auto w-72 h-full flex flex-col border-l"
            style={{ backgroundColor: sidebarBg, borderColor: borderCol }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: borderCol }}>
              <p className="text-sm font-bold" style={{ color: textMain }}>메뉴</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                style={{ color: textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 pt-2 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>MENU</p>
              {renderMenuItems(() => setDrawerOpen(false))}

              <p className="px-3 pt-4 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>DISCOVER</p>
              <Link
                href="/plaza"
                onClick={() => setDrawerOpen(false)}
                className={linkBase}
                style={menuLinkStyle(isPlazaActive)}
              >
                <Trophy className="w-4 h-4" style={{ color: isPlazaActive ? accent : textMuted }} />
                <span className="flex-1">광장</span>
                <span className="text-[10px] font-mono" style={{ color: textMuted }}>랭킹</span>
              </Link>

              {isStaff && (
                <>
                  <p className="px-3 pt-4 pb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: textMuted }}>ADMIN</p>
                  <Link
                    href={`${baseUrl}/admin`}
                    onClick={() => setDrawerOpen(false)}
                    className={linkBase}
                    style={menuLinkStyle(pathname.startsWith(`${baseUrl}/admin`))}
                  >
                    <Settings className="w-4 h-4" style={{ color: pathname.startsWith(`${baseUrl}/admin`) ? accent : textMuted }} />
                    <span>관리자 패널</span>
                  </Link>
                </>
              )}
            </div>

            <div className="p-3 border-t space-y-2" style={{ borderColor: borderCol }}>
              {userBlock(() => setDrawerOpen(false))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
