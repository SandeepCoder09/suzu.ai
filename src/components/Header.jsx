import { GlassIcon, MenuIcon, VolumeIcon, VolumeOffIcon, NewChatIcon, SettingsIcon, MoonIcon, SunIcon, SystemThemeIcon } from "./Icons";
import styles from "../styles/Header.module.css";

const SuzuLogo = () => (
  <svg width="34" height="34" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hG" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#f0abfc"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </radialGradient>
      <radialGradient id="hS" cx="32%" cy="28%" r="40%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="hC"><circle cx="256" cy="256" r="200"/></clipPath>
    </defs>
    <rect width="512" height="512" rx="110" fill="var(--bg-base)"/>
    <circle cx="256" cy="256" r="215" fill="rgba(139,92,246,0.14)"/>
    <circle cx="256" cy="256" r="200" fill="url(#hG)"/>
    <circle cx="256" cy="256" r="200" fill="url(#hS)" clipPath="url(#hC)"/>
    <rect x="222" y="168" width="68" height="110" rx="34" fill="#fff" fillOpacity="0.95"/>
    <path d="M180 278 Q180 340 256 340 Q332 340 332 278" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <line x1="256" y1="340" x2="256" y2="372" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <line x1="220" y1="372" x2="292" y2="372" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <path d="M168 228 Q148 256 168 284" fill="none" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M344 228 Q364 256 344 284" fill="none" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.9"/>
  </svg>
);

const ThemeIcon = ({ theme }) => {
  if (theme === "dark")   return <MoonIcon />;
  if (theme === "light")  return <SunIcon />;
  return <SystemThemeIcon />;
};

const nextTheme = (t) => t === "dark" ? "light" : t === "light" ? "system" : "dark";
const themeLabel = (t, isDark) =>
  t === "system" ? "System" : t === "dark" ? "Dark" : "Light";

export default function Header({
  onMenuClick, onSettingsClick, onClearClick,
  voiceEnabled, onVoiceToggle,
  isListening, isSpeaking, isThinking,
  theme, onThemeChange,
  t, lang,
}) {
  const statusPhase = isListening ? "listening" : isSpeaking ? "speaking" : isThinking ? "thinking" : null;
  const statusColor = { listening: "#10b981", speaking: "#8b5cf6", thinking: "#f59e0b" }[statusPhase];

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Menu */}
        <GlassIcon onClick={onMenuClick} title="Sidebar" size={36}>
          <MenuIcon />
        </GlassIcon>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <SuzuLogo />
            {statusColor && (
              <span className={styles.statusDot} style={{ background: statusColor }} />
            )}
          </div>
          <div className={styles.brandText}>
            <span className={styles.name}>{t("app.name")}</span>
            <span className={styles.tagline}>
              {statusPhase ? t(`app.tagline.${statusPhase}`) : t("app.tagline")}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {/* Theme cycle */}
        <GlassIcon
          onClick={() => onThemeChange(nextTheme(theme))}
          title={`Theme: ${themeLabel(theme)}`}
          size={36}
        >
          <ThemeIcon theme={theme} />
        </GlassIcon>

        {/* Voice toggle */}
        <GlassIcon
          onClick={onVoiceToggle}
          title={voiceEnabled ? "Mute voice" : "Enable voice"}
          active={voiceEnabled}
          size={36}
        >
          {voiceEnabled ? <VolumeIcon /> : <VolumeOffIcon />}
        </GlassIcon>

        {/* New chat */}
        <GlassIcon onClick={onClearClick} title={t("header.newChat")} size={36}>
          <NewChatIcon />
        </GlassIcon>

        {/* Settings */}
        <GlassIcon onClick={onSettingsClick} title={t("header.settings")} size={36}>
          <SettingsIcon />
        </GlassIcon>
      </div>
    </header>
  );
}