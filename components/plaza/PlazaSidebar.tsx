"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, MessageSquare, ShoppingBag, Users, User, BookOpen, Megaphone, Settings } from "lucide-react";
type Props = {
  shopHref: string;
  hasNewPatch?: boolean;
  isAdmin?: boolean;
};
type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
  matchKey?: string;
  showDot?: boolean;
};
export default function PlazaSidebar({ shopHref, hasNewPatch = false, isAdmin = false }: Props) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { label: "광장 홈", href: "/plaza", icon: Home, exact: true },
    { label: "전체 랭킹", href: "/plaza/ranking", icon: Trophy, exact: false },
    { label: "게시판", href: "/plaza/board", icon: MessageSquare, exact: false },
    { label: "상점", href: shopHref, icon: ShoppingBag, exact: false, matchKey: "/shop" },
    { label: "모집 길드", href: "/plaza/recruiting", icon: Users, exact: false },
    { label: "업데이트", href: "/patch-notes", icon: Megaphone, exact: false, showDot: hasNewPatch },
    { label: "도움말", href: "/guide", icon: BookOpen, exact: false },
    { label: "마이룸", href: "/mypage", icon: User, exact: false },
  ];
  if (isAdmin) {
    items.push({ label: "패치노트 관리", href: "/admin/patch-notes", icon: Settings, exact: false });
  }
  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    if (item.matchKey) return pathname.includes(item.matchKey);
    return pathname.startsWith(item.href);
  }
  return (
    <nav className="flex gap-1 px-2 overflow-x-auto border-t border-slate-100">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={
              "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors " +
              (active
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-800")
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {item.showDot && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
