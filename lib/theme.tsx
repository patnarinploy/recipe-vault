"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "system" | "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
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
  // Read localStorage synchronously so the initial state matches THEME_SCRIPT's output.
  // Avoids the double-render (system → stored) that caused a flash.
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(t: Theme) {
      const dark = t === "dark" || (t === "system" && mq.matches);
      root.classList.toggle("dark", dark);
      setResolved(dark ? "dark" : "light");
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
    <Ctx.Provider value={{ theme, setTheme: setThemeState, resolved }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
