import { useState, useCallback } from "react";
import translations from "../translations";

const STORAGE_KEY = "suzu_lang";

export default function useLanguage() {
    const [lang, setLangState] = useState(
        () => localStorage.getItem(STORAGE_KEY) || "en"
    );

    const setLang = useCallback((l) => {
        setLangState(l);
        localStorage.setItem(STORAGE_KEY, l);
    }, []);

    // Translation function - returns string for a key
    const t = useCallback((key) => {
        return translations[lang]?.[key] || translations.en?.[key] || key;
    }, [lang]);

    // Get wake responses as array
    const getWakeResponses = useCallback(() => {
        return [1, 2, 3, 4, 5, 6].map(i => t(`wake.${i}`));
    }, [t]);

    const randomWake = useCallback(() => {
        const responses = getWakeResponses();
        return responses[Math.floor(Math.random() * responses.length)];
    }, [getWakeResponses]);

    return { lang, setLang, t, randomWake };
}