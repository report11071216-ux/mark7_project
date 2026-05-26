import Link from "next/link";
import { User, LogIn, ShieldCheck } from "lucide-react";

type Profile = {
  username: string | null;
  avatar_url: string | null;
};

export default function MyProfileCard({
  isLoggedIn,
  profile,
  isAdmin = false,
  markUrl = null,
  cardFrameUrl = null,
}: {
  isLoggedIn: boolean;
  profile: Profile | null;
  isAdmin?: boolean;
  markUrl?: string | null;
  cardFrameUrl?: string | null;
}) {
  if (!isLoggedIn) {
    return (
      <div className="plaza-card p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 ring-1 ring-blue-200 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          로그인하면 내 정보가<br />여기에 표시돼요
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          로그인
        </Link>
      </div>
    );
  }

  const displayAvatar = markUrl ?? profile?.avatar_url ?? null;
  const hasBg = !!cardFrameUrl;

  return (
    <div className="plaza-card overflow-hidden">
      {/* 상단 — 배경 이미지 있으면 그 위에, 없으면 기본 */}
      <div className="relative">
        {hasBg && (
          <>
            {/* 여백 채울 어두운 바탕 */}
            <div className="absolute inset-0 bg-zinc-900" />
            {/* 이미지 전체가 보이게 (안 잘림) */}
            <img
              src={cardFrameUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* 연한 어두운 막 */}
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

        <div className="relative flex items-center gap-3 p-4">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={profile?.username ?? "User"}
              className={`w-12 h-12 rounded-full object-cover ring-2 ${
                hasBg ? "ring-white/30" : "ring-blue-100"
              }`}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center ring-2 ring-blue-100">
              <span className="text-sm font-bold text-white">
                {(profile?.username ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-[10px] font-mono uppercase tracking-wider mb-0.5 ${
              hasBg ? "text-white/80" : "text-blue-600"
            }`}>
              My Profile
            </p>
            <p className={`text-sm font-bold truncate ${
              hasBg ? "text-white drop-shadow-[0_1px_5px_rgba(0,0,0,1)]" : "text-slate-900"
            }`}>
              {profile?.username ?? "이름없음"}
            </p>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="p-4 pt-0 flex flex-col gap-1.5">
        <Link
          href="/mypage"
          className="block w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold text-center transition-colors"
        >
          마이페이지
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold text-center transition-colors ring-1 ring-amber-200"
          >
            <ShieldCheck className="w-3 h-3" />
            관리자 콘솔
          </Link>
        )}
      </div>
    </div>
  );
}
