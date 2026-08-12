import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c0c0b",
        bone: "#e0dbd1",
        moss: "#889063",
      },
      fontFamily: {
        franie: ["var(--font-franie)", "sans-serif"],
        gcgrind: ["var(--font-gcgrind)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
