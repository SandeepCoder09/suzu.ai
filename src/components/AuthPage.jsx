import { useState } from "react";
import styles from "../styles/AuthPage.module.css";

const SuzuLogo = () => (
  <svg width="64" height="64" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="aG" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#f0abfc"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </radialGradient>
      <radialGradient id="aS" cx="32%" cy="28%" r="40%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="aC"><circle cx="256" cy="256" r="200"/></clipPath>
    </defs>
    <rect width="512" height="512" rx="110" fill="var(--bg-base, #060612)"/>
    <circle cx="256" cy="256" r="215" fill="rgba(139,92,246,0.18)"/>
    <circle cx="256" cy="256" r="200" fill="url(#aG)"/>
    <circle cx="256" cy="256" r="200" fill="url(#aS)" clipPath="url(#aC)"/>
    <rect x="222" y="168" width="68" height="110" rx="34" fill="#fff" fillOpacity="0.95"/>
    <path d="M180 278 Q180 340 256 340 Q332 340 332 278" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <line x1="256" y1="340" x2="256" y2="372" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <line x1="220" y1="372" x2="292" y2="372" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
    <path d="M168 228 Q148 256 168 284" fill="none" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M344 228 Q364 256 344 284" fill="none" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.9"/>
  </svg>
);

function InputField({ label, type = "text", value, onChange, placeholder, icon, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputError : ""}`}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        <input
          className={styles.input}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={isPassword ? "current-password" : "email"}
        />
        {isPassword && (
          <button type="button" className={styles.eyeBtn} onClick={() => setShow(v => !v)}>
            {show ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {error && <p className={styles.fieldError}>{error}</p>}
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  const [mode,     setMode]     = useState("login"); // login | register | forgot
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState("");

  const validate = () => {
    const e = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (mode !== "forgot") {
      if (password.length < 6) e.password = "Password must be at least 6 characters";
      if (mode === "register") {
        if (!name.trim()) e.name = "Name is required";
        if (password !== confirm) e.confirm = "Passwords do not match";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSuccess("");

    // Simulate auth — replace with real API calls
    await new Promise(r => setTimeout(r, 1200));

    if (mode === "forgot") {
      setSuccess("Password reset link sent to " + email);
      setLoading(false);
      return;
    }

    // Save user to localStorage (replace with real JWT/session)
    const user = {
      name: name || email.split("@")[0],
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("suzu_user", JSON.stringify(user));
    setLoading(false);
    onLogin(user);
  };

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.bgGrid} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <SuzuLogo />
          <h1 className={styles.appName}>Suzu AI</h1>
          <p className={styles.appTagline}>Sandy's Personal AI Assistant 🌸</p>
        </div>

        {/* Mode heading */}
        <h2 className={styles.heading}>
          {mode === "login"    ? "Welcome back"       :
           mode === "register" ? "Create your account" :
                                  "Reset password"}
        </h2>
        <p className={styles.subHeading}>
          {mode === "login"    ? "Sign in to continue to Suzu"         :
           mode === "register" ? "Start your AI journey with Suzu"     :
                                  "We'll send you a reset link"}
        </p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === "register" && (
            <InputField label="Full Name" value={name} onChange={setName}
              placeholder="Sandy" icon="👤" error={errors.name} />
          )}
          <InputField label="Email address" type="email" value={email} onChange={setEmail}
            placeholder="sandy@example.com" icon="✉️" error={errors.email} />
          {mode !== "forgot" && (
            <InputField label="Password" type="password" value={password} onChange={setPassword}
              placeholder="••••••••" error={errors.password} />
          )}
          {mode === "register" && (
            <InputField label="Confirm Password" type="password" value={confirm} onChange={setConfirm}
              placeholder="••••••••" error={errors.confirm} />
          )}

          {mode === "login" && (
            <button type="button" className={styles.forgotLink} onClick={() => { setMode("forgot"); setErrors({}); }}>
              Forgot password?
            </button>
          )}

          {success && <div className={styles.successMsg}>{success}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? "Please wait..." :
             mode === "login"    ? "Sign in" :
             mode === "register" ? "Create account" :
                                    "Send reset link"}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}><span>or</span></div>

        {/* Google OAuth (placeholder) */}
        <button className={styles.googleBtn} onClick={() => {
          const user = { name: "Sandy", email: "sandy@gmail.com", createdAt: new Date().toISOString() };
          localStorage.setItem("suzu_user", JSON.stringify(user));
          onLogin(user);
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Switch mode */}
        <p className={styles.switchMode}>
          {mode === "login" ? (
            <>Don't have an account? <button type="button" onClick={() => { setMode("register"); setErrors({}); }}>Sign up</button></>
          ) : mode === "register" ? (
            <>Already have an account? <button type="button" onClick={() => { setMode("login"); setErrors({}); }}>Sign in</button></>
          ) : (
            <><button type="button" onClick={() => { setMode("login"); setErrors({}); }}>← Back to sign in</button></>
          )}
        </p>

        <p className={styles.legal}>
          By continuing, you agree to Suzu's <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}