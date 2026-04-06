import { useState, useRef } from "react";
import { MicIcon, StopIcon, SendIcon } from "./Icons";
import styles from "../styles/TextInput.module.css";

const MAX_CHARS = 4000;

export default function TextInput({ onSend, disabled, onMicClick, isListening, isSpeaking, t }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  const handleSend = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue("");
    ref.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canSend     = value.trim().length > 0 && !disabled;
  const isActive    = isListening || isSpeaking;
  const placeholder = isListening
    ? t("chat.placeholder.listening")
    : isSpeaking
    ? t("chat.placeholder.speaking")
    : t("chat.placeholder");

  return (
    <div className={styles.bar}>
      <div className={`${styles.wrapper} ${isActive ? styles.wrapperActive : ""}`}>

        {/* Mic button — 3D glass */}
        <button
          className={`${styles.micBtn} ${isListening ? styles.micListening : isSpeaking ? styles.micSpeaking : ""}`}
          onClick={onMicClick}
          title={isListening ? "Stop" : isSpeaking ? "Stop speaking" : "Speak (Hey Suzu)"}
          type="button"
        >
          {isListening ? <StopIcon /> : <MicIcon />}
          {isListening && <span className={styles.micPulse} />}
        </button>

        <div className={styles.divider} />

        {/* Input */}
        <textarea
          ref={ref}
          className={styles.input}
          value={value}
          onChange={e => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Message input"
        />

        {/* Char count (only when near limit) */}
        {value.length > MAX_CHARS * 0.8 && (
          <span className={styles.charCount}>{MAX_CHARS - value.length}</span>
        )}

        {/* Send button — 3D glass */}
        <button
          className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ""}`}
          onClick={handleSend}
          disabled={!canSend}
          type="button"
          title="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}