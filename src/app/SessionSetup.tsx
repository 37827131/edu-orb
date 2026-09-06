"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "voice",   label: "Voice Command",   icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3" },
  { id: "upload",  label: "Upload Image",     icon: "M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
  { id: "schedule",label: "My Schedule",      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { id: "progress",label: "Progress Report",  icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" },
  { id: "syllabus", label: "Syllabus",        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const PLACEHOLDER_MESSAGES = [
  { role: "user" as const, text: "Explain the Pythagoras theorem with a diagram." },
  { role: "bot" as const,  text: "In a right-angled triangle, the square of the hypotenuse (the side opposite the right angle) equals the sum of the squares of the other two sides. Mathematically: a² + b² = c²." },
  { role: "user" as const, text: "Can you show me a real-world example?" },
  { role: "bot" as const,  text: "Imagine a ladder leaning against a wall. The wall and ground form a right angle. If the ladder is 5 m long (hypotenuse) and the base is 3 m from the wall, the height it reaches is √(5²−3²) = 4 m." },
];

// ── Stars ───────────────────────────────────────────────────────

function Stars() {
  const stars = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 3,
    }))
  ).current;

  return (
    <div className="starfield">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Math Diagram (SVG) ──────────────────────────────────────────

function MathDiagram() {
  return (
    <div className="math-diagram">
      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
        {/* Axes */}
        <line x1="40" y1="90" x2="280" y2="90" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
        <line x1="40" y1="90" x2="40" y2="10" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
        <polygon points="37,14 40,6 43,14" fill="rgba(0,212,255,0.3)" />
        <polygon points="276,87 284,90 276,93" fill="rgba(0,212,255,0.3)" />

        {/* Grid dots */}
        {[80, 120, 160, 200, 240].map((x) => (
          <circle key={x} cx={x} cy={90} r="1" fill="rgba(0,212,255,0.2)" />
        ))}
        {[30, 50, 70].map((y) => (
          <circle key={y} cx={40} cy={y} r="1" fill="rgba(0,212,255,0.2)" />
        ))}

        {/* Curve */}
        <path
          d="M 60 80 Q 100 20, 160 45 T 260 15"
          stroke="var(--primary)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />

        {/* Point A */}
        <circle cx="90" cy="58" r="4" fill="var(--primary)" opacity="0.9" />
        <text x="96" y="55" fill="var(--primary)" fontSize="10" fontFamily="Orbitron, sans-serif">A</text>

        {/* Point B */}
        <circle cx="170" cy="38" r="4" fill="#a855f7" opacity="0.9" />
        <text x="176" y="35" fill="#a855f7" fontSize="10" fontFamily="Orbitron, sans-serif">B</text>

        {/* Point C */}
        <circle cx="240" cy="22" r="4" fill="#22d3ee" opacity="0.9" />
        <text x="246" y="19" fill="#22d3ee" fontSize="10" fontFamily="Orbitron, sans-serif">C</text>

        {/* Axis labels */}
        <text x="278" y="100" fill="rgba(200,214,229,0.3)" fontSize="8" fontFamily="Share Tech Mono, monospace">x</text>
        <text x="30" y="10" fill="rgba(200,214,229,0.3)" fontSize="8" fontFamily="Share Tech Mono, monospace">y</text>
      </svg>
    </div>
  );
}

// ── Orb Component ───────────────────────────────────────────────

function OrbHero({ isListening }: { isListening: boolean }) {
  return (
    <div className="orb-wrapper">
      <div className="orb-glow" />
      <div className="orb-ring" />
      <div className="orb-ring orb-ring--2" />

      {/* Floating particles */}
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="orb-particle"
          style={{
            left: `${40 + Math.random() * 20}%`,
            bottom: `${10 + Math.random() * 20}%`,
            animationDuration: `${3 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 4}s`,
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
          }}
        />
      ))}

      {/* Orb sphere with robotic face */}
      <motion.div
        className="orb-sphere"
        animate={isListening ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="robot-face">
          <div className="robot-eyes">
            <div className="robot-eye" />
            <div className="robot-eye" />
          </div>
          <div className="robot-mouth" />
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function SessionSetup() {
  const [activeNav, setActiveNav] = useState("voice");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [isListening, setIsListening] = useState(false);
  const [progress] = useState(92);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "EDU-ORB processing your query. This is a simulated response — connect Ollama for live AI tutoring." },
      ]);
    }, 800);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ── Background ── */}
      <div className="cosmos" />
      <Stars />
      <div className="nebula-glow nebula-glow--purple" />
      <div className="nebula-glow nebula-glow--blue" />
      <div className="nebula-glow nebula-glow--cyan" />

      {/* ── Layout ── */}
      <div className="relative z-10 flex h-full p-4 gap-4">

        {/* ── Left Sidebar ── */}
        <motion.aside
          className="glass w-[240px] flex flex-col shrink-0 p-5"
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>
              EduOrb
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Parent Connect Button */}
          <button
            className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: "#c084fc",
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
            Parent Connect
          </button>
        </motion.aside>

        {/* ── Center: Hero Orb ── */}
        <main className="flex-1 flex flex-col items-center justify-center relative">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <OrbHero isListening={isListening} />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="mt-6"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: 6,
              background: "linear-gradient(135deg, #00d4ff, #a855f7, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            EduOrb
          </motion.h1>

          {/* Mic + Speak label */}
          <motion.div
            className="flex flex-col items-center gap-3 mt-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 13,
              letterSpacing: 3,
              color: "var(--primary)",
              opacity: 0.7,
            }}>
              Speak to EduOrb
            </span>
          </motion.div>

          {/* Voice Button */}
          <motion.button
            className={`voice-btn mt-6 ${isListening ? "active" : ""}`}
            onClick={() => setIsListening(!isListening)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            {isListening ? "Listening..." : "Voice Command"}
          </motion.button>
        </main>

        {/* ── Right: Chat Panel ── */}
        <motion.aside
          className="glass w-[380px] flex flex-col shrink-0"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--glass-border)" }}>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-bright)", letterSpacing: 2 }}>
                EduOrb – AI Tutor
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "var(--primary)", opacity: 0.5, marginTop: 2 }}>
                NCERT · Online
              </div>
            </div>
            {/* Class label + Progress */}
            <div className="text-right">
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--primary)", letterSpacing: 1, marginBottom: 4 }}>
                Class 9 CBSE – Mathematics
              </div>
              <div className="progress-track" style={{ width: 100 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "var(--text)", opacity: 0.4, marginTop: 2 }}>
                {progress}% Complete
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble--user" : "chat-bubble--bot"}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Math Diagram */}
          <div className="px-5 pb-3">
            <MathDiagram />
          </div>

          {/* Input */}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask EduOrb anything..."
                className="chat-input flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: 1,
                  background: input.trim() ? "rgba(0,212,255,0.15)" : "transparent",
                  border: `1px solid ${input.trim() ? "rgba(0,212,255,0.4)" : "var(--glass-border)"}`,
                  color: input.trim() ? "var(--primary)" : "rgba(200,214,229,0.3)",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Hidden upload */}
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" />
        </motion.aside>
      </div>
    </div>
  );
}
