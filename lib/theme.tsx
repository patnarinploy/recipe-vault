"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Theme = "system" | "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme, origin?: { x: number; y: number }) => void;
  resolved: "light" | "dark";
};

const Ctx = createContext<ThemeCtx>({ theme: "system", setTheme: () => {}, resolved: "light" });

// Runs before first paint to set .dark on <html> without flash.
// Exported so layout.tsx can embed it as an inline <script>.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("rv_theme")||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("rv_theme") as Theme | null;
  return (stored === "system" || stored === "light" || stored === "dark") ? stored : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const isFirstRun = useRef(true);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  // Wrap state setter so callers can optionally pass the click origin for the
  // view-transition circle, without changing the hook's external signature shape.
  const setTheme = useCallback((t: Theme, origin?: { x: number; y: number }) => {
    if (origin) originRef.current = origin;
    setThemeState(t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function applyDark(dark: boolean) {
      root.classList.toggle("dark", dark);
      setResolved(dark ? "dark" : "light");
    }

    function apply(t: Theme) {
      const dark = t === "dark" || (t === "system" && mq.matches);
      // Skip transition on first mount — avoid flash on page load
      if (!isFirstRun.current && typeof document.startViewTransition === "function") {
        const origin = originRef.current;
        if (origin) {
          root.style.setProperty("--vt-x", `${origin.x}px`);
          root.style.setProperty("--vt-y", `${origin.y}px`);
          originRef.current = null;
        } else {
          // No explicit origin — clear vars so CSS fallback takes over
          root.style.removeProperty("--vt-x");
          root.style.removeProperty("--vt-y");
        }
        document.startViewTransition(() => applyDark(dark));
      } else {
        applyDark(dark);
      }
      isFirstRun.current = false;
    }

    apply(theme);
    localStorage.setItem("rv_theme", theme);

    if (theme === "system") {
      const handler = () => apply("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
