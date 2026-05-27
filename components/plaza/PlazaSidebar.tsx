"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, MessageSquare, ShoppingBag, Users, User } from "lucide-react";

type Props = {
  shopHref: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
  matchKey?: string;
};

export default function PlazaSidebar({ shopHref }: Props) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { label: "광장 홈", href: "/plaza", icon: Home, exact: true },
    { label: "전체 랭킹", href: "/plaza/ranking", icon: Trophy, exact: false },
    { label: "게시판", href: "/plaza/board", icon: MessageSquare, exact: false },
    { label: "상점", href: shopHref, icon: ShoppingBag, exact: false, matchKey: "/shop" },
    { label: "모집 길드", href: "/plaza/recruiting", icon: Users, exact: false },
    { label: "마이룸", href: "/mypage", icon: User, exact: false },
  ];

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    if (item.matchKey) return pathname.includes(item.matchKey);
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-full md:w-56 md:shrink-0 bg-slate-800 md:sticky md:top-0 md:self-start md:h-screen">
      <div className="hidden md:block px-5 py-5 border-b border-slate-700">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] mb-1">
          GUILD PLAZA
        </p>
        <p className="text-lg font-bold text-white">광장</p>
      </div>
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 py-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors " +
                (active
                  ? "bg-sky-500 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white")
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
