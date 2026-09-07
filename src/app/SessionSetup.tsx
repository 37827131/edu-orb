"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// ── Data ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "voice",    label: "Voice",  icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3" },
  { id: "upload",   label: "Upload",   icon: "M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
  { id: "schedule", label: "Schedule",    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { id: "progress", label: "Progress", icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" },
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
  let s = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, "");
  s = s.replace(/<think>[\s\S]*$/, "");
  s = s.replace(/^<\/?t?h?i?n?k?(?:\s[^>]*)?>?/, "");
  s = s.replace(/^<\/think>/, "");
  return s.trim();
}

// ── Voice Hook (mobile-compatible) ─────────────────────────────

function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);
  const restartCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    // Mobile browsers need these
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      const last = e.results[e.results.length - 1];
      if (!last) return;
      setTranscript(last[0].transcript);
      if (last.isFinal) {
        setIsListening(false);
        restartCountRef.current = 0;
      }
    };

    recognition.onend = () => {
      // On mobile, recognition may end prematurely — restart once if we had a final transcript
      if (isListening && restartCountRef.current < 1 && !transcript) {
        restartCountRef.current++;
        try { recognition.start(); } catch {}
        return;
      }
      setIsListening(false);
      restartCountRef.current = 0;
    };

    recognition.onerror = (e: any) => {
      console.warn("[voice] error:", e.error);
      setError(e.error || "unknown");
      setIsListening(false);
      restartCountRef.current = 0;
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setError("");
    setIsListening(true);
    restartCountRef.current = 0;
    // Small delay to let previous session end on mobile
    setTimeout(() => {
      try { recognitionRef.current?.start(); } catch (e) {
        console.warn("[voice] start failed:", e);
        setIsListening(false);
      }
    }, 100);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
    restartCountRef.current = 0;
  }, []);

  return { isListening, transcript, isSupported, error, startListening, stopListening };
}

// ── TTS Hook ───────────────────────────────────────────────────

function useTTS() {
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk.trim());
      u.lang = "en-US";
      u.rate = 0.95;
      u.pitch = 1.0;
      if (i > 0) u.onstart = () => {};
      window.speechSynthesis.speak(u);
    });
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}

// ── Responsive Orb Size Hook ───────────────────────────────────

function useOrbSize() {
  const [size, setSize] = useState(220);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) setSize(140);
      else if (w < 640) setSize(160);
      else if (w < 768) setSize(180);
      else if (w < 1024) setSize(200);
      else setSize(220);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

// ── Stars ───────────────────────────────────────────────────────

function Stars() {
  const data = useRef(Array.from({ length: 60 }, (_, i) => ({
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

// ── Face — JARVIS Arc Reactor Style ────────────────────────────

function FuturisticFace({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) {
  const c = isListening ? "#00ffcc" : isSpeaking ? "#22d3ee" : "#00d4ff";
  const eyeOp = isListening ? 1 : isSpeaking ? 0.9 : 0.8;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowSm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="eyeGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="30%" stopColor={c} stopOpacity="0.8" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c} stopOpacity="0.08" />
          <stop offset="100%" stopColor={c} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <path d="M100 30 C135 30 158 50 162 80 C164 95 158 112 148 125 L135 135 C122 143 112 148 100 148 C88 148 78 143 65 135 L52 125 C42 112 36 95 38 80 C42 50 65 30 100 30 Z"
        fill="url(#plateGrad)" stroke={c} strokeWidth="0.6" opacity="0.25" />
      <path d="M65 52 L100 40 L135 52" fill="none" stroke={c} strokeWidth="0.5" opacity="0.2" />
      <path d="M70 56 L100 46 L130 56" fill="none" stroke={c} strokeWidth="0.3" opacity="0.1" />
      <circle cx="100" cy="38" r="2.5" fill={c} opacity={isListening ? 0.8 : 0.35} filter="url(#glowSm)" />

      <path d="M56 78 L68 72 L96 72 L104 82 L104 92 L96 100 L68 100 L56 92 Z" fill={c} opacity={eyeOp * 0.12} />
      <path d="M60 80 L70 75 L94 75 L102 82 L102 90 L94 97 L70 97 L60 90 Z" fill={c} opacity={eyeOp * 0.5} filter="url(#glow)" />
      <ellipse cx="80" cy="86" rx="16" ry="6" fill="url(#eyeGlow)" opacity={eyeOp} filter="url(#glow)" />
      <line x1="64" y1="86" x2="98" y2="86" stroke="#fff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />

      <path d="M144 78 L132 72 L104 72 L96 82 L96 92 L104 100 L132 100 L144 92 Z" fill={c} opacity={eyeOp * 0.12} />
      <path d="M140 80 L130 75 L106 75 L98 82 L98 90 L106 97 L130 97 L140 90 Z" fill={c} opacity={eyeOp * 0.5} filter="url(#glow)" />
      <ellipse cx="120" cy="86" rx="16" ry="6" fill="url(#eyeGlow)" opacity={eyeOp} filter="url(#glow)" />
      <line x1="102" y1="86" x2="136" y2="86" stroke="#fff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />

      <path d="M97 92 L100 104 L103 92" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />
      <path d="M72 116 L82 113 L92 116 L100 113 L108 116 L118 113 L128 116"
        fill="none" stroke={c} strokeWidth="1.5" opacity={isSpeaking ? 0.8 : isListening ? 0.6 : 0.35} strokeLinecap="round" />
      <path d="M78 119 L88 117 L98 119 L100 117 L102 119 L112 117 L122 119"
        fill="none" stroke={c} strokeWidth="0.5" opacity={isSpeaking ? 0.4 : 0.15} strokeLinecap="round" />
      <path d="M52 82 L60 76 L66 82 L64 96 L54 100" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />
      <path d="M148 82 L140 76 L134 82 L136 96 L146 100" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />
      <path d="M75 136 L100 145 L125 136" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />
      <circle cx="50" cy="72" r="1" fill={c} opacity="0.2" />
      <circle cx="150" cy="72" r="1" fill={c} opacity="0.2" />
      <circle cx="48" cy="100" r="0.8" fill={c} opacity="0.15" />
      <circle cx="152" cy="100" r="0.8" fill={c} opacity="0.15" />
    </svg>
  );
}

// ── Orb ─────────────────────────────────────────────────────────

function OrbHero({ isListening, isSpeaking, orbSize }: { isListening: boolean; isSpeaking: boolean; orbSize: number }) {
  const ring1 = orbSize + 30;
  const ring2 = orbSize + 50;
  const glowSize = orbSize + 100;

  return (
    <div style={{ position: "relative", width: ring2, height: ring2, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: glowSize, height: glowSize, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)", filter: "blur(30px)", animation: "orbPulse 3s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: ring1, height: ring1, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.12)", borderTopColor: "rgba(0,212,255,0.35)", animation: "spin 10s linear infinite" }} />
      <div style={{ position: "absolute", width: ring2, height: ring2, borderRadius: "50%", border: "1px solid rgba(139,92,246,0.08)", borderBottomColor: "rgba(139,92,246,0.2)", animation: "spin 15s linear infinite reverse" }} />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="orb-particle" style={{
          left: `${40 + Math.random() * 20}%`, bottom: `${10 + Math.random() * 20}%`,
          animationDuration: `${3 + Math.random() * 3}s`, animationDelay: `${Math.random() * 4}s`,
          width: 1 + Math.random() * 2, height: 1 + Math.random() * 2,
        }} />
      ))}
      <motion.div style={{
        position: "relative", width: orbSize, height: orbSize, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, rgba(0,212,255,0.15) 0%, rgba(88,28,135,0.2) 30%, rgba(0,50,120,0.3) 60%, rgba(6,11,24,0.9) 100%)",
        border: "1.5px solid rgba(0,212,255,0.25)",
        boxShadow: "0 0 40px rgba(0,212,255,0.15), 0 0 80px rgba(139,92,246,0.1), inset 0 0 40px rgba(0,212,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}
        animate={isListening ? { scale: [1, 1.03, 1] } : isSpeaking ? { scale: [1, 1.015, 1] } : {}}
        transition={{ duration: isListening ? 1.5 : 2, repeat: Infinity, ease: "easeInOut" }}>
        <FuturisticFace isListening={isListening} isSpeaking={isSpeaking} />
      </motion.div>
    </div>
  );
}

// ── Tab Panels ──────────────────────────────────────────────────

function VoicePanel({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: "var(--text-bright)", letterSpacing: 2 }}>Voice Command</div>
      <div className="p-2 rounded-lg w-full" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4, marginBottom: 4 }}>Try saying:</div>
        {["Explain quadratic equations", "Quiz me on trigonometry", "Show me a diagram"].map((c, i) => (
          <button key={i} onClick={() => onVoiceSend(c)}
            className="px-2 py-1 rounded mb-1 w-full text-left transition-all hover:bg-cyan-400/10"
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--primary)", opacity: 0.6, background: "rgba(0,212,255,0.04)" }}>
            &ldquo;{c}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadPanel() {
  return (
    <div className="flex flex-col items-center gap-3 py-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
          <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: "var(--text-bright)", letterSpacing: 2 }}>Upload Image</div>
      <button className="px-4 py-1.5 rounded-lg text-xs transition-all" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
        Choose File
      </button>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#c084fc", opacity: 0.5 }}>JPG, PNG, WEBP &mdash; Max 10MB</div>
    </div>
  );
}

function SchedulePanel() {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>Today&apos;s Schedule</h3>
      {SCHEDULE.map((s, i) => (
        <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${s.done ? "opacity-45" : s.active ? "ring-1 ring-cyan-400/30 bg-cyan-400/5" : ""}`}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--primary)", minWidth: 36 }}>{s.time}</span>
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
    <div className="flex flex-col gap-2">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>Progress Report</h3>
      {SUBJECTS.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between mb-0.5">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "var(--text-bright)" }}>{s.name}</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: s.color }}>{s.pct}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
        </div>
      ))}
      <div className="p-2 rounded-lg mt-1" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4 }}>Overall Average</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, color: "var(--primary)" }}>{avg}%</div>
      </div>
    </div>
  );
}

function SyllabusPanel() {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: "var(--primary)", letterSpacing: 2, marginBottom: 2 }}>CBSE Class 9 — Math</h3>
      {CHAPTERS.map((ch, i) => (
        <div key={i} className={`flex items-center gap-2 p-1 rounded-lg ${ch.status === "locked" ? "opacity-35" : ""}`}>
          <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] shrink-0 ${
            ch.status === "done" ? "bg-green-500/20 text-green-400" : ch.status === "active" ? "bg-cyan-400/20 text-cyan-400" : "bg-gray-600/20 text-gray-500"
          }`}>
            {ch.status === "done" ? "✓" : ch.status === "active" ? "▶" : "🔒"}
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "var(--text-bright)", fontWeight: 600 }}>Ch {i + 1}: {ch.title}</div>
        </div>
      ))}
    </div>
  );
}

function PanelForTab({ tab, onVoiceSend }: { tab: string; onVoiceSend: (text: string) => void }) {
  switch (tab) {
    case "voice": return <VoicePanel onVoiceSend={onVoiceSend} />;
    case "upload": return <UploadPanel />;
    case "schedule": return <SchedulePanel />;
    case "progress": return <ProgressPanel />;
    case "syllabus": return <SyllabusPanel />;
    default: return null;
  }
}

// ── Chat Panel Component ───────────────────────────────────────

function ChatPanel({
  messages, input, setInput, send, onKey, endRef, providerInfo, progress, isCompact
}: {
  messages: Msg[]; input: string; setInput: (v: string) => void; send: () => void;
  onKey: (e: React.KeyboardEvent) => void; endRef: React.RefObject<HTMLDivElement | null>;
  providerInfo: string; progress: number; isCompact?: boolean;
}) {
  return (
    <>
      <div className={`flex items-center justify-between shrink-0 ${isCompact ? "px-3 py-2" : "px-4 py-3"}`} style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: isCompact ? 11 : 12, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 1 }}>EduOrb – AI Tutor</div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--primary)", opacity: 0.5, marginTop: 1 }}>{providerInfo || "NCERT · Online"}</div>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "var(--primary)", letterSpacing: 1 }}>Class 9 CBSE</div>
          <div className="progress-track mt-1" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto flex flex-col gap-2 ${isCompact ? "px-3 py-2" : "px-4 py-3"}`}>
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`chat-bubble ${m.role === "user" ? "chat-bubble--user" : "chat-bubble--bot"}`}>
              {m.text || <span className="inline-block w-1.5 h-4 bg-cyan-400/50 animate-pulse rounded-sm" />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {!isCompact && <div className="px-4 pb-2 shrink-0"><MathDiagram /></div>}
      <div className={`shrink-0 ${isCompact ? "px-3 py-2" : "px-4 py-2"}`} style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder="Ask EduOrb anything..." className="chat-input flex-1" style={{ fontSize: isCompact ? 13 : 14 }} />
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
  const [progress] = useState(92);
  const [showChat, setShowChat] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const orbSize = useOrbSize();

  const { isListening, transcript, isSupported: voiceSupported, error: voiceError, startListening, stopListening } = useVoice();
  const { speak: ttsSpeak, stop: ttsStop } = useTTS();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // When voice transcript arrives, send it as a message
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      const t = setTimeout(() => {
        if (transcript.trim()) {
          setInput("");
          sendMsg(transcript.trim());
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isListening, transcript]);

  const sendMsg = useCallback(async (txt: string) => {
    if (!txt.trim()) return;
    const botId = crypto.randomUUID();
    const next: Msg[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", text: txt },
      { id: botId, role: "bot", text: "" },
    ];
    setMessages(next);

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
      const finalClean = stripThink(raw);
      if (finalClean) {
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: finalClean } : m));
        setIsSpeaking(true);
        ttsSpeak(finalClean);
        setTimeout(() => setIsSpeaking(false), 2000);
      } else {
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: "I couldn't generate a response. Please try again." } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: "AI unavailable. Please try again." } : m));
    }
  }, [messages, ttsSpeak]);

  const send = useCallback(() => {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    sendMsg(txt);
  }, [input, sendMsg]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      ttsStop();
      startListening();
    }
  }, [isListening, startListening, stopListening, ttsStop]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="cosmos" /><Stars />
      <div className="nebula-glow nebula-glow--purple" />
      <div className="nebula-glow nebula-glow--blue" />
      <div className="nebula-glow nebula-glow--cyan" />

      {/* ══ DESKTOP lg+ ══ 3-column: sidebar | center | chat */}
      <div className="relative z-10 hidden lg:flex h-full" style={{ padding: 12, gap: 12 }}>
        {/* Sidebar */}
        <aside className="glass flex flex-col shrink-0 p-3" style={{ width: 200 }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>EduOrb</span>
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
        <main className="flex-1 flex flex-col items-center overflow-y-auto min-w-0">
          <div className="flex flex-col items-center pt-4 shrink-0">
            <motion.div initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
              <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            </motion.div>
            <h1 className="mt-4" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: 3, color: "var(--primary)", opacity: 0.6, marginTop: 4 }}>
              {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Speak to EduOrb"}
            </span>
            {voiceError && voiceError !== "no-speech" && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#ef4444", opacity: 0.6, marginTop: 2 }}>
                Mic error: {voiceError}
              </span>
            )}
            <button className={`voice-btn mt-4 ${isListening ? "active" : ""}`} onClick={toggleVoice}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : "Voice Command"}
            </button>
            {!voiceSupported && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#ef4444", opacity: 0.6, marginTop: 4 }}>
                Voice not supported in this browser
              </span>
            )}
          </div>
          <div className="w-full max-w-xs px-4 mt-3 mb-4 glass rounded-xl p-3 shrink-0">
            <PanelForTab tab={activeTab} onVoiceSend={sendMsg} />
          </div>
        </main>

        {/* Right: Chat — flex-based to fill remaining space */}
        <aside className="glass flex flex-col shrink-0 overflow-hidden" style={{ width: "min(440px, 38vw)", minWidth: 320 }}>
          <ChatPanel messages={messages} input={input} setInput={setInput} send={send} onKey={onKey} endRef={endRef} providerInfo={providerInfo} progress={progress} />
        </aside>
      </div>

      {/* ══ TABLET md-lg ══ 2-column: orb | chat */}
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
          <main className="flex-1 flex flex-col items-center justify-start p-3 min-w-0 overflow-y-auto">
            <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            <h1 className="mt-2" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: 3, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
            <button className={`voice-btn mt-3 text-xs ${isListening ? "active" : ""}`} onClick={toggleVoice}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : "Voice"}
            </button>
            <div className="w-full max-w-sm mt-3 glass rounded-xl p-3">
              <PanelForTab tab={activeTab} onVoiceSend={sendMsg} />
            </div>
          </main>
          <aside className="flex flex-col border-l glass shrink-0 overflow-hidden" style={{ width: "45vw", minWidth: 280, borderRadius: 0, borderColor: "var(--glass-border)" }}>
            <ChatPanel messages={messages} input={input} setInput={setInput} send={send} onKey={onKey} endRef={endRef} providerInfo={providerInfo} progress={progress} />
          </aside>
        </div>
      </div>

      {/* ══ MOBILE < md ══ single column, orb/chat toggle */}
      <div className="relative z-10 flex md:hidden flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 glass shrink-0" style={{ borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>EduOrb</span>
          </div>
          <button onClick={() => setShowChat(!showChat)} className="px-2.5 py-1 rounded-lg text-[10px]" style={{ fontFamily: "'Orbitron', sans-serif", border: "1px solid rgba(0,212,255,0.3)", color: "var(--primary)", background: "rgba(0,212,255,0.08)" }}>
            {showChat ? "Orb" : "Chat"}
          </button>
        </div>

        {!showChat ? (
          <main className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
            <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            <h1 className="mt-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: 4, background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EduOrb</h1>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: 3, color: "var(--primary)", opacity: 0.6, marginTop: 4 }}>
              {isListening ? "Listening..." : "Speak to EduOrb"}
            </span>
            {voiceError && voiceError !== "no-speech" && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#ef4444", opacity: 0.6, marginTop: 2 }}>
                Mic error: {voiceError}
              </span>
            )}
            <button className={`voice-btn mt-4 text-xs ${isListening ? "active" : ""}`} onClick={toggleVoice}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : "Voice Command"}
            </button>
            {!voiceSupported && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#ef4444", opacity: 0.6, marginTop: 4 }}>
                Voice not supported in this browser
              </span>
            )}
            <div className="w-full mt-4 glass rounded-xl p-3">
              <PanelForTab tab={activeTab} onVoiceSend={sendMsg} />
            </div>
          </main>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatPanel messages={messages} input={input} setInput={setInput} send={send} onKey={onKey} endRef={endRef} providerInfo={providerInfo} progress={progress} isCompact />
          </div>
        )}

        {/* Bottom nav */}
        <nav className="shrink-0 flex items-center justify-around py-1.5 px-1 glass" style={{ borderTop: "1px solid var(--glass-border)", borderRadius: 0, paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => { setActiveTab(n.id); setShowChat(true); }}
              className={`flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-lg ${activeTab === n.id ? "text-cyan-400" : "text-gray-500"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={n.icon} /></svg>
              <span className="text-[8px] tracking-wider">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
