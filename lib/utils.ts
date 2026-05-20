import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스명을 안전하게 합쳐주는 헬퍼.
 * shadcn/ui 컴포넌트의 표준 유틸이며, 이후 모든 컴포넌트가 사용함.
 *
 * 예시:
 *   cn("px-4 py-2", isActive && "bg-violet-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 길드 코드 포맷팅 (X4FQGR → X4F-QGR 같은 형식)
 */
export function formatGuildCode(code: string): string {
  if (!code) return "";
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
}

/**
 * 상대 시간 표시 (e.g., "3분 전", "2시간 전")
 */
export function getRelativeTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return target.toLocaleDateString("ko-KR");
}

/**
 * 큰 숫자 포맷팅 (1234 → "1,234", 12345 → "12.3K")
 */
export function formatNumber(num: number, compact = false): string {
  if (compact && num >= 1000) {
    return new Intl.NumberFormat("ko-KR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }
  return new Intl.NumberFormat("ko-KR").format(num);
}
