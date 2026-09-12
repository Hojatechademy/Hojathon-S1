import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 50: "#effaf8", 600: "#0f766e", 700: "#115e59" } } } },
  plugins: [],
};
export default config;
