import { useEffect, useState } from "react";
import styles from "../styles/OrbButton.module.css";

const PHASE_CONFIG = {
  idle:      { icon: "🎙", label: "Tap to speak",  color1: "#0ea5e9", color2: "#6366f1" },
  listening: { icon: "🎙", label: "Listening...",  color1: "#10b981", color2: "#06d6a0" },
  thinking:  { icon: "✦",  label: "Thinking...",   color1: "#f59e0b", color2: "#fb923c" },
  speaking:  { icon: "🔊", label: "Speaking...",   color1: "#8b5cf6", color2: "#ec4899" },
};

export default function OrbButton({ phase, onClick, transcript, isSpeaking, onStopSpeaking }) {
  const [pulse, setPulse] = useState(1);
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.idle;
  const isActive = phase === "listening" || phase === "speaking";

  // Micro-pulse animation when active
  useEffect(() => {
    if (!isActive) { setPulse(1); return; }
    const id = setInterval(() => {
      setPulse(1 + Math.random() * 0.08);
    }, 90);
    return () => clearInterval(id);
  }, [isActive]);

  return (
    <div className={styles.wrapper}>
      {/* Glow halo */}
      <div
        className={styles.halo}
        style={{ background: `radial-gradient(circle, ${cfg.color2}44 0%, transparent 70%)` }}
      />

      {/* Ripple rings when active */}
      {isActive && [1, 2, 3].map((i) => (
        <div
          key={i}
          className={styles.ripple}
          style={{
            width: 90 + i * 32,
            height: 90 + i * 32,
            borderColor: cfg.color1,
            animationDelay: `${(i - 1) * 0.35}s`,
          }}
        />
      ))}

      {/* Orb */}
      <button
        className={styles.orb}
        onClick={onClick}
        aria-label={cfg.label}
        style={{
          background: `radial-gradient(circle at 35% 35%, ${cfg.color1}, ${cfg.color2})`,
          boxShadow: `0 0 30px ${cfg.color2}55, 0 0 60px ${cfg.color2}22, inset 0 1px 0 rgba(255,255,255,0.2)`,
          transform: `scale(${pulse})`,
        }}
      >
        <span className={styles.orbIcon}>{cfg.icon}</span>
      </button>

      {/* Status label */}
      <p className={styles.label} style={{ color: cfg.color1 }}>
        {cfg.label}
      </p>

      {/* Live transcript */}
      {transcript && (
        <div className={styles.transcript}>"{transcript}"</div>
      )}

      {/* Stop speaking pill */}
      {isSpeaking && (
        <button className={styles.stopBtn} onClick={onStopSpeaking} style={{ borderColor: cfg.color1, color: cfg.color1 }}>
          ■ Stop speaking
        </button>
      )}
    </div>
  );
}
