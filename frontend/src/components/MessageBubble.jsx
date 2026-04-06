import { useState } from "react";
import { CopyIcon, CheckIcon } from "./Icons";
import styles from "../styles/MessageBubble.module.css";

function formatTime(timestamp) {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export default function MessageBubble({ message, copiedLabel = "Copied!" }) {
  const isUser  = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      {!isUser && <div className={styles.avatar}>✦</div>}

      <div className={styles.bubbleWrap}>
        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
          {message.content}
        </div>

        <div className={`${styles.meta} ${isUser ? styles.metaUser : styles.metaAssistant}`}>
          {message.timestamp && (
            <span className={styles.time}>{formatTime(message.timestamp)}</span>
          )}
          <button className={`${styles.copyBtn} ${copied ? styles.copyDone : ""}`} onClick={handleCopy} title={copied ? copiedLabel : "Copy"}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}