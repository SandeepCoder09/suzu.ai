import { GlassIcon, MoonIcon, SunIcon, SystemThemeIcon, GlobeIcon, VolumeIcon, BrainIcon, BellIcon, FontIcon, DownloadIcon, CloseIcon, CheckIcon } from "./Icons";
import WakeWordToggle from "./WakeWordToggle";
import styles from "../styles/SettingsPanel.module.css";

const ThemeBtn = ({ value, current, icon, label, onClick }) => (
  <button className={`${styles.themeBtn} ${current === value ? styles.themeBtnActive : ""}`} onClick={() => onClick(value)}>
    <span className={styles.themeBtnIcon}>{icon}</span>
    <span>{label}</span>
  </button>
);

const LangBtn = ({ value, current, label, sub, onClick }) => (
  <button className={`${styles.langBtn} ${current === value ? styles.langBtnActive : ""}`} onClick={() => onClick(value)}>
    <span className={styles.langLabel}>{label}</span>
    {sub && <span className={styles.langSub}>{sub}</span>}
    {current === value && <CheckIcon />}
  </button>
);

const Section = ({ icon, title, children }) => (
  <div className={styles.section}>
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <h3 className={styles.sectionTitle}>{title}</h3>
    </div>
    {children}
  </div>
);

export default function SettingsPanel({
  onClose,
  theme, onThemeChange,
  lang, onLangChange,
  voiceEnabled, onVoiceToggle,
  voices, selectedVoice, onVoiceChange,
  voiceLang, onVoiceLangChange,
  alwaysOn, wakeStatus, onToggleAlwaysOn,
  canInstall, onInstall, isInstalled,
  onRequestNotifications,
  fontSize, onFontSizeChange,
  onExport, hasMessages,
  t,
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{t("settings.title")}</h2>
          <GlassIcon onClick={onClose} size={32}><CloseIcon /></GlassIcon>
        </div>

        {/* ── Theme ── */}
        <Section icon={<MoonIcon />} title={t("settings.theme")}>
          <div className={styles.themeRow}>
            <ThemeBtn value="dark"   current={theme} icon={<MoonIcon />}         label={t("settings.theme.dark")}   onClick={onThemeChange} />
            <ThemeBtn value="light"  current={theme} icon={<SunIcon />}          label={t("settings.theme.light")}  onClick={onThemeChange} />
            <ThemeBtn value="system" current={theme} icon={<SystemThemeIcon />}  label={t("settings.theme.system")} onClick={onThemeChange} />
          </div>
        </Section>

        {/* ── Language ── */}
        <Section icon={<GlobeIcon />} title={t("settings.language")}>
          <div className={styles.langRow}>
            <LangBtn value="en" current={lang} label="English"  sub="Default" onClick={onLangChange} />
            <LangBtn value="hi" current={lang} label="हिंदी"    sub="Hindi"   onClick={onLangChange} />
          </div>
        </Section>

        {/* ── Voice ── */}
        <Section icon={<VolumeIcon />} title={t("settings.voice")}>
          {/* Enable toggle */}
          <label className={styles.toggle}>
            <span className={styles.toggleLabel}>{t("settings.voice.enable")}</span>
            <div className={`${styles.switch} ${voiceEnabled ? styles.switchOn : ""}`}
              onClick={onVoiceToggle} role="switch" aria-checked={voiceEnabled} tabIndex={0}
              onKeyDown={e => e.key === "Enter" && onVoiceToggle()}>
              <div className={styles.knob} />
            </div>
          </label>

          {/* Voice language */}
          <p className={styles.subLabel}>{t("settings.voice.lang")}</p>
          <div className={styles.langRow}>
            <LangBtn value="en"   current={voiceLang} label="English" sub="Female voice"  onClick={onVoiceLangChange} />
            <LangBtn value="hi"   current={voiceLang} label="हिंदी"   sub="Hindi voice"   onClick={onVoiceLangChange} />
          </div>

          {/* Voice picker */}
          {voices.length > 0 && (
            <>
              <p className={styles.subLabel}>{t("settings.voice.select")}</p>
              <select className={styles.select} value={selectedVoice?.name || ""}
                onChange={e => { const v = voices.find(x => x.name === e.target.value); if (v) onVoiceChange(v); }}>
                {voices.filter(v => v.lang?.startsWith("en") || v.lang?.startsWith("hi")).map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </>
          )}
        </Section>

        {/* ── Wake Word ── */}
        <Section icon={<BrainIcon />} title={t("settings.wakeWord")}>
          <WakeWordToggle alwaysOn={alwaysOn} wakeStatus={wakeStatus} onToggle={onToggleAlwaysOn} t={t} />
          <p className={styles.hint}>{t("settings.wakeWord.hint")}</p>
        </Section>

        {/* ── Font Size ── */}
        <Section icon={<FontIcon />} title={t("settings.fontSize")}>
          <div className={styles.fontRow}>
            {["small", "medium", "large"].map(f => (
              <button key={f}
                className={`${styles.fontBtn} ${fontSize === f ? styles.fontBtnActive : ""}`}
                onClick={() => onFontSizeChange(f)}
                style={{ fontSize: f === "small" ? "11px" : f === "medium" ? "13px" : "15px" }}>
                {t(`settings.fontSize.${f}`)}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Export ── */}
        <Section icon={<DownloadIcon />} title={t("settings.export")}>
          <button className={`${styles.actionBtn} ${!hasMessages ? styles.actionBtnDisabled : ""}`}
            onClick={hasMessages ? onExport : undefined} disabled={!hasMessages}>
            <DownloadIcon />
            <span>{t("settings.export.btn")}</span>
          </button>
        </Section>

        {/* ── Install ── */}
        <Section icon="📲" title={t("settings.install")}>
          {isInstalled
            ? <div className={styles.badge}>{t("settings.install.done")}</div>
            : canInstall
            ? <button className={styles.installBtn} onClick={onInstall}>{t("settings.install.btn")}</button>
            : <p className={styles.hint}>{t("settings.install.ios")}</p>
          }
        </Section>

        {/* ── Notifications ── */}
        <Section icon={<BellIcon />} title={t("settings.notifications")}>
          <button className={styles.actionBtn} onClick={onRequestNotifications}>
            <BellIcon />
            <span>{t("settings.notifications.btn")}</span>
          </button>
        </Section>

        {/* ── Tips ── */}
        <Section icon="💡" title={t("settings.tips")}>
          <ul className={styles.tips}>
            {[1,2,3,4,5].map(i => (
              <li key={i} className={styles.tip}>
                <span className={styles.tipDot} />
                <span>{t(`settings.tips.${i}`)}</span>
              </li>
            ))}
          </ul>
        </Section>

      </div>
    </div>
  );
}