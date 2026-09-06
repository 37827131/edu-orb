"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ── Orb states ─────────────────────────────────────────────────

type OrbState = "idle" | "listening" | "speaking" | "thinking" | "error";

interface OrbAvatarProps {
  state?: OrbState;
  size?: number;
  className?: string;
  onStateChange?: (state: OrbState) => void;
}

// Orb color palette — shifts based on state
const ORB_COLORS = {
  idle: { core: "#7C3AED", glow: "rgba(124,58,237,0.3)", ring: "#7C3AED" },
  listening: { core: "#22D3EE", glow: "rgba(34,211,238,0.4)", ring: "#22D3EE" },
  speaking: { core: "#3B82F6", glow: "rgba(59,130,246,0.4)", ring: "#3B82F6" },
  thinking: { core: "#8B5CF6", glow: "rgba(139,92,246,0.4)", ring: "#8B5CF6" },
  error: { core: "#EF4444", glow: "rgba(239,68,68,0.3)", ring: "#EF4444" },
};

// ── Orb Avatar Component ───────────────────────────────────────

const OrbAvatar = ({
  state = "idle",
  size = 120,
  className = "",
  onStateChange,
}: OrbAvatarProps) => {
  const [pulsePhase, setPulsePhase] = useState(0);
  const radius = size / 2;

  // Pulse animation — subtle breathing in idle, faster in active states
  useEffect(() => {
    const duration =
      state === "idle" ? 4000 : state === "speaking" ? 800 : 2000;
    let phase = 0;
    let raf: number;

    const tick = () => {
      phase = (phase + 1) % 100;
      setPulsePhase(phase);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const colors = ORB_COLORS[state] ?? ORB_COLORS.idle;

  // Inner glow opacity — breathes with pulse
  const glowOpacity = 0.3 + 0.2 * Math.sin((pulsePhase / 100) * Math.PI * 2);

  // Ring ripple — when speaking, rings expand outward
  const ringScale = state === "speaking" ? 1 + 0.15 * Math.sin((pulsePhase / 100) * Math.PI * 2) : 1;
  const ringOpacity = state === "speaking" ? 0.4 + 0.3 * Math.sin((pulsePhase / 100) * Math.PI * 2) : 0.2;

  // Listening pulse — sharp throb
  const listenPulse = state === "listening" ? 0.6 + 0.4 * Math.sin((pulsePhase / 100) * Math.PI * 4) : 0;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`EDU-ORB avatar — ${state}`}
    >
      {/* Outer ambient glow — always present, breathes */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            `radial-gradient(circle, ${colors.glow} ${glowOpacity} 0%, transparent 70%)`,
          opacity: 0.7 + 0.3 * glowOpacity,
        }}
        animate={{
          scale: [
            0.95,
            1.05,
            0.95,
          ],
          opacity: [
            0.6,
            1,
            0.6,
          ],
        }}
        transition={{
          duration: state === "idle" ? 4 : state === "speaking" ? 1 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ring ripple (speaking state) */}
      <AnimatePresence>
        {state === "speaking" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: colors.ring,
              opacity: ringOpacity,
              transform: `scale(${ringScale})`,
            }}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{
              scale: 2.2,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </AnimatePresence>

      {/* Ring ripple (listening state) */}
      <AnimatePresence>
        {state === "listening" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: colors.ring,
              opacity: 0.3,
            }}
            initial={{ scale: 0.9 }}
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </AnimatePresence>

      {/* Throb indicator (listening) */}
      {state === "listening" && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow} ${listenPulse} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main orb body */}
      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center"
        style={{
          width: radius,
          height: radius,
          background:
            `radial-gradient(circle at 35% 30%, ${colors.core}dd 0%, ${colors.core}88 40%, ${colors.core}44 100%)`,
          boxShadow: `0 0 ${20 + 10 * glowOpacity}px ${colors.glow}, 0 0 ${40 + 20 * glowOpacity}px ${colors.glow}`,
        }}
        animate={{
          scale: [
            1,
            1 + 0.03 * Math.sin((pulsePhase / 100) * Math.PI * 2),
            1,
          ],
          boxShadow: [
            `0 0 20px ${colors.glow}`,
            `0 0 40px ${colors.glow}`,
            `0 0 20px ${colors.glow}`,
          ],
        }}          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
      >
        {/* Inner highlight (glassy shine) */}
        <div
          className="absolute top-1/4 left-1/3 rounded-full"
          style={{
            width: radius * 0.35,
            height: radius * 0.2,
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)",
            transform: "rotate(-20deg)",
          }}
        />

        {/* Status icon */}
        <div className="relative z-20 text-white text-lg" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))" }}>
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -8 }}
                className="flex items-center justify-center w-full h-full"
              >
                <svg
                  width={radius * 0.5}
                  height={radius * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                </svg>
              </motion.div>
            )}

            {state === "listening" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -8 }}
                className="flex items-center justify-center w-full h-full"
              >
                <svg
                  width={radius * 0.5}
                  height={radius * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-pulse"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </motion.div>
            )}

            {state === "speaking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -8 }}
                className="flex items-center justify-center w-full h-full"
              >
                <svg
                  width={radius * 0.5}
                  height={radius * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="8" y1="17" x2="8.5" y2="21" />
                  <line x1="16" y1="17" x2="15.5" y2="21" />
                  <line x1="12" y1="18" x2="12" y2="23" />
                </svg>
              </motion.div>
            )}

            {state === "thinking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -8 }}
                className="flex items-center justify-center w-full h-full"
              >
                <svg
                  width={radius * 0.5}
                  height={radius * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.5 9.5 15 15" />
                  <path d="m15 9.5-5.5 5.5" />
                </svg>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -8 }}
                className="flex items-center justify-center w-full h-full"
              >
                <svg
                  width={radius * 0.5}
                  height={radius * 0.5}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-pulse"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Color shift animation — orb shimmers slightly */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)",
          }}
          animate={{
            background: [
              "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Floating particles (ambient) */}
      <div className="absolute inset-0 pointer-events-none">
        <Particle particleCount={3} colors={colors} />
      </div>
    </div>
  );
};

// ── Ambient particles ──────────────────────────────────────────

type OrbColorSet = {
  core: string;
  glow: string;
  ring: string;
};

const Particle = ({
  particleCount,
  colors,
}: {
  particleCount: number;
  colors: OrbColorSet;
}) => {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + i,
            height: 3 + i,
            background: colors.core,
            opacity: 0.3,
            left: `${30 + i * 20}%`,
            top: `${40 + i * 15}%`,
          }}
          animate={{
            y: [
              0,
              -8 - i * 2,
              0,
            ],
            opacity: [
              0.1,
              0.4 + i * 0.1,
              0.1,
            ],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default OrbAvatar;
