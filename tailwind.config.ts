import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effaf8",
          100: "#d7f3ee",
          200: "#b0e5dd",
          300: "#7bd0c3",
          400: "#44b4a4",
          500: "#279788",
          600: "#0f766e",
          700: "#115e59",
          800: "#114b47",
          900: "#133f3c",
          950: "#062423",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(15, 118, 110, 0.08)",
        "card-hover": "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;

