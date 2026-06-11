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
      <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-plaza-accent-soft ring-1 ring-plaza-line flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-plaza-accent" />
        </div>
        <p className="text-xs text-plaza-ink-soft mb-3 leading-relaxed">
          로그인하면 내 정보가<br />여기에 표시돼요
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-plaza-accent hover:opacity-90 text-plaza-canvas text-xs font-bold transition-opacity"
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
    <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line overflow-hidden">
      {hasBg ? (
        /* 배경 카드 장착 — 가로 배너 풀 표시 */
        <div className="relative w-full aspect-[16/6] overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900" />
          <img
            src={cardFrameUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* 좌측 그라데이션 — 이름 가독성 */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />

          <div className="absolute inset-0 flex items-center gap-3 px-4">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={profile?.username ?? "User"}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white/50 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center ring-2 ring-white/50 shrink-0">
                <span className="text-base font-bold text-white">
                  {(profile?.username ?? "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5 text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                My Profile
              </p>
              <p className="text-base font-bold truncate text-white drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">
                {profile?.username ?? "이름없음"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* 배경 없음 — 기본 */
        <div className="relative flex items-center gap-3 p-4">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={profile?.username ?? "User"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-plaza-line"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center ring-2 ring-plaza-line">
              <span className="text-sm font-bold text-white">
                {(profile?.username ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5 text-plaza-accent">
              My Profile
            </p>
            <p className="text-sm font-bold truncate text-plaza-ink">
              {profile?.username ?? "이름없음"}
            </p>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="p-4 pt-3 flex flex-col gap-1.5">
        <Link
          href="/mypage"
          className="block w-full px-3 py-2 rounded-lg bg-plaza-accent-soft hover:bg-plaza-line text-plaza-ink text-[11px] font-bold text-center transition-colors ring-1 ring-plaza-line"
        >
          마이페이지
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-plaza-surface-2 hover:bg-plaza-line text-plaza-ink-soft text-[11px] font-bold text-center transition-colors ring-1 ring-plaza-line"
          >
            <ShieldCheck className="w-3 h-3 text-plaza-accent" />
            관리자 콘솔
          </Link>
        )}
      </div>
    </div>
  );
}
