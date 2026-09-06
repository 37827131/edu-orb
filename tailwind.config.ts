import type { Config } from "tailwindcss";

/**
 * EDU-ORB design system — dark "deep space" theme.
 * Palette + animations carried over from the original CRA tailwind config.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "eo-bg": "#060a14",
        "eo-deep": "#04091c",
        "eo-shell": "#0a0e19",
        "eo-surface": "#0d1225",
        "eo-card": "#10182e",
        "eo-card-hov": "#152561",
        "eo-border": "#1a213b",
        "eo-border-glow": "#2a3550",
        "eo-orb": "#6dafeb",
        "eo-cyan": "#6dafeb",
        "eo-blue": "#326dd1",
        "eo-indigo": "#485393",
        "eo-purple": "#235ca3",
        "eo-amber": "#f5a623",
        "eo-red": "#ef4444",
        "eo-green": "#34d399",
        "eo-pink": "#f472b6",
        "eo-rose": "#f43f5e",
        "eo-text": "#e8ecf1",
        "eo-muted": "#7a8ba8",
        "eo-white": "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 14s linear infinite",
        "spin-slower": "spin 18s linear infinite reverse",
        "spin-fast": "spin 5s linear infinite",
        "spin-medium": "spin 10s linear infinite",
        float: "float 4s ease infinite",
        "orb-glow": "orbGlow 1.5s ease infinite",
        "orb-pulse": "orbPulse 3s ease infinite",
        "ring-expand": "ringExpand 1s ease infinite",
        "pulse-dot": "pulse 1s ease infinite",
        wave: "wave 0.6s ease infinite",
        "slide-in": "slideIn 0.25s ease both",
        "fade-up": "fadeUp 0.3s ease both",
        "glow-pulse": "glowPulse 2s ease infinite",
        drift: "drift 6s ease infinite",
        breathe: "breathe 4s ease infinite",
        vibrate: "vibrate 0.15s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        orbGlow: {
          "0%, 100%": {
            boxShadow:
              "0 0 40px rgba(34,211,238,0.2), 0 0 80px rgba(34,211,238,0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 80px rgba(124,58,237,0.5), 0 0 120px rgba(124,58,237,0.5)",
          },
        },
        orbPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        ringExpand: {
          "0%": { transform: "scale(0.85)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-18px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(5px, -8px)" },
          "50%": { transform: "translate(-3px, -12px)" },
          "75%": { transform: "translate(-8px, -4px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        vibrate: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-1px)" },
          "75%": { transform: "translateX(1px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
