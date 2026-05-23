"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  SlidersHorizontal,
  Megaphone,
  ShoppingBag,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/guardian", label: "가디언 토벌", icon: Swords },
  { href: "/admin/shop", label: "상품 관리", icon: ShoppingBag },
  { href: "/admin/settings", label: "플랫폼 설정", icon: SlidersHorizontal },
  { href: "/admin/announcement", label: "공지 배너", icon: Megaphone },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-white ring-1 ring-slate-200">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition " +
              (isActive
                ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                : "text-slate-600 hover:bg-slate-100")
            }
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
