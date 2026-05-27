// 로스트아크 직업별 역할(딜러/서포터) + 대표 시너지
// 시너지는 직업당 1개 (사용자 제공 표의 맨 윗줄 기준, 워로드는 전투 태세 빌드 기준)

export type ClassRole = "dealer" | "support";

// 서포터 4종 — 발키리, 홀리나이트, 도화가, 바드
const SUPPORT_CLASSES = ["발키리", "홀리나이트", "도화가", "바드"];

// 직업명 → 대표 시너지 (풀네임 표기)
const CLASS_SYNERGY: { [key: string]: string } = {
  디스트로이어: "방어력 감소",
  버서커: "피해 증가",
  워로드: "방어력 감소",
  홀리나이트: "치명타 공격 적중 시 받는 피해 증가",
  슬레이어: "피해 증가",
  발키리: "치명타 공격 적중 시 받는 피해 증가",
  기공사: "공격력 증가",
  배틀마스터: "치명타 적중률 증가",
  인파이터: "피해 증가",
  창술사: "치명타 공격 적중 시 받는 피해 증가",
  브레이커: "피해 증가",
  스트라이커: "치명타 적중률 증가",
  데빌헌터: "치명타 적중률 증가",
  블래스터: "방어력 감소",
  스카우터: "공격력 증가",
  호크아이: "피해 증가",
  건슬링어: "치명타 적중률 증가",
  바드: "방어력 감소",
  서머너: "방어력 감소",
  소서리스: "피해 증가",
  아르카나: "치명타 적중률 증가",
  데모닉: "피해 증가",
  리퍼: "방어력 감소",
  블레이드: "백·헤드어택 피해 증가",
  소울이터: "피해 증가",
  기상술사: "치명타 적중률 증가",
  도화가: "방어력 감소",
  환수사: "방어력 감소",
  가디언나이트: "피해 증가",
};

// character_class 값을 표준 직업명으로 정규화 (괄호 빌드명·공백 제거 등)
function normalizeClass(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.trim();
  const paren = s.indexOf("(");
  if (paren !== -1) s = s.slice(0, paren).trim();
  return s;
}

export function getClassRole(characterClass: string | null | undefined): ClassRole {
  const c = normalizeClass(characterClass);
  return SUPPORT_CLASSES.indexOf(c) !== -1 ? "support" : "dealer";
}

export function getClassSynergy(characterClass: string | null | undefined): string {
  const c = normalizeClass(characterClass);
  return CLASS_SYNERGY[c] ?? "";
}
