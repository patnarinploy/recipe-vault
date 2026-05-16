import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sarabun)", "Thonburi", "Sarabun", "system-ui", "sans-serif"],
      },
      // Semantic design tokens — map to CSS variables in globals.css.
      // Phase 2 will migrate hardcoded stone/white classes to these.
      colors: {
        background: "var(--color-bg)",
        surface:    "var(--color-surface)",
        foreground: "var(--color-fg)",
        "fg-2":     "var(--color-fg-2)",
        muted:      "var(--color-muted)",
        "border-1": "var(--color-border)",
        "border-2": "var(--color-border-2)",
      },
    },
  },
  plugins: [],
};

export default config;
