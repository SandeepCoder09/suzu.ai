import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import styles from "../styles/ChatWindow.module.css";

const SuzuLogo = () => (
  <svg width="80" height="80" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="cG" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#f0abfc"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </radialGradient>
      <radialGradient id="cS" cx="32%" cy="28%" r="40%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.28"/>
        <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="cGl" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="cC"><circle cx="256" cy="200" r="110"/></clipPath>
    </defs>
    <rect width="512" height="512" rx="80" fill="var(--bg-card)"/>
    <circle cx="256" cy="200" r="155" fill="url(#cGl)"/>
    <circle cx="256" cy="200" r="110" fill="url(#cG)"/>
    <circle cx="256" cy="200" r="110" fill="url(#cS)" clipPath="url(#cC)"/>
    <circle cx="256" cy="200" r="110" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.18"/>
    <rect x="239" y="158" width="34" height="56" rx="17" fill="#fff" fillOpacity="0.95"/>
    <path d="M224 210 Q224 238 256 238 Q288 238 288 210" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="256" y1="238" x2="256" y2="252" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="242" y1="252" x2="270" y2="252" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M208 185 Q198 200 208 215" fill="none" stroke="#e9d5ff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M190 170 Q174 200 190 230" fill="none" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
    <path d="M304 185 Q314 200 304 215" fill="none" stroke="#e9d5ff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M322 170 Q338 200 322 230" fill="none" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
    <text x="256" y="350" fontFamily="Georgia,serif" fontSize="62" fontWeight="700" fill="var(--text-primary)" textAnchor="middle" letterSpacing="14">SUZU</text>
    <text x="256" y="382" fontFamily="Arial,sans-serif" fontSize="12" fill="var(--accent)" textAnchor="middle" letterSpacing="4">PERSONAL AI ASSISTANT</text>
    <line x1="100" y1="376" x2="180" y2="376" stroke="var(--border-md)" strokeWidth="1"/>
    <line x1="332" y1="376" x2="412" y2="376" stroke="var(--border-md)" strokeWidth="1"/>
  </svg>
);

export default function ChatWindow({ messages, isThinking, error, onSuggestionClick, transcript, isListening, isSpeaking, t }) {
  const bottomRef = useRef(null);

  const SUGGESTIONS = [
    { key: "suggest.email",     icon: "✉️" },
    { key: "suggest.summarize", icon: "📝" },
    { key: "suggest.plan",      icon: "📅" },
    { key: "suggest.code",      icon: "🐛" },
    { key: "suggest.ideas",     icon: "💡" },
    { key: "suggest.calculate", icon: "🔢" },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className={styles.window}>
      {messages.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.logoWrap}><SuzuLogo /></div>
          <p className={styles.emptyTitle}>{t("chat.empty.title")}</p>
          <p className={styles.emptySubtitle}>{t("chat.empty.subtitle")}</p>

          <div className={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <button key={s.key} className={styles.chip} onClick={() => onSuggestionClick(t(s.key))}>
                <span className={styles.chipIcon}>{s.icon}</span>
                <span className={styles.chipLabel}>{t(s.key)}</span>
              </button>
            ))}
          </div>

          <p className={styles.wakeHint}>{t("chat.wakeHint")}</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} copiedLabel={t("chat.copied")} />
      ))}

      {/* Live transcript */}
      {isListening && transcript && (
        <div className={styles.transcriptBadge}>
          <span className={styles.transcriptDot} />
          <span>"{transcript}"</span>
        </div>
      )}

      {isThinking && (
        <div className={styles.thinkingRow}>
          <div className={styles.avatar}>✦</div>
          <div className={styles.thinkingBubble}>
            <span /><span /><span />
          </div>
        </div>
      )}

      {error && <div className={styles.error}>⚠ {error}</div>}
      <div ref={bottomRef} />
    </div>
  );
}