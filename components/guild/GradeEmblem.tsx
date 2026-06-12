const GRADE_KEYS = ["브론즈", "실버", "골드", "플래티넘", "에메랄드", "다이아몬드", "마스터", "그랜드마스터"];

function gradeIndexFromLabel(label?: string): number {
  if (!label) return 0;
  const i = GRADE_KEYS.indexOf(label);
  return i >= 0 ? i : 0;
}

export default function GradeEmblem({
  tierLabel,
  size = 64,
}: {
  tierLabel?: string;
  size?: number;
}) {
  const idx = gradeIndexFromLabel(tierLabel);

  // 등급별 색 (윗면 밝은색, 좌면, 우면, 외곽선, 액센트)
  const C = [
    { top1: "#f0c89a", top2: "#c8895a", left: "#9a6a3e", right: "#7a4e2a", edge: "#5e3c1f", line: "#e0a878" }, // 브론즈
    { top1: "#f4f6fa", top2: "#c2c8d2", left: "#aeb6c2", right: "#878f9d", edge: "#6b7280", line: "#ffffff" }, // 실버
    { top1: "#fff0c0", top2: "#f0c040", left: "#e8ad3c", right: "#bd831f", edge: "#a6741c", line: "#fff3d0" }, // 골드
    { top1: "#d0fffb", top2: "#7fd0d0", left: "#74c0c0", right: "#4f9ca0", edge: "#3d8088", line: "#e0fffb" }, // 플래티넘
    { top1: "#c0ffd8", top2: "#3fc888", left: "#33b87a", right: "#188a5a", edge: "#147a4e", line: "#d0ffe6" }, // 에메랄드
    { top1: "#d0ecff", top2: "#5fa8f8", left: "#5a96f5", right: "#2f6fd8", edge: "#2563c4", line: "#e0f0ff" }, // 다이아몬드
    { top1: "#e8d0ff", top2: "#a96ee8", left: "#9b54e0", right: "#7430bc", edge: "#6a2ba8", line: "#f3e0ff" }, // 마스터
    { top1: "#ffd0e4", top2: "#d4607a", left: "#e07090", right: "#bd4868", edge: "#a8324f", line: "#fff0f6" }, // 그랜드마스터
  ][idx];

  const showSparkle = idx >= 4; // 에메랄드+
  const showRay = idx >= 6;     // 마스터+
  const rayColor = idx === 7 ? "#ffb0d0" : "#c79af5";

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ display: "block" }}>
      {showRay && (
        <circle cx="40" cy="40" r={idx === 7 ? 40 : 36} fill={rayColor} fillOpacity={idx === 7 ? 0.28 : 0.22} />
      )}

      {/* 외곽 육각 */}
      <polygon points="40,13 63,26 63,54 40,67 17,54 17,26" fill={C.edge} />
      <polygon points="40,15 61,27 61,53 40,65 19,53 19,27" fill={C.top2} />
      {/* 윗면 */}
      <polygon points="40,17 59,28 40,40 21,28" fill={C.top1} />
      {/* 좌면 */}
      <polygon points="21,28 40,40 40,63 21,51" fill={C.left} />
      {/* 우면 */}
      <polygon points="59,28 40,40 40,63 59,51" fill={C.right} />
      {/* 라인 하이라이트 */}
      <polygon points="40,13 63,26 63,54 40,67 17,54 17,26" fill="none" stroke={C.line} strokeWidth="1.2" strokeOpacity="0.55" />

      {/* 반짝이 */}
      {showSparkle && (
        <g fill="#ffffff">
          <path d="M13 17 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2-3 -3-1.2 3-1.2z" opacity="0.85" />
          {idx >= 6 && <path d="M67 50 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1-2.4 -2.4-1 2.4-1z" opacity="0.7" />}
          {idx === 7 && <path d="M66 18 l.9 2.2 2.2 .9 -2.2 .9 -.9 2.2 -.9-2.2 -2.2-.9 2.2-.9z" opacity="0.8" />}
        </g>
      )}
    </svg>
  );
}
