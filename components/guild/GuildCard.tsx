import styles from "./GuildCard.module.css";

type GuildCardProps = {
  guildName: string;
  server: string;
  masterName?: string;
  memberCount?: number;
  points?: number;
  grade?: string;
  markUrl?: string | null;
  imageUrl?: string | null;
  className?: string;
};

const VALID_GRADES = ["free", "rare", "unique", "epic", "legend"];

const GRADE_LABEL: { [key: string]: string } = {
  free: "FREE",
  rare: "RARE",
  unique: "UNIQUE",
  epic: "EPIC",
  legend: "LEGEND",
};

function formatNum(n?: number) {
  if (typeof n !== "number") return "0";
  return n.toLocaleString("ko-KR");
}

export default function GuildCard(props: GuildCardProps) {
  const {
    guildName,
    server,
    masterName,
    memberCount,
    points,
    grade,
    markUrl,
    imageUrl,
    className,
  } = props;

  const g = grade && VALID_GRADES.includes(grade) ? grade : "free";
  const label = GRADE_LABEL[g];

  const showShine = g === "epic";
  const showHolo = g === "legend";
  const showGlass = g === "legend";

  const initial = guildName ? guildName.slice(0, 1) : "?";

  const rootClass = [styles.card, styles["g_" + g], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div
        className={styles.bg}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className={styles.ov} />

      {markUrl ? (
        <img src={markUrl} alt="" aria-hidden="true" className={styles.water} />
      ) : null}

      {showHolo ? <div className={styles.holo} /> : null}
      {showGlass ? <div className={styles.glass} /> : null}
      {showShine ? <div className={styles.shine} /> : null}

      <div className={styles.ct}>
        <div className={styles.top}>
          <div className={styles.id}>
            <div className={styles.mark}>
              {markUrl ? (
                <img src={markUrl} alt="" className={styles.markImg} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div>
              <div className={styles.name}>{guildName}</div>
              <div className={styles.srv}>{server}</div>
            </div>
          </div>
          <div className={styles.chip}>{label}</div>
        </div>

        <div className={styles.bot}>
          <div className={styles.mst}>
            {masterName ? (
              <>
                길드마스터 <b>{masterName}</b>
              </>
            ) : null}
          </div>
          <div className={styles.stat}>
            멤버 {formatNum(memberCount)} · <b>{formatNum(points)}P</b>
          </div>
        </div>
      </div>
    </div>
  );
}
