import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://suzu-ai.onrender.com";

const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
  SPEAKING: "speaking",
};

const STATE_LABELS = {
  idle: "Tap mic to speak",
  listening: "Listening...",
  processing: "Thinking...",
  speaking: "Suzu is speaking",
};

const STATE_COLORS = {
  idle: "#4a9eff",
  listening: "#00e5a0",
  processing: "#f5a623",
  speaking: "#bf6fff",
};

export default function VoiceMode({ onClose, conversationId, memoryFacts }) {
  const [state, setState] = useState(STATES.IDLE);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [bars, setBars] = useState(new Array(40).fill(2));
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Animate bars based on audio input or synthetic animation
  const startAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const newBars = Array.from({ length: 40 }, (_, i) => {
          const index = Math.floor((i / 40) * dataArray.length);
          return Math.max(2, (dataArray[index] / 255) * 100);
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch {
      startSyntheticAnimation();
    }
  }, []);

  const startSyntheticAnimation = useCallback((type = "wave") => {
    let t = 0;
    const animate = () => {
      t += 0.08;
      const newBars = Array.from({ length: 40 }, (_, i) => {
        if (type === "processing") {
          return 10 + Math.sin(t * 3 + i * 0.3) * 8 + Math.random() * 5;
        }
        if (type === "speaking") {
          return 5 + Math.abs(Math.sin(t * 2 + i * 0.25)) * 70 + Math.random() * 10;
        }
        return 4 + Math.sin(t + i * 0.4) * 3;
      });
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const stopAudioVisualizer = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setBars(new Array(40).fill(2));
  }, []);

  // Send transcript to backend
  const sendToBackend = useCallback(async (text) => {
    setState(STATES.PROCESSING);
    startSyntheticAnimation("processing");
    setError("");
    try {
      const messages = [{ role: "user", content: text }];
      const systemContext = memoryFacts?.length
        ? `You are Suzu, a helpful AI assistant. User facts: ${memoryFacts.join(". ")}.`
        : "You are Suzu, a helpful AI assistant. Be concise and conversational.";

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, conversationId, systemContext }),
      });
      const data = await res.json();
      const reply = data.message || data.response || data.content || "I couldn't process that.";
      setResponse(reply);
      speakResponse(reply);
    } catch (err) {
      setError("Backend error. Check connection.");
      setState(STATES.IDLE);
      stopAudioVisualizer();
      startSyntheticAnimation("idle");
    }
  }, [memoryFacts, conversationId, startSyntheticAnimation, stopAudioVisualizer]);

  // TTS with female voice
  const speakResponse = useCallback((text) => {
    const synth = synthRef.current;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const femaleVoice =
      voices.find((v) => /female|woman|girl|zira|samantha|victoria|karen|moira/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (femaleVoice) utter.voice = femaleVoice;
    utter.rate = 0.95;
    utter.pitch = 1.1;

    utter.onstart = () => {
      setState(STATES.SPEAKING);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      startSyntheticAnimation("speaking");
    };
    utter.onend = () => {
      setState(STATES.IDLE);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      startSyntheticAnimation("idle");
    };
    utter.onerror = () => {
      setState(STATES.IDLE);
      startSyntheticAnimation("idle");
    };
    synth.speak(utter);
  }, [startSyntheticAnimation]);

  // Start listening
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    synthRef.current.cancel();
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState(STATES.LISTENING);
      startAudioVisualizer();
    };

    recognition.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTranscript(t);
    };

    recognition.onend = () => {
      stopAudioVisualizer();
      if (stateRef.current === STATES.LISTENING) {
        const finalText = recognitionRef.current?._lastTranscript || transcript;
        if (finalText.trim()) {
          sendToBackend(finalText.trim());
        } else {
          setState(STATES.IDLE);
          startSyntheticAnimation("idle");
        }
      }
    };

    recognition.onerror = (e) => {
      stopAudioVisualizer();
      if (e.error !== "no-speech") setError(`Mic error: ${e.error}`);
      setState(STATES.IDLE);
      startSyntheticAnimation("idle");
    };

    recognition.start();
  }, [transcript, sendToBackend, startAudioVisualizer, stopAudioVisualizer, startSyntheticAnimation]);

  const stopListening = useCallback(() => {
    recognitionRef.current?._lastTranscript === undefined &&
      Object.assign(recognitionRef.current || {}, { _lastTranscript: transcript });
    recognitionRef.current?.stop();
  }, [transcript]);

  const handleMicClick = useCallback(() => {
    if (state === STATES.IDLE) {
      setTranscript("");
      setResponse("");
      startListening();
    } else if (state === STATES.LISTENING) {
      stopListening();
    } else if (state === STATES.SPEAKING) {
      synthRef.current.cancel();
      setState(STATES.IDLE);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      startSyntheticAnimation("idle");
    }
  }, [state, startListening, stopListening, startSyntheticAnimation]);

  // Init idle animation
  useEffect(() => {
    startSyntheticAnimation("idle");
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopAudioVisualizer();
      synthRef.current.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const accentColor = STATE_COLORS[state];

  return (
    <div style={styles.overlay}>
      {/* Background gradient shifts with state */}
      <div style={{ ...styles.bgGradient, background: `radial-gradient(ellipse at 50% 40%, ${accentColor}22 0%, #080c14 60%)` }} />

      {/* Close button */}
      <button style={styles.closeBtn} onClick={onClose} title="Back to chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <span style={{ marginLeft: 8, fontSize: 14 }}>Back to Chat</span>
      </button>

      {/* Suzu branding */}
      <div style={styles.brand}>
        <div style={{ ...styles.brandDot, background: accentColor, boxShadow: `0 0 20px ${accentColor}` }} />
        <span style={styles.brandName}>SUZU</span>
      </div>

      {/* Waveform */}
      <div style={styles.waveContainer}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              ...styles.bar,
              height: `${h}%`,
              background: `linear-gradient(to top, ${accentColor}, ${accentColor}88)`,
              opacity: 0.75 + (h / 100) * 0.25,
              transition: state === STATES.IDLE ? "height 0.3s ease" : "height 0.05s ease",
              transform: `scaleY(1)`,
            }}
          />
        ))}
      </div>

      {/* State label */}
      <p style={{ ...styles.stateLabel, color: accentColor }}>{STATE_LABELS[state]}</p>

      {/* Transcript / Response text */}
      <div style={styles.textArea}>
        {transcript && state !== STATES.SPEAKING && (
          <p style={styles.transcriptText}>"{transcript}"</p>
        )}
        {response && (state === STATES.SPEAKING || state === STATES.IDLE) && (
          <p style={styles.responseText}>{response}</p>
        )}
        {error && <p style={styles.errorText}>{error}</p>}
      </div>

      {/* Mic button */}
      <button
        style={{
          ...styles.micBtn,
          background: state === STATES.LISTENING
            ? `radial-gradient(circle, ${accentColor}44, ${accentColor}22)`
            : "rgba(255,255,255,0.05)",
          border: `2px solid ${accentColor}`,
          boxShadow: state === STATES.LISTENING
            ? `0 0 40px ${accentColor}66, 0 0 80px ${accentColor}22`
            : `0 0 20px ${accentColor}33`,
        }}
        onClick={handleMicClick}
        disabled={state === STATES.PROCESSING}
        title={state === STATES.IDLE ? "Start speaking" : "Stop"}
      >
        {state === STATES.PROCESSING ? (
          <LoadingSpinner color={accentColor} />
        ) : state === STATES.SPEAKING ? (
          <StopIcon color={accentColor} />
        ) : (
          <MicIcon color={accentColor} active={state === STATES.LISTENING} />
        )}
      </button>

      <p style={styles.hint}>
        {state === STATES.IDLE && "Tap to start • Suzu is ready"}
        {state === STATES.LISTENING && "Tap again to send"}
        {state === STATES.PROCESSING && "Processing your request..."}
        {state === STATES.SPEAKING && "Tap to interrupt"}
      </p>
    </div>
  );
}

function MicIcon({ color, active }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={active ? color + "44" : "none"} />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function StopIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color} stroke="none">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}

function LoadingSpinner({ color }) {
  return (
    <div style={{
      width: 32, height: 32, border: `3px solid ${color}33`,
      borderTop: `3px solid ${color}`, borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#080c14",
    fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
    overflow: "hidden",
  },
  bgGradient: {
    position: "absolute", inset: 0, transition: "background 0.8s ease", pointerEvents: "none",
  },
  closeBtn: {
    position: "absolute", top: 24, left: 24,
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.7)", borderRadius: 12,
    padding: "10px 18px", cursor: "pointer",
    fontSize: 14, backdropFilter: "blur(10px)",
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  brand: {
    position: "absolute", top: 28, right: 28,
    display: "flex", alignItems: "center", gap: 10,
    zIndex: 10,
  },
  brandDot: {
    width: 10, height: 10, borderRadius: "50%",
    transition: "all 0.5s ease",
  },
  brandName: {
    color: "rgba(255,255,255,0.9)", fontSize: 16,
    fontWeight: 700, letterSpacing: 4,
  },
  waveContainer: {
    display: "flex", alignItems: "center",
    gap: 3, height: 140, width: "80%", maxWidth: 600,
    marginBottom: 32, position: "relative", zIndex: 1,
  },
  bar: {
    flex: 1, borderRadius: 4,
    minHeight: 2, maxHeight: "100%",
    transformOrigin: "center",
  },
  stateLabel: {
    fontSize: 13, fontWeight: 600,
    letterSpacing: 3, textTransform: "uppercase",
    marginBottom: 24, transition: "color 0.5s ease",
    position: "relative", zIndex: 1,
  },
  textArea: {
    width: "80%", maxWidth: 560, minHeight: 80,
    textAlign: "center", marginBottom: 32,
    position: "relative", zIndex: 1,
  },
  transcriptText: {
    color: "rgba(255,255,255,0.5)", fontSize: 15,
    fontStyle: "italic", lineHeight: 1.6, margin: 0,
  },
  responseText: {
    color: "rgba(255,255,255,0.85)", fontSize: 17,
    lineHeight: 1.7, margin: 0, fontWeight: 400,
  },
  errorText: {
    color: "#ff6b6b", fontSize: 13, margin: 0,
  },
  micBtn: {
    width: 90, height: 90, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.3s ease",
    marginBottom: 20, position: "relative", zIndex: 1,
    backdropFilter: "blur(10px)",
  },
  hint: {
    color: "rgba(255,255,255,0.3)", fontSize: 12,
    letterSpacing: 1, position: "relative", zIndex: 1,
  },
};

// Inject spin keyframe
const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);