import { useState, useRef, useCallback } from "react";
import styles from "../styles/FileAttachment.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: ["application/pdf", "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  media: ["audio/mpeg", "audio/wav", "audio/ogg", "video/mp4", "video/webm"],
  code: ["text/javascript", "text/html", "text/css", "application/json",
    "text/x-python", "text/x-java-source"],
};

const ALL_ACCEPTED = Object.values(ACCEPTED).flat();

export function getFileIcon(file) {
  if (!file?.type) return "📎";
  const t = file.type;
  if (t.startsWith("image/")) return "🖼";
  if (t.startsWith("audio/")) return "🎵";
  if (t.startsWith("video/")) return "🎬";
  if (t === "application/pdf") return "📄";
  if (t.includes("spreadsheet") || t.includes("excel")) return "📊";
  if (t.includes("document") || t.includes("word")) return "📝";
  if (t.includes("json") || t.includes("javascript") || t.includes("html") || t.includes("css") || t.includes("python")) return "💻";
  if (t.startsWith("text/")) return "📃";
  return "📎";
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Safely normalize attachments — handles array, JSON string, or undefined
function safeAttachments(attachments) {
  if (Array.isArray(attachments)) return attachments;
  if (typeof attachments === "string") {
    try { return JSON.parse(attachments); } catch { return []; }
  }
  return [];
}

// ── AttachButton — the paperclip icon ─────────────────────────────
export function AttachButton({ onFiles, disabled }) {
  const inputRef = useRef(null);

  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        alert(`"${f.name}" is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    if (files.length) onFiles(files);
  }, [onFiles]);

  const handleChange = (e) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALL_ACCEPTED.join(",")}
        onChange={handleChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <button
        type="button"
        className={styles.attachBtn}
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled}
        title="Attach files, images, or documents"
        aria-label="Attach file"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
    </>
  );
}

// ── AttachmentPreviewBar — shows selected files above the input ────
export function AttachmentPreviewBar({ attachments, onRemove, onPreview }) {
  const safe = safeAttachments(attachments);
  if (!safe.length) return null;
  return (
    <div className={styles.previewBar}>
      {safe.map((att, i) => (
        <div key={i} className={styles.previewItem}>
          {att.isImage ? (
            <img
              src={att.dataUrl}
              alt={att.file?.name}
              className={styles.previewThumb}
              onClick={() => onPreview?.(att)}
            />
          ) : (
            <div className={styles.previewIcon} onClick={() => onPreview?.(att)}>
              {getFileIcon(att.file)}
            </div>
          )}
          <div className={styles.previewInfo}>
            <p className={styles.previewName}>{att.file?.name?.slice(0, 18)}{att.file?.name?.length > 18 ? "…" : ""}</p>
            <p className={styles.previewSize}>{formatBytes(att.file?.size)}</p>
          </div>
          <button className={styles.removeBtn} onClick={() => onRemove(i)} title="Remove">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── AttachmentBubble — renders attachments inside a chat message ───
export function AttachmentBubble({ attachments, onPreview }) {
  const safe = safeAttachments(attachments);
  if (!safe.length) return null;
  return (
    <div className={styles.bubbleAttachments}>
      {safe.map((att, i) => (
        att.isImage ? (
          <img
            key={i}
            src={att.dataUrl}
            alt={att.file?.name || "Image"}
            className={styles.bubbleImg}
            onClick={() => onPreview?.(att)}
          />
        ) : (
          <div key={i} className={styles.bubbleFile} onClick={() => onPreview?.(att)}>
            <span className={styles.bubbleFileIcon}>{getFileIcon(att.file)}</span>
            <div>
              <p className={styles.bubbleFileName}>{att.file?.name}</p>
              <p className={styles.bubbleFileSize}>{formatBytes(att.file?.size || 0)}</p>
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// ── Hook: useFileAttachments ───────────────────────────────────────
export function useFileAttachments() {
  const [attachments, setAttachments] = useState([]);
  const [previewAtt,  setPreviewAtt]  = useState(null);

  const addFiles = useCallback(async (files) => {
    const newAtts = await Promise.all(files.map(async (file) => {
      const isImage = file.type.startsWith("image/");
      let dataUrl = null;
      let textContent = null;
      if (isImage) {
        dataUrl = await readAsDataURL(file);
      } else if (file.type.startsWith("text/") || file.type.includes("json")) {
        textContent = await readAsText(file);
      }
      return { file, isImage, dataUrl, textContent };
    }));
    setAttachments(prev => [...prev, ...newAtts]);
  }, []);

  const removeAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => setAttachments([]), []);

  const buildAttachmentContext = useCallback((atts) => {
    const textParts = safeAttachments(atts)
      .filter(a => a.textContent)
      .map(a => `[File: ${a.file.name}]\n${a.textContent.slice(0, 3000)}`);
    return textParts.length > 0 ? "\n\n---\n" + textParts.join("\n\n") : "";
  }, []);

  return {
    attachments, addFiles, removeAttachment, clearAttachments,
    buildAttachmentContext, previewAtt, setPreviewAtt,
  };
}

// Helpers
function readAsDataURL(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}
function readAsText(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsText(file);
  });
}