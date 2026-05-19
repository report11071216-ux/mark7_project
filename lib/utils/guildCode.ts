/**
 * 6자리 길드 입장 코드 생성
 * 헷갈리는 문자 (0, O, 1, I, L) 제외
 */
export function generateGuildCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
