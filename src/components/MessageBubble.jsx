import { useState } from "react";
import { CopyIcon, CheckIcon } from "./Icons";
import { AttachmentBubble } from "./FileAttachment";
import { ImageModal } from "./Dialog";
import styles from "../styles/MessageBubble.module.css";

function formatTime(ts) {
  if (!ts) return "";
  try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MessageBubble({ message, copiedLabel = "Copied!" }) {
  const isUser = message.role === "user";
  const [copied,     setCopied]     = useState(false);
  const [previewAtt, setPreviewAtt] = useState(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <>
      {previewAtt?.isImage && (
        <ImageModal src={previewAtt.dataUrl} alt={previewAtt.file?.name} onClose={() => setPreviewAtt(null)} />
      )}

      <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
        {!isUser && <div className={styles.avatar}>✦</div>}

        <div className={styles.bubbleWrap}>
          <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
            {/* Attachments rendered above text */}
            {message.attachments?.length > 0 && (
              <AttachmentBubble attachments={message.attachments} onPreview={setPreviewAtt} />
            )}
            {/* Text content — hide the raw attachment context dump */}
            {message.content?.split("\n\n---\n")[0]}
          </div>

          <div className={`${styles.meta} ${isUser ? styles.metaUser : styles.metaAssistant}`}>
            {message.timestamp && <span className={styles.time}>{formatTime(message.timestamp)}</span>}
            <button className={`${styles.copyBtn} ${copied ? styles.copyDone : ""}`} onClick={handleCopy} title={copied ? copiedLabel : "Copy"}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}