import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0e14",
          900: "#0f1520",
          800: "#161e2d",
          700: "#1f2937",
          600: "#2b3648",
        },
        brass: {
          400: "#e9c46a",
          500: "#d4a843",
          600: "#b5872c",
        },
        signal: {
          green: "#3ddc84",
          amber: "#f4a261",
          red: "#ef5350",
          blue: "#5aa9e6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 10px 40px -12px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(212,168,67,0.25), 0 8px 30px -8px rgba(212,168,67,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
