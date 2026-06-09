export type PatchTag = "feature" | "update" | "fix" | "notice";

export const PATCH_TAG_META: { [key: string]: { label: string; bg: string; text: string } } = {
  feature: { label: "신기능", bg: "#ede9fe", text: "#7c3aed" },
  update: { label: "업데이트", bg: "#dbeafe", text: "#2563eb" },
  fix: { label: "버그수정", bg: "#dcfce7", text: "#16a34a" },
  notice: { label: "공지", bg: "#fef3c7", text: "#d97706" },
};

export function getPatchTagMeta(tag: string) {
  return PATCH_TAG_META[tag] ?? { label: tag, bg: "#f4f4f5", text: "#52525b" };
}
