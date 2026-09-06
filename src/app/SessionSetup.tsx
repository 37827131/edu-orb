"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

// ── Data ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "voice",    label: "Voice Command",  icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3" },
  { id: "upload",   label: "Upload Image",   icon: "M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
  { id: "schedule", label: "My Schedule",    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { id: "progress", label: "Progress Report", icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" },
  { id: "syllabus", label: "Syllabus",       icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const SEED_MESSAGES = [
  { role: "user" as const, text: "Explain the Pythagoras theorem with a diagram." },
  { role: "bot" as const,  text: "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. Mathematically: a\u00B2 + b\u00B2 = c\u00B2." },
  { role: "user" as const, text: "Can you show me a real-world example?" },
  { role: "bot" as const,  text: "Imagine a ladder leaning against a wall. The wall and ground form a right angle. If the ladder is 5 m long (hypotenuse) and the base is 3 m from the wall, the height it reaches is \u221A(5\u00B2\u22123\u00B2) = 4 m." },
];

const SCHEDULE = [
  { time: "09:00", subject: "Mathematics", topic: "Polynomials", done: true },
  { time: "10:30", subject: "Physics", topic: "Motion & Force", done: true },
  { time: "12:00", subject: "Chemistry", topic: "Atoms & Molecules", active: true },
  { time: "14:00", subject: "English", topic: "The Fun They Had" },
  { time: "15:30", subject: "Biology", topic: "Cell Structure" },
];

const SUBJECTS = [
  { name: "Mathematics", pct: 92, color: "#00d4ff" },
  { name: "Physics", pct: 78, color: "#a855f7" },
  { name: "Chemistry", pct: 65, color: "#22d3ee" },
  { name: "English", pct: 88, color: "#00d4ff" },
  { name: "Biology", pct: 71, color: "#a855f7" },
];

const CHAPTERS = [
  { title: "Number Systems", status: "done" },
  { title: "Polynomials", status: "done" },
  { title: "Coordinate Geometry", status: "done" },
  { title: "Linear Equations", status: "active" },
  { title: "Euclid's Geometry", status: "locked" },
  { title: "Lines and Angles", status: "locked" },
  { title: "Triangles", status: "locked" },
  { title: "Quadrilaterals", status: "locked" },
];

// ── Helpers ─────────────────────────────────────────────────────

function stripThink(raw: string): string {
  // 1. Strip complete think blocks
  let s = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, "");
  // 2. Strip incomplete think blocks (closing tag hasn't arrived yet)
  s = s.replace(/<think>[\s\S]*$/, "");
  // 3. Strip partial think tags at the start (<think> split across chunks)
  s = s.replace(/^<\/?t?h?i?n?k?/, "");
  // 4. Strip partial </think> remnants at the start
  s = s.replace(/^<\/think>/, "");
  return s.trim();
}

// ── Stars ───────────────────────────────────────────────────────

function Stars() {
  const data = useRef(Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 2, d: 2 + Math.random() * 4, dl: Math.random() * 3,
  }))).current;
  return (
    <div className="starfield">
      {data.map(s => <div key={s.id} className="star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` }} />)}
    </div>
  );
}

// ── Math Diagram ────────────────────────────────────────────────

function MathDiagram() {
  return (
    <div className="math-diagram">
      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
        <line x1="40" y1="90" x2="280" y2="90" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
        <line x1="40" y1="90" x2="40" y2="10" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
        <polygon points="37,14 40,6 43,14" fill="rgba(0,212,255,0.3)" />
        <polygon points="276,87 284,90 276,93" fill="rgba(0,212,255,0.3)" />
        <path d="M 60 80 Q 100 20, 160 45 T 260 15" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="90" cy="58" r="4" fill="var(--primary)" opacity="0.9" />
        <text x="96" y="55" fill="var(--primary)" fontSize="10" fontFamily="Orbitron">A</text>
        <circle cx="170" cy="38" r="4" fill="#a855f7" opacity="0.9" />
        <text x="176" y="35" fill="#a855f7" fontSize="10" fontFamily="Orbitron">B</text>
        <circle cx="240" cy="22" r="4" fill="#22d3ee" opacity="0.9" />
        <text x="246" y="19" fill="#22d3ee" fontSize="10" fontFamily="Orbitron">C</text>
      </svg>
    </div>
  );
}

// ── Face — Iron Man / JARVIS Helmet Aesthetic ───────────────────

function FuturisticFace({ isListening }: { isListening: boolean }) {
  const c = isListening ? "#00ffcc" : "#00d4ff";
  const o = isListening ? 1 : 0.85;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowSm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowLg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor={c} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity="0.12" />
          <stop offset="100%" stopColor={c} stopOpacity="0.03" />
        </linearGradient>
        <radialGradient id="eyeCore" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="40%" stopColor={c} stopOpacity="0.8" />
          <stop offset="100%" stopColor={c} stopOpacity="0.2" />
        </radialGradient>
        <clipPath id="helmetClip">
          <path d="M100 28 C130 28 150 42 158 62 C162 72 160 85 155 95 L152 105 C148 118 140 128 130 135 L120 140 C112 143 105 145 100 145 C95 145 88 143 80 140 L70 135 C60 128 52 118 48 105 L45 95 C40 85 38 72 42 62 C50 42 70 28 100 28 Z" />
        </clipPath>
      </defs>

      {/* ── Helmet outline — angular faceplate ── */}
      <path d="M100 30 L138 45 L156 72 L158 95 L150 115 L135 132 L115 142 L100 145 L85 142 L65 132 L50 115 L42 95 L44 72 L62 45 Z"
        fill="url(#helmetGrad)" stroke={c} strokeWidth="0.8" opacity="0.2" />

      {/* ── Helmet side panels (cheek guards) ── */}
      <path d="M55 65 L44 72 L42 95 L45 108 L52 118 L62 128" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />
      <path d="M145 65 L156 72 L158 95 L155 108 L148 118 L138 128" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />

      {/* ── Forehead — angular plate seams ── */}
      <path d="M68 50 L100 38 L132 50" fill="none" stroke={c} strokeWidth="0.7" opacity="0.25" />
      <path d="M72 54 L100 44 L128 54" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />
      <path d="M76 58 L100 48 L124 58" fill="none" stroke={c} strokeWidth="0.3" opacity="0.08" />

      {/* ── Forehead center sensor ── */}
      <line x1="100" y1="48" x2="100" y2="38" stroke={c} strokeWidth="0.8" opacity="0.35" />
      <circle cx="100" cy="36" r="3" fill="none" stroke={c} strokeWidth="0.6" opacity="0.4" />
      <circle cx="100" cy="36" r="1.2" fill={c} opacity={isListening ? 0.9 : 0.5} filter="url(#glowSm)" />

      {/* ── LEFT EYE — JARVIS visor slit ── */}
      {/* Outer housing */}
      <path d="M58 78 L70 72 L96 72 L102 80 L102 92 L96 100 L70 100 L58 92 Z"
        fill={c} opacity={o * 0.15} />
      {/* Visor shape — angular trapezoid */}
      <path d="M62 80 L72 75 L94 75 L100 80 L100 92 L94 97 L72 97 L62 92 Z"
        fill="url(#visorGrad)" opacity={o * 0.7} filter="url(#glow)" />
      {/* Inner bright core */}
      <path d="M68 83 L74 79 L90 79 L94 83 L94 89 L90 93 L74 93 L68 89 Z"
        fill="url(#eyeCore)" opacity={o} filter="url(#glowLg)" />
      {/* Horizontal scan line */}
      <line x1="64" y1="86" x2="96" y2="86" stroke="#fff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      {/* Inner highlight */}
      <line x1="70" y1="84" x2="92" y2="84" stroke="#fff" strokeWidth="0.6" opacity="0.25" strokeLinecap="round" />

      {/* ── RIGHT EYE — JARVIS visor slit ── */}
      <path d="M142 78 L130 72 L104 72 L98 80 L98 92 L104 100 L130 100 L142 92 Z"
        fill={c} opacity={o * 0.15} />
      <path d="M138 80 L128 75 L106 75 L100 80 L100 92 L106 97 L128 97 L138 92 Z"
        fill="url(#visorGrad)" opacity={o * 0.7} filter="url(#glow)" />
      <path d="M132 83 L126 79 L110 79 L106 83 L106 89 L110 93 L126 93 L132 89 Z"
        fill="url(#eyeCore)" opacity={o} filter="url(#glowLg)" />
      <line x1="104" y1="86" x2="136" y2="86" stroke="#fff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      <line x1="108" y1="84" x2="130" y2="84" stroke="#fff" strokeWidth="0.6" opacity="0.25" strokeLinecap="round" />

      {/* ── Nose bridge — angular seam ── */}
      <path d="M97 92 L100 102 L103 92" fill="none" stroke={c} strokeWidth="0.7" opacity="0.2" />
      <line x1="100" y1="100" x2="100" y2="108" stroke={c} strokeWidth="0.4" opacity="0.12" />

      {/* ── Mouth — segmented horizontal visor ── */}
      {/* Main mouth bar */}
      <path d="M72 116 L80 113 L88 116 L96 113 L100 114 L104 113 L112 116 L120 113 L128 116"
        fill="none" stroke={c} strokeWidth="1.8" opacity={isListening ? 0.8 : 0.45} strokeLinecap="round" />
      {/* Secondary accent line */}
      <path d="M78 119 L86 117 L94 119 L100 117 L106 119 L114 117 L122 119"
        fill="none" stroke={c} strokeWidth="0.6" opacity={isListening ? 0.4 : 0.18} strokeLinecap="round" />
      {/* Mouth segments */}
      <line x1="80" y1="114" x2="80" y2="118" stroke={c} strokeWidth="0.3" opacity="0.15" />
      <line x1="92" y1="113" x2="92" y2="117" stroke={c} strokeWidth="0.3" opacity="0.15" />
      <line x1="100" y1="114" x2="100" y2="118" stroke={c} strokeWidth="0.3" opacity="0.15" />
      <line x1="108" y1="113" x2="108" y2="117" stroke={c} strokeWidth="0.3" opacity="0.15" />
      <line x1="120" y1="114" x2="120" y2="118" stroke={c} strokeWidth="0.3" opacity="0.15" />

      {/* ── Jaw / chin plate ── */}
      <path d="M65 128 L80 138 L100 143 L120 138 L135 128" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />
      <path d="M75 132 L100 140 L125 132" fill="none" stroke={c} strokeWidth="0.3" opacity="0.1" />
      <circle cx="100" cy="141" r="1.5" fill={c} opacity="0.2" />

      {/* ── Cheek circuit traces ── */}
      {/* Left cheek */}
      <line x1="58" y1="80" x2="50" y2="76" stroke={c} strokeWidth="0.4" opacity="0.18" />
      <line x1="50" y1="76" x2="46" y2="80" stroke={c} strokeWidth="0.3" opacity="0.12" />
      <line x1="46" y1="80" x2="46" y2="88" stroke={c} strokeWidth="0.3" opacity="0.1" />
      <circle cx="46" cy="76" r="1" fill={c} opacity="0.2" />
      {/* Right cheek */}
      <line x1="142" y1="80" x2="150" y2="76" stroke={c} strokeWidth="0.4" opacity="0.18" />
      <line x1="150" y1="76" x2="154" y2="80" stroke={c} strokeWidth="0.3" opacity="0.12" />
      <line x1="154" y1="80" x2="154" y2="88" stroke={c} strokeWidth="0.3" opacity="0.1" />
      <circle cx="154" cy="76" r="1" fill={c} opacity="0.2" />

      {/* ── Temple / side dots (data ports) ── */}
      <circle cx="50" cy="68" r="1.2" fill={c} opacity="0.2" />
      <circle cx="150" cy="68" r="1.2" fill={c} opacity="0.2" />
      <circle cx="48" cy="100" r="1" fill={c} opacity="0.15" />
      <circle cx="152" cy="100" r="1" fill={c} opacity="0.15" />
      <circle cx="52" cy="115" r="0.8" fill={c} opacity="0.12" />
      <circle cx="148" cy="115" r="0.8" fill={c} opacity="0.12" />

      {/* ── Inner helmet panel lines ── */}
      <path d="M55 62 L62 50 L68 55" fill="none" stroke={c} strokeWidth="0.3" opacity="0.1" />
      <path d="M145 62 L138 50 L132 55" fill="none" stroke={c} strokeWidth="0.3" opacity="0.1" />

      {/* ── Subtle hex pattern overlay (very faint) ── */}
      {[70, 85, 100, 115, 130].map((y) => (
        <line key={y} x1="55" y1={y} x2="145" y2={y} stroke={c} strokeWidth="0.15" opacity="0.04" />
      ))}
    </svg>
  );
}

// ── Orb ─────────────────────────────────────────────────────────

function OrbHero({ isListening }: { isListening: boolean }) {
  return (
    <div className="orb-wrapper">
      <div className="orb-glow" />
      <div className="orb-ring" />
      <div className="orb-ring orb-ring--2" />
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="orb-particle" style={{
          left: `${40 + Math.random() * 20}%`, bottom: `${10 + Math.random() * 20}%`,
          animationDuration: `${3 + Math.random() * 3}s`, animationDelay: `${Math.random() * 4}s`,
          width: 1 + Math.random() * 2, height: 1 + Math.random() * 2,
        }} />
      ))}
      <motion.div className="orb-sphere"
        animate={isListening ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
        <FuturisticFace isListening={isListening} />
      </motion.div>
    </div>
  );
}

// ── Tab Panels ──────────────────────────────────────────────────

function VoicePanel() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "var(--text-bright)", letterSpacing: 2 }}>Voice Command</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--text)", opacity: 0.5, textAlign: "center" }}>
        Click the button or say &ldquo;Hey EduOrb&rdquo;
      </div>
      <div className="p-3 rounded-lg w-full" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4, marginBottom: 6 }}>Try saying:</div>
        {["Explain quadratic equations", "Quiz me on trigonometry", "Show me a diagram"].map((c, i) => (
          <div key={i} className="px-2 py-1 rounded mb-1" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--primary)", opacity: 0.6, background: "rgba(0,212,255,0.04)" }}>
            &ldquo;{c}&rdquo;
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadPanel() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
          <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "var(--text-bright)", letterSpacing: 2 }}>Upload Image</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--text)", opacity: 0.5, textAlign: "center" }}>
        Upload a math problem photo — EduOrb solves it
      </div>
      <button className="px-5 py-2 rounded-lg text-xs transition-all" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
        Choose File
      </button>
      <div className="p-2 rounded-lg w-full text-center" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#c084fc", opacity: 0.6 }}>JPG, PNG, WEBP &mdash; Max 10MB</span>
      </div>
    </div>
  );
}

function SchedulePanel() {
  return (
    <div className="flex flex-col gap-2">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>Today&apos;s Schedule</h3>
      {SCHEDULE.map((s, i) => (
        <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${s.done ? "opacity-45" : s.active ? "ring-1 ring-cyan-400/30 bg-cyan-400/5" : ""}`}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--primary)", minWidth: 40 }}>{s.time}</span>
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "var(--text-bright)", fontWeight: 600 }}>{s.subject}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4 }}>{s.topic}</div>
          </div>
          {s.done && <span style={{ fontSize: 10, color: "#22c55e" }}>✓</span>}
          {s.active && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
        </div>
      ))}
    </div>
  );
}

function ProgressPanel() {
  const avg = Math.round(SUBJECTS.reduce((a, b) => a + b.pct, 0) / SUBJECTS.length);
  return (
    <div className="flex flex-col gap-3">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>Progress Report</h3>
      {SUBJECTS.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "var(--text-bright)" }}>{s.name}</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: s.color }}>{s.pct}%</span>
          </div>
          <div className="progress-track" style={{ width: "100%" }}><div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
        </div>
      ))}
      <div className="p-3 rounded-lg mt-1" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4 }}>Overall Average</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, color: "var(--primary)" }}>{avg}%</div>
      </div>
    </div>
  );
}

function SyllabusPanel() {
  return (
    <div className="flex flex-col gap-1">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>CBSE Class 9 — Mathematics</h3>
      {CHAPTERS.map((ch, i) => (
        <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${ch.status === "locked" ? "opacity-35" : ""}`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] shrink-0 ${
            ch.status === "done" ? "bg-green-500/20 text-green-400" : ch.status === "active" ? "bg-cyan-400/20 text-cyan-400" : "bg-gray-600/20 text-gray-500"
          }`}>
            {ch.status === "done" ? "✓" : ch.status === "active" ? "▶" : "🔒"}
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "var(--text-bright)", fontWeight: 600 }}>Ch {i + 1}: {ch.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelForTab({ tab }: { tab: string }) {
  switch (tab) {
    case "voice": return <VoicePanel />;
    case "upload": return <UploadPanel />;
    case "schedule": return <SchedulePanel />;
    case "progress": return <ProgressPanel />;
    case "syllabus": return <SyllabusPanel />;
    default: return null;
  }
}

// ── Main ────────────────────────────────────────────────────────

type Msg = { id: string; role: "user" | "bot"; text: string };

export default function SessionSetup() {
  const [activeTab, setActiveTab] = useState("voice");
  const [input, setInput] = useState("");
  const [providerInfo, setProviderInfo] = useState("");
  const [messages, setMessages] = useState<Msg[]>(
    SEED_MESSAGES.map((m, i) => ({ id: String(i), ...m }))
  );
  const [isListening, setIsListening] = useState(false);
  const [progress] = useState(92);
  const [showChat, setShowChat] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async () => {
    const txt = input.trim();
    if (!txt) return;
    const botId = crypto.randomUUID();
    const next: Msg[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", text: txt },
      { id: botId, role: "bot", text: "" },
    ];
    setMessages(next);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role === "bot" ? "assistant" : m.role, content: m.text })) }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no body");
      const dec = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            if (p.providers) setProviderInfo(p.providers);
            if (p.delta) {
              raw += p.delta;
              const clean = stripThink(raw);
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: clean } : m));
            }
          } catch {}
        }
      }
      if (!stripThink(raw)) {
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: stripThink(raw) || "No response." } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: "AI unavailable. Please try again." } : m));
    }
  }, [input, messages]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Chat panel (shared across layouts) ──
  const chatPanel = (
    <>
      <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 1 }}>EduOrb – AI Tutor</div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--primary)", opacity: 0.5, marginTop: 1 }}>{providerInfo || "NCERT · Online"}</div>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "var(--primary)", letterSpacing: 1 }}>Class 9 CBSE</div>
          <div className="progress-track mt-1" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`chat-bubble ${m.role === "user" ? "chat-bubble--user" : "chat-bubble--bot"}`}>
              {m.text || <span className="inline-block w-1.5 h-4 bg-cyan-400/50 animate-pulse rounded-sm" />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-4 pb-2 shrink-0"><MathDiagram /></div>
      <div className="px-4 py-2 shrink-0" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder="Ask EduOrb anything..." className="chat-input flex-1" />
          <button onClick={send} disabled={!input.trim()} className="px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
              background: input.trim() ? "rgba(0,212,255,0.15)" : "transparent",
              border: `1px solid ${input.trim() ? "rgba(0,212,255,0.4)" : "var(--glass-border)"}`,
              color: input.trim() ? "var(--primary)" : "rgba(200,214,229,0.3)", cursor: input.trim() ? "pointer" : "not-allowed" }}>
            Send
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="cosmos" /><Stars />
      <div className="nebula-glow nebula-glow--purple" />
      <div className="nebula-glow nebula-glow--blue" />
      <div className="nebula-glow nebula-glow--cyan" />

      {/* ══ DESKTOP lg+ ══ */}
      <div className="relative z-10 hidden lg:flex h-full p-3 gap-3">
        {/* Sidebar */}
        <aside className="glass w-56 flex flex-col shrink-0 p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>EduOrb</span>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => setActiveTab(n.id)} className={`nav-item ${activeTab === n.id ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d={n.icon} /></svg>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <button className="mt-auto flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
            Parent Connect
          </button>
        </aside>

        {/* Center: Orb + tab panel */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto">
          <div className="flex flex-col items-center pt-6 shrink-0">
            <motion.div initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
              <OrbHero isListening={isListening} />
            </motion.div>
            <h1 className="mt-5" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: 5, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 3, color: "var(--primary)", opacity: 0.6, marginTop: 6 }}>Speak to EduOrb</span>
            <button className={`voice-btn mt-5 ${isListening ? "active" : ""}`} onClick={() => setIsListening(!isListening)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : "Voice Command"}
            </button>
          </div>
          {/* Tab panel below orb */}
          <div className="w-full max-w-sm px-4 mt-4 mb-6 glass rounded-xl p-4 shrink-0">
            <PanelForTab tab={activeTab} />
          </div>
        </main>

        {/* Right: Chat — always */}
        <aside className="glass w-80 flex flex-col shrink-0">{chatPanel}</aside>
      </div>

      {/* ══ TABLET md ══ */}
      <div className="relative z-10 hidden md:flex lg:hidden flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 glass shrink-0" style={{ borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>EduOrb</span>
          </div>
          <div className="flex gap-0.5">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => setActiveTab(n.id)} className={`p-1.5 rounded-lg transition-all ${activeTab === n.id ? "text-cyan-400 bg-cyan-400/10" : "text-gray-500"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={n.icon} /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col items-center justify-center p-3">
            <OrbHero isListening={isListening} />
            <h1 className="mt-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: 3, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
          </main>
          <aside className="w-72 flex flex-col border-l glass shrink-0 overflow-hidden" style={{ borderRadius: 0, borderColor: "var(--glass-border)" }}>
            {chatPanel}
          </aside>
        </div>
      </div>

      {/* ══ MOBILE < md ══ */}
      <div className="relative z-10 flex md:hidden flex-col h-full pb-12">
        <div className="flex items-center justify-between px-3 py-2 glass shrink-0" style={{ borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>EduOrb</span>
          </div>
          <button onClick={() => setShowChat(!showChat)} className="px-2 py-1 rounded-lg text-[10px]" style={{ fontFamily: "'Orbitron', sans-serif", border: "1px solid rgba(0,212,255,0.3)", color: "var(--primary)", background: "rgba(0,212,255,0.08)" }}>
            {showChat ? "Orb" : "Chat"}
          </button>
        </div>

        {!showChat ? (
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            <OrbHero isListening={isListening} />
            <h1 className="mt-4" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: 3, color: "var(--primary)", opacity: 0.6, marginTop: 4 }}>Speak to EduOrb</span>
            <button className={`voice-btn mt-4 text-xs ${isListening ? "active" : ""}`} onClick={() => setIsListening(!isListening)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : "Voice Command"}
            </button>
          </main>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">{chatPanel}</div>
        )}

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-1.5 px-1 glass" style={{ borderTop: "1px solid var(--glass-border)", borderRadius: 0 }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => { setActiveTab(n.id); setShowChat(true); }}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-lg ${activeTab === n.id ? "text-cyan-400" : "text-gray-500"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={n.icon} /></svg>
              <span className="text-[7px] tracking-wider">{n.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
