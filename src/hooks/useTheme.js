import { useState, useEffect } from "react";

const STORAGE_KEY = "suzu_theme";

export default function useTheme() {
    const [theme, setThemeState] = useState(
        () => localStorage.getItem(STORAGE_KEY) || "dark"
    );

    const applyTheme = (t) => {
        const root = document.documentElement;
        if (t === "system") {
            const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.setAttribute("data-theme", systemDark ? "dark" : "light");
        } else {
            root.setAttribute("data-theme", t);
        }
        root.setAttribute("data-theme-setting", t);
    };

    useEffect(() => {
        applyTheme(theme);

        // Listen for system theme changes
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            if (theme === "system") applyTheme("system");
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = (t) => {
        setThemeState(t);
        localStorage.setItem(STORAGE_KEY, t);
        applyTheme(t);
    };

    const isDark = () => {
        if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
        return theme === "dark";
    };

    return { theme, setTheme, isDark };
}