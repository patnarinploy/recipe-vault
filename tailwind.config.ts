import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "Thonburi", "IBM Plex Sans Thai", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
