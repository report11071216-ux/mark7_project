import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">
                Platform Admin
              </p>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                관리자 콘솔
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {profile.username ?? "관리자"}
            </span>
            <Link
              href="/plaza"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition"
            >
              ← 광장으로
            </Link>
          </div>
        </header>

        <AdminNav />

        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
