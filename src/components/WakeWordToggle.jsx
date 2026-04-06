import { MicIcon, MicOffIcon } from "./Icons";
import styles from "../styles/WakeWordToggle.module.css";

export default function WakeWordToggle({ alwaysOn, wakeStatus, onToggle, t }) {
  const statusColor = {
    off:       "var(--text-muted)",
    listening: "var(--color-success)",
    detected:  "var(--color-warning)",
  }[wakeStatus] || "var(--text-muted)";

  const statusLabel = {
    off:       t ? t("settings.wakeWord") : "Off",
    listening: "👂 Listening...",
    detected:  "🌸 Wake word detected!",
  }[wakeStatus];

  return (
    <div className={`${styles.wrap} ${alwaysOn ? styles.active : ""}`} onClick={onToggle}>
      <div className={styles.left}>
        <div className={`${styles.iconBox} ${alwaysOn ? styles.iconBoxOn : ""}`}>
          {alwaysOn ? <MicIcon /> : <MicOffIcon />}
        </div>
        <div>
          <p className={styles.label}>Hey Suzu</p>
          <p className={styles.status} style={{ color: statusColor }}>{statusLabel}</p>
        </div>
      </div>

      <div className={`${styles.toggle} ${alwaysOn ? styles.toggleOn : ""}`}
        role="switch" aria-checked={alwaysOn} tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onToggle()} onClick={e => e.stopPropagation()}>
        <div className={styles.knob}>
          {alwaysOn && wakeStatus === "listening" && <span className={styles.pulse} />}
        </div>
      </div>
    </div>
  );
}