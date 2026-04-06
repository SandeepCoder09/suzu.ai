import { useState, useEffect, useCallback } from "react";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ChatWindow from "./components/ChatWindow";
import TextInput from "./components/TextInput";
import SettingsPanel from "./components/SettingsPanel";
import InstallBanner from "./components/installBanner";
import { ToastContainer, ConfirmDialog, toast } from "./components/Dialog";
import useChat from "./hooks/useChat";
import useSpeech, { handleAppCommand } from "./hooks/useSpeech";
import useTheme from "./hooks/useTheme";
import useLanguage from "./hooks/useLanguage";
import { usePWA } from "./hooks/usePWA";
import { getConversation } from "./services/api";
import styles from "./styles/App.module.css";

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("suzu_user")); } catch { return null; }
  });

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => { localStorage.removeItem("suzu_user"); setUser(null); };

  // ── App state ─────────────────────────────────────────────────
  const [conversationId, setConversationId] = useState(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(window.innerWidth > 640);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [voiceEnabled,   setVoiceEnabled]   = useState(true);
  const [voiceLang,      setVoiceLang]      = useState(() => localStorage.getItem("suzu_voice_lang") || "en");
  const [fontSize,       setFontSize]       = useState(() => localStorage.getItem("suzu_fontsize") || "medium");

  const { theme, setTheme } = useTheme();
  const { lang, setLang, t, randomWake } = useLanguage();
  const { canInstall, isInstalled, isOnline, triggerInstall, requestNotifications } = usePWA();

  useEffect(() => { document.documentElement.setAttribute("data-fontsize", fontSize); localStorage.setItem("suzu_fontsize", fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem("suzu_voice_lang", voiceLang); }, [voiceLang]);

  const { messages, isThinking, error, sendMessage, clearMessages, injectMessage, loadMessages } =
    useChat(conversationId, setConversationId);

  // ── Wake word handler ─────────────────────────────────────────
  const handleWakeWord = useCallback(() => {
    const reply = randomWake();
    injectMessage("Hey Suzu 🌸", reply);
    if (voiceEnabled) setTimeout(() => speak(reply), 100);
  }, [voiceEnabled, randomWake]);

  const {
    isListening, isSpeaking, transcript, orbPhase,
    startListening, stopListening, stopSpeaking, speak,
    voices, selectedVoice, setSelectedVoice,
    alwaysOn, wakeStatus, toggleAlwaysOn,
  } = useSpeech({
    onTranscriptFinal: (text) => {
      // Check app command first
      const appName = handleAppCommand(text);
      if (appName) {
        const reply = `Opening ${appName} for you, Master! 🌸`;
        injectMessage(text, reply);
        if (voiceEnabled) speak(reply);
        return;
      }
      sendMessage(text, (reply) => { if (voiceEnabled) speak(reply); });
    },
    onWakeWord: handleWakeWord,
    voiceLang,
  });

  const handleSelectConv = useCallback(async (id) => {
    if (!id) { setConversationId(null); clearMessages(); return; }
    try {
      const d = await getConversation(id);
      setConversationId(id);
      loadMessages(d.conversation.messages);
    } catch (_) {}
    if (window.innerWidth <= 640) setSidebarOpen(false);
  }, [clearMessages, loadMessages]);

  const handleNewConv = useCallback((id) => {
    setConversationId(id || null);
    clearMessages();
    if (window.innerWidth <= 640) setSidebarOpen(false);
  }, [clearMessages]);

  const handleClear = useCallback(() => {
    setConversationId(null); clearMessages(); stopSpeaking();
  }, [clearMessages, stopSpeaking]);

  const exportChat = useCallback(() => {
    if (!messages.length) { toast.warning("No messages to export"); return; }
    const lines = messages.map(m => `${m.role === "user" ? (user?.name || "You") : "Suzu"}: ${m.content}`);
    const blob  = new Blob([`Suzu AI — Conversation Export\n${"─".repeat(40)}\n\n${lines.join("\n\n")}`], { type: "text/plain" });
    const url   = URL.createObjectURL(blob);
    const a     = Object.assign(document.createElement("a"), { href: url, download: `suzu-chat-${new Date().toISOString().slice(0,10)}.txt` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported!");
  }, [messages, user]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("new") === "1") { handleClear(); window.history.replaceState({}, "", "/"); }
  }, []);

  // ── Auth gate ─────────────────────────────────────────────────
  if (!user) return (
    <>
      <ToastContainer />
      <AuthPage onLogin={handleLogin} />
    </>
  );

  return (
    <div className={styles.app}>
      <div className={styles.blob1} /><div className={styles.blob2} /><div className={styles.blob3} />
      <div className={styles.bgGrid} />

      {/* Global dialog system */}
      <ToastContainer />
      <ConfirmDialog />

      <InstallBanner onInstall={triggerInstall} isOnline={isOnline} canInstall={canInstall} />

      {alwaysOn && (
        <div className={`${styles.wakeBar} ${wakeStatus === "detected" ? styles.wakeBarDetected : ""}`}>
          <span className={styles.wakeDot} />
          <span className={styles.wakeText}>
            {wakeStatus === "detected" ? `🌸 Wake word detected!` : `👂 Listening for "Hey Suzu"…`}
          </span>
        </div>
      )}

      <div className={styles.layout}>
        <Sidebar
          activeId={conversationId}
          onSelect={handleSelectConv}
          onNew={handleNewConv}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          t={t} lang={lang}
          user={user}
          onLogout={handleLogout}
        />

        <div className={styles.chatArea}>
          <Header
            onMenuClick={() => setSidebarOpen(v => !v)}
            onSettingsClick={() => setSettingsOpen(true)}
            onClearClick={handleClear}
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => { setVoiceEnabled(v => { if (v) stopSpeaking(); return !v; }); }}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            theme={theme} onThemeChange={setTheme}
            t={t} lang={lang}
            user={user}
          />

          <ChatWindow
            messages={messages} isThinking={isThinking} error={error}
            onSuggestionClick={(text) => {
              const appName = handleAppCommand(text);
              if (appName) { injectMessage(text, `Opening ${appName}! 🌸`); return; }
              sendMessage(text, (r) => { if (voiceEnabled) speak(r); });
            }}
            transcript={transcript} isListening={isListening} isSpeaking={isSpeaking}
            t={t} user={user}
          />

          <TextInput
            onSend={(text) => {
              const appName = handleAppCommand(text);
              if (appName) { injectMessage(text, `Opening ${appName} for you, Master! 🌸`); if (voiceEnabled) speak(`Opening ${appName}!`); return; }
              sendMessage(text, (r) => { if (voiceEnabled) speak(r); });
            }}
            disabled={isThinking}
            onMicClick={() => {
              if (isSpeaking) { stopSpeaking(); return; }
              if (isListening) { stopListening(); return; }
              startListening();
            }}
            isListening={isListening} isSpeaking={isSpeaking} t={t}
          />
        </div>
      </div>

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          theme={theme} onThemeChange={setTheme}
          lang={lang} onLangChange={setLang}
          voiceEnabled={voiceEnabled} onVoiceToggle={() => setVoiceEnabled(v => !v)}
          voices={voices} selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice}
          voiceLang={voiceLang} onVoiceLangChange={setVoiceLang}
          alwaysOn={alwaysOn} wakeStatus={wakeStatus} onToggleAlwaysOn={toggleAlwaysOn}
          canInstall={canInstall} onInstall={triggerInstall} isInstalled={isInstalled}
          onRequestNotifications={requestNotifications}
          fontSize={fontSize} onFontSizeChange={setFontSize}
          onExport={exportChat} hasMessages={messages.length > 0}
          user={user} onLogout={handleLogout}
          t={t}
        />
      )}
    </div>
  );
}