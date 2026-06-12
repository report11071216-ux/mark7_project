import styles from "./GuildCard.module.css";
import GradeEmblem from "./GradeEmblem";

type EffectConf = { [key: string]: any };
type DesignConf = { [effect: string]: EffectConf };

type GuildCardProps = {
  guildName: string;
  server?: string | null;
  grade?: string;
  markUrl?: string | null;
  imageUrl?: string | null;
  tierLabel?: string;
  tierColor?: string;
  memberCount?: number;
  maxMembers?: number;
  statText?: string;
  design?: DesignConf | null;
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

const DEFAULT_DESIGNS: { [grade: string]: DesignConf } = {
  free: {},
  rare: { border: { on: true, color: "#5dcaa5", width: 2 } },
  unique: { glow: { on: true, color: "#7f77dd", strength: 18 }, borderFlow: { on: true, speed: 4.5 } },
  epic: { border: { on: true, color: "#fac775", width: 2 }, shine: { on: true, speed: 3.2 } },
  legend: { holo: { on: true, speed: 7 }, pulse: { on: true, color: "#fac775", speed: 2.4 }, glint: { on: true, color: "#fde68a" } },
};

function hexToRgba(hex: string, alpha: number) {
  const h = (hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

export default function GuildCard(props: GuildCardProps) {
  const {
    guildName, server, grade, markUrl, imageUrl,
    tierLabel, tierColor, memberCount, maxMembers, statText, design, className,
  } = props;

  const g = grade && VALID_GRADES.includes(grade) ? grade : "free";
  const label = GRADE_LABEL[g];
  const showChip = g !== "free";

  const d: DesignConf = design ?? DEFAULT_DESIGNS[g] ?? {};
  const isOn = (key: string) => d[key] && d[key].on === true;

  // CSS 변수 주입 (색·속도)
  const cardVars: { [k: string]: string } = {};
  const cardClasses: string[] = [styles.card];

  if (isOn("border")) {
    const c = d.border.color || "#94a3b8";
    const w = d.border.width || 2;
    cardVars["boxShadow"] = "inset 0 0 0 " + w + "px " + c;
  }
  if (isOn("glow")) {
    cardVars["--glow-color"] = hexToRgba(d.glow.color || "#7f77dd", 0.45);
    cardVars["--glow-strength"] = (d.glow.strength || 18) + "px";
    cardClasses.push(styles.glow);
  }
  if (isOn("breathe")) {
    cardVars["--glow-color"] = hexToRgba(d.breathe.color || "#7f77dd", 0.5);
    cardVars["--breathe-speed"] = (d.breathe.speed || 3) + "s";
    cardClasses.push(styles.breathe);
  }
  if (isOn("pulse")) {
    const c = d.pulse.color || "#fac775";
    cardVars["--pulse-soft"] = hexToRgba(c, 0.3);
    cardVars["--pulse-mid"] = hexToRgba(c, 0.55);
    cardVars["--pulse-strong"] = hexToRgba(c, 0.55);
    cardVars["--pulse-full"] = hexToRgba(c, 0.95);
    cardVars["animation"] = "pulse " + (d.pulse.speed || 2.4) + "s ease-in-out infinite";
  }

  const rootClass = [...cardClasses, className].filter(Boolean).join(" ");

  const bgClasses = [styles.bg];
  const bgVars: { [k: string]: string } = {};
  if (imageUrl) bgVars["backgroundImage"] = "url(" + imageUrl + ")";
  if (isOn("bgShift")) {
    bgClasses.push(styles.bgShift);
    bgVars["--bgshift-speed"] = (d.bgShift.speed || 8) + "s";
  }

  let memberText = "";
  if (typeof memberCount === "number") {
    memberText = typeof maxMembers === "number" ? memberCount + "/" + maxMembers : String(memberCount);
  }

  return (
    <div className={rootClass} style={cardVars as any}>
      <div className={bgClasses.join(" ")} style={bgVars as any} />
      <div className={styles.ov} />

      {isOn("noise") ? (
        <div className={styles.noise} style={{ ["--noise-opacity" as any]: (d.noise.strength || 5) / 100 }} />
      ) : null}

      {isOn("glint") ? (
        <div className={styles.glint} style={{ ["--glint-color" as any]: hexToRgba(d.glint.color || "#ffffff", 0.5) }} />
      ) : null}
      {isOn("holo") ? <div className={styles.holo} style={{ ["--holo-speed" as any]: (d.holo.speed || 7) + "s" }} /> : null}
      {isOn("holo") ? <div className={styles.glass} /> : null}
      {isOn("shine") ? <div className={styles.shine} style={{ ["--shine-speed" as any]: (d.shine.speed || 3.2) + "s" }} /> : null}
      {isOn("streak") ? <div className={styles.streak} style={{ ["--streak-speed" as any]: (d.streak.speed || 4) + "s" }} /> : null}
      {isOn("tilt") ? <div className={styles.tilt} style={{ ["--tilt-speed" as any]: (d.tilt.speed || 5) + "s" }} /> : null}
      {isOn("borderFlow") ? <div className={styles.borderFlow} style={{ ["--borderflow-speed" as any]: (d.borderFlow.speed || 4) + "s" }} /> : null}
      {isOn("sparkle") ? <div className={styles.sparkle} /> : null}

      <div className={styles.ct}>
        <div className={styles.top}>
          <div className={styles.id}>
            <div className={styles.mark}>
              {markUrl ? (
                <img src={markUrl} alt="" className={styles.markImg} />
              ) : (
                <GradeEmblem tierLabel={tierLabel} size={40} />
              )}
            </div>
            <div className={styles.nameWrap}>
              <div className={styles.name}>{guildName}</div>
              {server ? <div className={styles.srv}>{server}</div> : null}
            </div>
          </div>
          {showChip ? <div className={styles.chip}>{label}</div> : null}
        </div>

        <div className={styles.bot}>
          <div className={styles.tier}>
            {tierLabel ? (
              <>
                <span className={styles.tierDot} style={{ background: tierColor || "#94a3b8" }} />
                {tierLabel}
              </>
            ) : null}
          </div>
          {statText ? (
            <div className={styles.member}><b>{statText}</b></div>
          ) : memberText ? (
            <div className={styles.member}>멤버 <b>{memberText}</b></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
