import { useState, useEffect, useCallback, useRef } from "react";
import styles from "../styles/Dialog.module.css";

// ── Toast system ─────────────────────────────────────────────────
let toastQueue = [];
let toastListener = null;

export function toast(message, type = "info", duration = 3000) {
  const id = Date.now() + Math.random();
  const item = { id, message, type, duration };
  toastQueue = [...toastQueue, item];
  toastListener?.(toastQueue);
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListener?.(toastQueue);
  }, duration + 400);
}
toast.success = (msg, dur) => toast(msg, "success", dur);
toast.error   = (msg, dur) => toast(msg, "error", dur);
toast.info    = (msg, dur) => toast(msg, "info", dur);
toast.warning = (msg, dur) => toast(msg, "warning", dur);

// ── Toast container ───────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { toastListener = setToasts; return () => { toastListener = null; }; }, []);
  return (
    <div className={styles.toastContainer}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          <span className={styles.toastIcon}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "⚠" : "ℹ"}
          </span>
          <span className={styles.toastMsg}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────
let confirmResolver = null;
let confirmListener = null;

export function showConfirm(opts) {
  return new Promise(resolve => {
    confirmResolver = resolve;
    confirmListener?.({ ...opts, open: true });
  });
}

export function ConfirmDialog() {
  const [state, setState] = useState({ open: false, title: "", message: "", confirmText: "Delete", cancelText: "Cancel", danger: true });

  useEffect(() => {
    confirmListener = (s) => setState({ ...s });
    return () => { confirmListener = null; };
  }, []);

  const handleConfirm = () => {
    setState(s => ({ ...s, open: false }));
    confirmResolver?.(true);
  };
  const handleCancel = () => {
    setState(s => ({ ...s, open: false }));
    confirmResolver?.(false);
  };

  if (!state.open) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.dialogIcon}>
          {state.danger ? "🗑" : "❓"}
        </div>
        <h3 className={styles.dialogTitle}>{state.title || "Are you sure?"}</h3>
        <p className={styles.dialogMessage}>{state.message || ""}</p>
        <div className={styles.dialogBtns}>
          <button className={styles.cancelBtn} onClick={handleCancel}>{state.cancelText || "Cancel"}</button>
          <button className={`${styles.confirmBtn} ${state.danger ? styles.danger : styles.primary}`} onClick={handleConfirm}>
            {state.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Image/File preview modal ───────────────────────────────────────
export function ImageModal({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!src) return null;
  return (
    <div className={styles.imgOverlay} onClick={onClose}>
      <img src={src} alt={alt || "Preview"} className={styles.imgPreview} onClick={e => e.stopPropagation()} />
      <button className={styles.imgClose} onClick={onClose}>✕</button>
    </div>
  );
}