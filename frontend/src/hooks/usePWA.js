import { useState, useEffect, useRef, useCallback } from "react";

/**
 * usePWA — handles:
 * 1. Install prompt (Add to Home Screen)
 * 2. Always-On continuous wake word listening
 * 3. Network status
 * 4. Push notification permission
 */

const WAKE_WORDS = ["hey suzu", "hello suzu", "suzu", "सुज़ु", "हे सुज़ु"];

const WAKE_RESPONSES = [
    "Hello Master! 😊 मैं यहाँ हूँ — बताइए क्या काम करना है?",
    "Hello Sandy! I'm ready. आज क्या करना है?",
    "नमस्ते Master! Suzu at your service 🌸 बोलिए!",
    "Hello Sandy! हाँ बोलिए, मैं सुन रही हूँ!",
    "जी Master! I'm here. क्या help करूँ?",
    "Hello Sandy! 🌸 हाज़िर हूँ — क्या चाहिए?",
];

export function usePWA() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [canInstall, setCanInstall] = useState(false);

    // Capture install event
    useEffect(() => {
        const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setCanInstall(true); };
        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true); setCanInstall(false);
        }

        window.addEventListener("appinstalled", () => { setIsInstalled(true); setCanInstall(false); });
        window.addEventListener("online", () => setIsOnline(true));
        window.addEventListener("offline", () => setIsOnline(false));

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const triggerInstall = async () => {
        if (!installPrompt) return;
        const result = await installPrompt.prompt();
        if (result.outcome === "accepted") { setCanInstall(false); setIsInstalled(true); }
    };

    const requestNotifications = async () => {
        if (!("Notification" in window)) return "unsupported";
        if (Notification.permission === "granted") return "granted";
        const perm = await Notification.requestPermission();
        return perm;
    };

    return { canInstall, isInstalled, isOnline, triggerInstall, requestNotifications };
}

/**
 * useAlwaysOnWake — continuous microphone listening for wake word
 * Works in foreground. On Android Chrome, continues when screen dims.
 * Cannot work on locked screen without a native app.
 */
export function useAlwaysOnWake({ onWakeWord, enabled = false }) {
    const [alwaysOn, setAlwaysOn] = useState(false);
    const [wakeStatus, setWakeStatus] = useState("off"); // off | listening | detected
    const recRef = useRef(null);
    const restartT = useRef(null);
    const mounted = useRef(true);

    const stopWake = useCallback(() => {
        setAlwaysOn(false);
        setWakeStatus("off");
        clearTimeout(restartT.current);
        try { recRef.current?.stop(); recRef.current?.abort(); } catch (_) { }
        recRef.current = null;
    }, []);

    const startWake = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        const rec = new SR();
        rec.continuous = true;  // keep listening
        rec.interimResults = true;
        rec.lang = "en-IN";
        rec.maxAlternatives = 3;
        recRef.current = rec;

        rec.onresult = (e) => {
            const last = e.results[e.results.length - 1];
            const texts = Array.from(last).map(a => a.transcript.toLowerCase().trim());

            const detected = texts.some(t =>
                WAKE_WORDS.some(w => t.includes(w))
            );

            if (detected) {
                setWakeStatus("detected");
                const reply = WAKE_RESPONSES[Math.floor(Math.random() * WAKE_RESPONSES.length)];
                onWakeWord?.(reply);
                // Brief pause then resume listening
                setTimeout(() => { if (mounted.current) setWakeStatus("listening"); }, 3000);
            }
        };

        rec.onerror = (e) => {
            if (e.error === "not-allowed") { stopWake(); return; }
            // Auto-restart on transient errors
            if (mounted.current && alwaysOn) {
                restartT.current = setTimeout(startWake, 1500);
            }
        };

        rec.onend = () => {
            // Chrome stops continuous recognition after silence — auto-restart
            if (mounted.current && alwaysOn) {
                restartT.current = setTimeout(startWake, 300);
            }
        };

        try { rec.start(); setWakeStatus("listening"); } catch (_) { }
    }, [alwaysOn, onWakeWord, stopWake]);

    const toggleAlwaysOn = useCallback(() => {
        setAlwaysOn(prev => {
            if (prev) { stopWake(); return false; }
            return true;
        });
    }, [stopWake]);

    // Start/stop based on alwaysOn flag
    useEffect(() => {
        if (alwaysOn && enabled) startWake();
        else stopWake();
        return () => { clearTimeout(restartT.current); };
    }, [alwaysOn, enabled]);

    // Cleanup on unmount
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; stopWake(); }; }, []);

    // Keep audio context alive on mobile (prevents browser from killing recognition)
    useEffect(() => {
        if (!alwaysOn) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0; // silent
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start();
        return () => { try { osc.stop(); ctx.close(); } catch (_) { } };
    }, [alwaysOn]);

    return { alwaysOn, wakeStatus, toggleAlwaysOn };
}