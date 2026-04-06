import { useState, useEffect, useRef, useCallback } from "react";

const ENGLISH_FEMALE = [
  "Google UK English Female",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Zira - English (United States)",
  "Samantha", "Karen", "Victoria", "Moira", "Tessa",
];

const HINDI_FEMALE = [
  "Google हिन्दी",
  "Microsoft Swara Online (Natural) - Hindi (India)",
  "Microsoft Kalpana - Hindi (India)",
  "Lekha",
];

// Wake words to detect
const WAKE_WORDS = ["hey suzu", "hello suzu", "suzu", "सुज़ु", "हे सुज़ु", "हेलो सुज़ु"];

// ── App command handler ──────────────────────────────────────────
export function handleAppCommand(text) {
  const t = text.toLowerCase().trim();

  const appMap = [
    { words: ["whatsapp"],              url: "https://web.whatsapp.com" },
    { words: ["youtube"],              url: "https://youtube.com" },
    { words: ["google"],               url: "https://google.com" },
    { words: ["gmail"],                url: "https://mail.google.com" },
    { words: ["google maps", "maps"],  url: "https://maps.google.com" },
    { words: ["twitter", "x.com"],     url: "https://x.com" },
    { words: ["instagram"],            url: "https://instagram.com" },
    { words: ["facebook"],             url: "https://facebook.com" },
    { words: ["linkedin"],             url: "https://linkedin.com" },
    { words: ["github"],               url: "https://github.com" },
    { words: ["netflix"],              url: "https://netflix.com" },
    { words: ["spotify"],              url: "https://open.spotify.com" },
    { words: ["amazon"],               url: "https://amazon.in" },
    { words: ["flipkart"],             url: "https://flipkart.com" },
    { words: ["swiggy"],               url: "https://swiggy.com" },
    { words: ["zomato"],               url: "https://zomato.com" },
    { words: ["paytm"],                url: "https://paytm.com" },
    { words: ["gpay", "google pay"],   url: "https://pay.google.com" },
    { words: ["reddit"],               url: "https://reddit.com" },
    { words: ["zoom"],                 url: "https://zoom.us" },
    { words: ["meet", "google meet"],  url: "https://meet.google.com" },
    { words: ["calendar"],             url: "https://calendar.google.com" },
    { words: ["docs", "google docs"],  url: "https://docs.google.com" },
    { words: ["sheets"],               url: "https://sheets.google.com" },
    { words: ["drive", "google drive"],url: "https://drive.google.com" },
    { words: ["chatgpt"],              url: "https://chat.openai.com" },
    { words: ["telegram"],             url: "https://web.telegram.org" },
    { words: ["news"],                 url: "https://news.google.com" },
    { words: ["weather"],              url: "https://weather.com" },
    { words: ["calculator"],           action: () => { window.open("https://www.google.com/search?q=calculator", "_blank"); return true; } },
  ];

  // Check for "open X" or "launch X" patterns
  const openMatch = t.match(/(?:open|launch|go to|show me|take me to|start)\s+(.+)/);
  const targetPhrase = openMatch ? openMatch[1] : t;

  for (const app of appMap) {
    const matched = app.words.some(w => targetPhrase.includes(w));
    if (matched) {
      if (app.action) { app.action(); return app.words[0]; }
      window.open(app.url, "_blank");
      return app.words[0];
    }
  }

  // Google search fallback
  const searchMatch = t.match(/(?:search for|search|find|look up)\s+(.+)/);
  if (searchMatch) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchMatch[1])}`, "_blank");
    return "Google search for " + searchMatch[1];
  }

  return null;
}

export default function useSpeech({ onTranscriptFinal, onWakeWord, voiceLang = "en" }) {
  const [isListening,   setIsListening]   = useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [transcript,    setTranscript]    = useState("");
  const [orbPhase,      setOrbPhase]      = useState("idle");
  const [voices,        setVoices]        = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const synthRef        = useRef(window.speechSynthesis);
  const recognitionRef  = useRef(null);
  const alwaysOnRef     = useRef(false);
  const alwaysOnRecRef  = useRef(null);
  const restartTimerRef = useRef(null);
  const mountedRef      = useRef(true);

  // ── Load voices ─────────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      const v = synthRef.current.getVoices();
      if (!v.length) return;
      setVoices(v);
      pickVoice(v, voiceLang);
    };
    load();
    synthRef.current.onvoiceschanged = load;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (voices.length) pickVoice(voices, voiceLang);
  }, [voiceLang]);

  const pickVoice = (v, lang) => {
    let pick = null;
    if (lang === "hi") {
      for (const n of HINDI_FEMALE) { pick = v.find(x => x.name === n); if (pick) break; }
      if (!pick) pick = v.find(x => x.lang === "hi-IN");
      if (!pick) pick = v.find(x => x.lang?.startsWith("hi"));
    }
    if (!pick) {
      for (const n of ENGLISH_FEMALE) { pick = v.find(x => x.name === n); if (pick) break; }
      if (!pick) pick = v.find(x => x.lang?.startsWith("en") && /female|woman|zira|samantha|karen|victoria|aria/i.test(x.name));
      if (!pick) pick = v.find(x => x.lang?.startsWith("en"));
      if (!pick) pick = v[0];
    }
    setSelectedVoice(pick || null);
  };

  // ── Build recognition ────────────────────────────────────────────
  const buildRec = useCallback((onResult, continuous = false) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous     = continuous;
    rec.interimResults = true;
    rec.lang           = voiceLang === "hi" ? "hi-IN" : "en-IN";
    rec.maxAlternatives = 3;
    rec.onresult = onResult;
    return rec;
  }, [voiceLang]);

  // ── Always-On wake word ─────────────────────────────────────────
  // Uses a separate recognition loop that auto-restarts
  const [alwaysOn,   setAlwaysOn]   = useState(false);
  const [wakeStatus, setWakeStatus] = useState("off");

  const stopAlwaysOn = useCallback(() => {
    alwaysOnRef.current = false;
    clearTimeout(restartTimerRef.current);
    try { alwaysOnRecRef.current?.abort(); } catch (_) {}
    alwaysOnRecRef.current = null;
    setWakeStatus("off");
  }, []);

  const startAlwaysOnLoop = useCallback(() => {
    if (!alwaysOnRef.current || !mountedRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous      = false; // false is more reliable on mobile
    rec.interimResults  = false;
    rec.lang            = "en-IN";
    rec.maxAlternatives = 3;

    alwaysOnRecRef.current = rec;

    rec.onresult = (e) => {
      if (!alwaysOnRef.current) return;
      const texts = Array.from(e.results).flatMap(r =>
        Array.from(r).map(a => a.transcript.toLowerCase())
      );
      const detected = texts.some(t => WAKE_WORDS.some(w => t.includes(w)));
      if (detected) {
        setWakeStatus("detected");
        onWakeWord?.();
        setTimeout(() => {
          if (alwaysOnRef.current && mountedRef.current) setWakeStatus("listening");
        }, 3000);
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed") { stopAlwaysOn(); return; }
      // Auto-restart on any other error
      if (alwaysOnRef.current && mountedRef.current) {
        restartTimerRef.current = setTimeout(startAlwaysOnLoop, 800);
      }
    };

    rec.onend = () => {
      // Always restart when ended (this is the key fix!)
      if (alwaysOnRef.current && mountedRef.current) {
        restartTimerRef.current = setTimeout(startAlwaysOnLoop, 400);
      }
    };

    try {
      rec.start();
      if (mountedRef.current) setWakeStatus("listening");
    } catch (e) {
      if (alwaysOnRef.current && mountedRef.current) {
        restartTimerRef.current = setTimeout(startAlwaysOnLoop, 1000);
      }
    }
  }, [onWakeWord, stopAlwaysOn]);

  const toggleAlwaysOn = useCallback(() => {
    if (alwaysOnRef.current) {
      alwaysOnRef.current = false;
      setAlwaysOn(false);
      stopAlwaysOn();
    } else {
      alwaysOnRef.current = true;
      setAlwaysOn(true);
      setWakeStatus("listening");
      // Request mic permission first
      navigator.mediaDevices?.getUserMedia({ audio: true }).then(() => {
        startAlwaysOnLoop();
      }).catch(() => {
        alwaysOnRef.current = false;
        setAlwaysOn(false);
        setWakeStatus("off");
        alert("Microphone permission is required for always-on wake word.");
      });
    }
  }, [stopAlwaysOn, startAlwaysOnLoop]);

  // ── Manual listening ─────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (isSpeaking) { synthRef.current.cancel(); setIsSpeaking(false); }
    // Pause always-on during manual listen
    try { alwaysOnRecRef.current?.abort(); } catch (_) {}

    const rec = buildRec((e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(interim);
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript.trim();
        setTranscript("");
        setIsListening(false);

        // Check wake word
        const isWake = WAKE_WORDS.some(w => final.toLowerCase().includes(w));
        if (isWake) { setOrbPhase("speaking"); onWakeWord?.(); return; }

        // Check app command
        const appOpened = handleAppCommand(final);
        if (appOpened) {
          setOrbPhase("idle");
          // Resume always-on
          if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 500);
          return;
        }

        setOrbPhase("thinking");
        onTranscriptFinal?.(final);
      }
    }, false);

    if (!rec) { alert("Speech recognition not supported. Use Chrome or Edge."); return; }
    recognitionRef.current = rec;

    rec.onerror = (e) => { console.warn("[Suzu] Mic error:", e.error); setIsListening(false); setTranscript(""); setOrbPhase("idle"); };
    rec.onend   = () => {
      setIsListening(false); setTranscript("");
      setOrbPhase(p => p === "listening" ? "idle" : p);
      // Resume always-on after manual listen ends
      if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 500);
    };

    try { rec.start(); setIsListening(true); setOrbPhase("listening"); } catch (_) {}
  }, [isSpeaking, buildRec, onWakeWord, onTranscriptFinal, startAlwaysOnLoop]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false); setTranscript(""); setOrbPhase("idle");
    if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 500);
  }, [startAlwaysOnLoop]);

  // ── TTS Speak ────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!text) return;
    synthRef.current.cancel();
    // Pause always-on during speaking to avoid feedback
    try { alwaysOnRecRef.current?.abort(); } catch (_) {}

    const sentences = text.match(/[^।.!?\n]+[।.!?\n]*/g) || [text];
    let idx = 0;

    const next = () => {
      if (idx >= sentences.length) {
        setIsSpeaking(false); setOrbPhase("idle");
        // Resume always-on after speaking
        if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 800);
        return;
      }
      const chunk = sentences[idx++].trim();
      if (!chunk) { next(); return; }
      const u = new SpeechSynthesisUtterance(chunk);
      if (selectedVoice) {
        u.voice = selectedVoice;
        u.lang  = selectedVoice.lang?.startsWith("hi") ? "hi-IN" : "en-IN";
        u.rate  = selectedVoice.lang?.startsWith("hi") ? 0.9 : 1.05;
        u.pitch = 1.12;
      } else {
        u.lang = voiceLang === "hi" ? "hi-IN" : "en-IN";
        u.rate = 1.0; u.pitch = 1.1;
      }
      u.volume  = 1.0;
      u.onstart = () => { setIsSpeaking(true); setOrbPhase("speaking"); };
      u.onend   = next;
      u.onerror = (e) => { if (e.error !== "interrupted") console.warn("[TTS]", e.error); setIsSpeaking(false); setOrbPhase("idle"); if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 800); };
      synthRef.current.speak(u);
    };
    next();
  }, [selectedVoice, voiceLang, startAlwaysOnLoop]);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel(); setIsSpeaking(false); setOrbPhase("idle");
    if (alwaysOnRef.current) setTimeout(startAlwaysOnLoop, 500);
  }, [startAlwaysOnLoop]);

  useEffect(() => () => {
    mountedRef.current = false;
    recognitionRef.current?.stop();
    alwaysOnRecRef.current?.abort();
    synthRef.current.cancel();
    clearTimeout(restartTimerRef.current);
  }, []);

  return {
    isListening, isSpeaking, transcript, orbPhase,
    startListening, stopListening, stopSpeaking, speak,
    voices, selectedVoice, setSelectedVoice,
    alwaysOn, wakeStatus, toggleAlwaysOn,
  };
}