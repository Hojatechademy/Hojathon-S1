import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(16, 185, 129, 0.4)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(16, 185, 129, 0.7)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "row-highlight": {
          "0%": { backgroundColor: "rgba(16, 185, 129, 0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "mic-pulse": {
          "0%, 100%": { boxShadow: "0 0 6px 2px rgba(239, 68, 68, 0.4)" },
          "50%": { boxShadow: "0 0 18px 6px rgba(239, 68, 68, 0.7)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "row-highlight": "row-highlight 2s ease-out forwards",
        "mic-pulse": "mic-pulse 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

