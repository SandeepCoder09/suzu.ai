import { useState } from "react";
import styles from "../styles/InstallBanner.module.css";

export default function InstallBanner({ onInstall, isOnline, canInstall }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("suzu_install_dismissed") === "1"
  );
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  const dismiss = () => {
    localStorage.setItem("suzu_install_dismissed", "1");
    setDismissed(true);
  };

  if (!isOnline) return (
    <div className={`${styles.banner} ${styles.offline}`}>
      <span>📵 Offline — cached content available</span>
    </div>
  );

  if (dismissed) return null;

  if (isIOS && !showIOSGuide) return (
    <div className={styles.banner}>
      <span className={styles.text}>📲 Install Suzu on iPhone</span>
      <div className={styles.btns}>
        <button className={styles.actionBtn} onClick={() => setShowIOSGuide(true)}>How?</button>
        <button className={styles.closeBtn} onClick={dismiss}>✕</button>
      </div>
    </div>
  );

  if (isIOS && showIOSGuide) return (
    <div className={`${styles.banner} ${styles.iOSBanner}`}>
      <div className={styles.iosSteps}>
        <p className={styles.iosTitle}>Install on iPhone:</p>
        <p>1. Tap <strong>Share</strong> ⬆ at the bottom</p>
        <p>2. Choose <strong>"Add to Home Screen"</strong></p>
        <p>3. Tap <strong>Add</strong> ✅</p>
      </div>
      <button className={styles.closeBtn} onClick={() => { setShowIOSGuide(false); dismiss(); }}>✕</button>
    </div>
  );

  if (canInstall) return (
    <div className={styles.banner}>
      <div className={styles.brandRow}>
        <span className={styles.icon}>🌸</span>
        <div>
          <p className={styles.title}>Install Suzu</p>
          <p className={styles.sub}>Use like a native app — no browser needed</p>
        </div>
      </div>
      <div className={styles.btns}>
        <button className={styles.installBtn} onClick={onInstall}>Install</button>
        <button className={styles.closeBtn} onClick={dismiss}>✕</button>
      </div>
    </div>
  );

  return null;
}