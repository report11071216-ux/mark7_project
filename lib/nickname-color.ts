import { createClient } from "@/lib/supabase/server";

// 여러 user_id → 각자 장착한 출석 카드 등급의 닉네임 색
// 반환: { [userId]: colorHex }  (커먼/미장착은 키 없음 = 기본색)
export async function getNicknameColors(
  userIds: string[]
): Promise<{ [userId: string]: string }> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return {};

  const supabase = await createClient();

  // 1) 각 유저의 장착 카드 id
  const { data: states } = await supabase
    .from("user_card_state")
    .select("user_id, equipped_card_id")
    .in("user_id", ids);

  const equippedRows = (states ?? []).filter((s) => s.equipped_card_id);
  if (equippedRows.length === 0) return {};

  // 2) 장착 카드들의 등급
  const cardIds = Array.from(new Set(equippedRows.map((s) => s.equipped_card_id))) as string[];
  const { data: cards } = await supabase
    .from("attendance_cards")
    .select("id, grade")
    .in("id", cardIds);
  const cardGradeMap: { [cardId: string]: string } = {};
  for (const c of cards ?? []) cardGradeMap[c.id] = c.grade;

  // 3) 등급별 닉네임 색
  const { data: grades } = await supabase
    .from("attendance_card_grades")
    .select("grade, nickname_color");
  const gradeColorMap: { [grade: string]: string | null } = {};
  for (const g of grades ?? []) gradeColorMap[g.grade] = g.nickname_color;

  // 4) user_id → color (색 있는 것만)
  const result: { [userId: string]: string } = {};
  for (const s of equippedRows) {
    const grade = cardGradeMap[s.equipped_card_id as string];
    const color = grade ? gradeColorMap[grade] : null;
    if (color) result[s.user_id] = color;  // 커먼(null)은 제외 = 기본색
  }
  return result;
}
