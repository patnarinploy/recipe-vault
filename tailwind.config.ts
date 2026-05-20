import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sarabun)", "Thonburi", "Sarabun", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--bg)",
        surface:    "var(--surface)",
        elevated:   "var(--elevated)",
        foreground: "var(--fg)",
        secondary:  "var(--fg-2)",
        muted:      "var(--muted)",
        border:     "var(--border)",
        outline:    "var(--outline)",
      },
    },
  },
  plugins: [],
};

export default config;
