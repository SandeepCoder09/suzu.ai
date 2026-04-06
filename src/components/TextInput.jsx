import { useState, useRef } from "react";
import { MicIcon, StopIcon, SendIcon } from "./Icons";
import { AttachButton, AttachmentPreviewBar, useFileAttachments } from "./FileAttachment";
import { ImageModal } from "./Dialog";
import styles from "../styles/TextInput.module.css";

const MAX_CHARS = 4000;

export default function TextInput({ onSend, disabled, onMicClick, isListening, isSpeaking, t }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  const {
    attachments, addFiles, removeAttachment, clearAttachments,
    buildAttachmentContext, previewAtt, setPreviewAtt,
  } = useFileAttachments();

  const handleSend = () => {
    const v = value.trim();
    if (!v && !attachments.length) return;
    if (disabled) return;

    // Build message with attachment context
    const attContext = buildAttachmentContext(attachments);
    const fullMessage = v + attContext;

    onSend(fullMessage, attachments.length ? [...attachments] : null);
    setValue("");
    clearAttachments();
    ref.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Paste image from clipboard
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith("image/"));
    if (imageItems.length > 0) {
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
      if (files.length) { addFiles(files); e.preventDefault(); }
    }
  };

  const canSend     = (value.trim().length > 0 || attachments.length > 0) && !disabled;
  const isActive    = isListening || isSpeaking;
  const placeholder = isListening
    ? (t?.("chat.placeholder.listening") || "Listening...")
    : isSpeaking
    ? (t?.("chat.placeholder.speaking") || "Speaking...")
    : (t?.("chat.placeholder") || "Type a message... (Enter to send)");

  return (
    <>
      {/* Image preview modal */}
      {previewAtt?.isImage && (
        <ImageModal src={previewAtt.dataUrl} alt={previewAtt.file?.name} onClose={() => setPreviewAtt(null)} />
      )}

      <div className={styles.container}>
        {/* Attachment preview bar */}
        <AttachmentPreviewBar
          attachments={attachments}
          onRemove={removeAttachment}
          onPreview={setPreviewAtt}
        />

        <div className={styles.bar}>
          <div className={`${styles.wrapper} ${isActive ? styles.wrapperActive : ""} ${attachments.length ? styles.hasAttachments : ""}`}>

            {/* Mic button */}
            <button
              className={`${styles.micBtn} ${isListening ? styles.micListening : isSpeaking ? styles.micSpeaking : ""}`}
              onClick={onMicClick}
              title={isListening ? "Stop" : isSpeaking ? "Stop speaking" : "Speak"}
              type="button"
            >
              {isListening ? <StopIcon /> : <MicIcon />}
              {isListening && <span className={styles.micPulse} />}
            </button>

            {/* Attach button */}
            <AttachButton onFiles={addFiles} disabled={disabled} />

            <div className={styles.divider} />

            {/* Text input */}
            <textarea
              ref={ref}
              className={styles.input}
              value={value}
              onChange={e => setValue(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKey}
              onPaste={handlePaste}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              aria-label="Message input"
            />

            {/* Char count */}
            {value.length > MAX_CHARS * 0.8 && (
              <span className={styles.charCount}>{MAX_CHARS - value.length}</span>
            )}

            {/* Send button */}
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
      </div>
    </>
  );
}