export type BoardCategory = "notice" | "free" | "flex" | "custom" | "tip";

export type CategoryMeta = {
  key: BoardCategory;
  label: string;
  staffOnly: boolean;
  badgeClass: string;
  activeClass: string;
};

export const BOARD_CATEGORIES: CategoryMeta[] = [
  { key: "notice", label: "공지", staffOnly: true, badgeClass: "bg-amber-100 text-amber-700", activeClass: "bg-amber-500 text-white" },
  { key: "free", label: "자유", staffOnly: false, badgeClass: "bg-slate-100 text-slate-600", activeClass: "bg-slate-700 text-white" },
  { key: "flex", label: "비틱", staffOnly: false, badgeClass: "bg-rose-100 text-rose-600", activeClass: "bg-rose-500 text-white" },
  { key: "custom", label: "커스터마이징", staffOnly: false, badgeClass: "bg-violet-100 text-violet-600", activeClass: "bg-violet-600 text-white" },
  { key: "tip", label: "팁", staffOnly: false, badgeClass: "bg-cyan-100 text-cyan-700", activeClass: "bg-cyan-500 text-white" },
];

export const ALLOWED_CATEGORIES = ["notice", "free", "flex", "custom", "tip"];

// 갤러리(썸네일 그리드)로 보여줄 분류
export const GALLERY_CATEGORIES = ["flex", "custom"];

export function isGalleryCategory(key: string | null | undefined) {
  return GALLERY_CATEGORIES.includes(key ?? "");
}

export function getCategoryMeta(key: string | null | undefined): CategoryMeta {
  const found = BOARD_CATEGORIES.find((c) => c.key === key);
  return found ?? BOARD_CATEGORIES[1]; // 기본: 자유
}
