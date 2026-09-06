"use client";

import { motion } from "framer-motion";

export type TutorState = "idle" | "listening" | "thinking" | "speaking" | "error";

const LABELS: Record<TutorState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Needs attention",
};

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 4,
  duration: 3 + Math.random() * 4,
}));

export default function ArmoredTutorHero({ state }: { state: TutorState }) {
  const active = state === "listening" || state === "speaking";
  const thinking = state === "thinking";

  return (
    <section
      className={`helmet-stage helmet-${state}`}
      aria-label={`EDU-ORB tutor is ${LABELS[state].toLowerCase()}`}
    >
      {/* Starfield layers */}
      <div className="helmet-stars" aria-hidden="true" />
      <div className="helmet-nebula" aria-hidden="true" />

      {/* Floating particles */}
      <div className="helmet-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="helmet-particle"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{
              y: [0, -30 - Math.random() * 20, 0],
              x: [0, (Math.random() - 0.5) * 20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Energy rings */}
      <motion.div
        className="helmet-ring helmet-ring-1"
        animate={{ rotate: 360, scale: active ? [1, 1.1, 1] : 1 }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        aria-hidden="true"
      />
      <motion.div
        className="helmet-ring helmet-ring-2"
        animate={{ rotate: -360, scale: thinking ? [0.95, 1.05, 0.95] : 1 }}
        transition={{ rotate: { duration: 30, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}
        aria-hidden="true"
      />

      {/* Main aura glow */}
      <motion.div
        className="helmet-aura"
        animate={{
          scale: active ? [0.92, 1.12, 0.92] : thinking ? [0.96, 1.04, 0.96] : [0.98, 1.02, 0.98],
          opacity: active ? [0.6, 1, 0.6] : thinking ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: active ? 0.8 : thinking ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Helmet shell */}
      <motion.div
        className="helmet-shell"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="helmet-crown" />
        <div className="helmet-face">
          <motion.div
            className="helmet-eye helmet-eye-left"
            animate={active ? { boxShadow: ["0 0 15px #6dafeb", "0 0 35px #6dafeb, 0 0 60px #6dafeb", "0 0 15px #6dafeb"] } : thinking ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: active ? 1 : 1.5, repeat: Infinity }}
          />
          <motion.div
            className="helmet-eye helmet-eye-right"
            animate={active ? { boxShadow: ["0 0 15px #6dafeb", "0 0 35px #6dafeb, 0 0 60px #6dafeb", "0 0 15px #6dafeb"] } : thinking ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: active ? 1 : 1.5, repeat: Infinity }}
          />
          <div className="helmet-cheek helmet-cheek-left" />
          <div className="helmet-cheek helmet-cheek-right" />
          <div className="helmet-mouth" />
        </div>
        <div className="helmet-jaw" />

        {/* Energy lines on helmet */}
        <svg className="helmet-energy-lines" viewBox="0 0 200 280" aria-hidden="true">
          <motion.path
            d="M100 20 L100 60"
            stroke="#6dafeb"
            strokeWidth="1"
            fill="none"
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.path
            d="M60 80 L40 140"
            stroke="#6dafeb"
            strokeWidth="0.8"
            fill="none"
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.path
            d="M140 80 L160 140"
            stroke="#6dafeb"
            strokeWidth="0.8"
            fill="none"
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
          />
        </svg>
      </motion.div>

      {/* Status label */}
      <motion.div
        className="helmet-status"
        key={state}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className={`helmet-status-dot ${active ? "bg-[#6dafeb]" : thinking ? "bg-[#f5a623]" : state === "error" ? "bg-[#ef4444]" : "bg-[#34d399]"}`}
          animate={active ? { scale: [1, 1.4, 1] } : thinking ? { opacity: [0.4, 1, 0.4] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        {LABELS[state]}
      </motion.div>
    </section>
  );
}
