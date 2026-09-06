"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ArmoredTutorHero, { type TutorState } from "@/components/ArmoredTutorHero";
import { useSpeechRecognition } from "@/lib/voice/useVoice";

// ── Data ────────────────────────────────────────────────────────

const TOPICS = [
  "Algebra Basics",
  "Python Programming",
  "World History",
  "Photosynthesis",
  "English Grammar",
  "Climate Science",
  "Quantum Physics",
  "Spanish for Beginners",
  "CBSE Class 6 Science",
  "CBSE Class 7 Science",
  "CBSE Class 8 Science",
  "CBSE Class 9 Science",
  "CBSE Class 10 Science",
  "CBSE Class 10 Math",
  "CBSE Class 11 Physics",
  "CBSE Class 12 Physics",
];

const CHAPTERS = [
  "Chapter 1: Chemical Reactions",
  "Chapter 2: Acids, Bases & Salts",
  "Chapter 3: Metals & Non-Metals",
  "Chapter 4: Carbon Compounds",
  "Chapter 5: Life Processes",
  "Chapter 6: Control & Coordination",
  "Chapter 7: Heredity & Evolution",
  "Chapter 8: Light — Reflection & Refraction",
  "Chapter 9: Human Eye & Colourful World",
  "Chapter 10: Electricity",
  "Chapter 11: Magnetic Effects of Current",
  "Chapter 12: Sources of Energy",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

// ── Component ──────────────────────────────────────────────────

export default function SessionSetup() {
  const [topic, setTopic] = useState("");
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "bot"; text: string }>>([
    { id: "1", role: "bot", text: "Hello! I'm EDU-ORB, your CBSE NCERT tutor. I cover all subjects, Classes 1-12 — aligned to the latest NCERT textbooks, CBSE marking schemes, and board exam patterns." },
    { id: "2", role: "bot", text: "Tell me your Class, Subject, and Chapter (e.g. 'Class 10 Science Chapter 1'), or pick a topic from the left sidebar. I'll explain concepts, give NCERT solutions, important questions, and revision notes — whatever you need." },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [tutorState, setTutorState] = useState<TutorState>("idle");
  const { isListening, isSupported, start: startListening, stop: stopListening } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (text) => setInput((current) => `${current} ${text}`.trim()),
    onEnd: () => setTutorState("idle"),
    onError: () => setTutorState("error"),
  });

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setMessages((prev) => [...prev, { id: Math.random().toString(36).slice(2), role: "user", text }]);
    setIsStreaming(true);
    setTutorState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user" as const, content: text }],
          systemPrompt: topic ? `You are teaching CBSE ${topic}. Be specific, exam-focused, and reference NCERT.` : undefined,
          temperature: level === "Advanced" ? 0.3 : level === "Intermediate" ? 0.7 : 1.0,
        }),
      });
      if (!res.ok) throw new Error("AI unavailable");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");

      const decoder = new TextDecoder();
      let botText = "";
      const botId = Math.random().toString(36).slice(2);
      setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const { delta } = JSON.parse(json) as { delta?: string };
            if (delta) {
              botText += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === botId ? { ...m, text: botText } : m))
              );
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), role: "bot", text: "Sorry — the AI service is unavailable right now. Please check your API keys and try again." },
      ]);
    }
    setIsStreaming(false);
    setTutorState("idle");
  }, [input, isStreaming, messages, topic, level]);

  const toggleListening = () => {
    if (!isSupported) { setTutorState("error"); return; }
    if (isListening) { stopListening(); setTutorState("idle"); }
    else { setTutorState("listening"); startListening(); }
  };

  const speakLatest = () => {
    const latest = [...messages].reverse().find((message) => message.role === "bot" && message.text);
    if (!latest || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latest.text);
    utterance.onstart = () => setTutorState("speaking");
    utterance.onend = () => setTutorState("idle");
    utterance.onerror = () => setTutorState("error");
    window.speechSynthesis.speak(utterance);
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    setTutorState("thinking"); setIsStreaming(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: `Uploaded question: ${file.name}` }]);
    try {
      const body = new FormData(); body.append("image", file);
      const response = await fetch("/api/vision", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Vision request failed");
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: result.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: error instanceof Error ? error.message : "Image analysis failed" }]);
      setTutorState("error");
    } finally { setIsStreaming(false); setTutorState((current) => current === "error" ? current : "idle"); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopicClick = (t: string) => {
    setTopic(t);
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), role: "bot", text: `Got it — ${t}. What would you like to know? Ask for an explanation, NCERT solutions, important questions, revision notes, or a quiz.` },
    ]);
  };

  const [activeNav, setActiveNav] = useState<string>("syllabus");
  const navItems = [
    { id: "schedule", label: "Schedule", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg> },
    { id: "progress", label: "Progress", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
    { id: "syllabus", label: "Syllabus", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6M8 11h8"/></svg> },
    { id: "parent", label: "Parent Connect", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "uploads", label: "Uploads", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  ];

  const sessionSeconds = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionSeconds.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#e8ecf1] font-sans overflow-hidden flex flex-col">
      {/* ── Top progress bar ── */}
      <div className="h-1 bg-[#0d1225] shrink-0 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#6dafeb] to-[#326dd1] transition-all duration-1000 ease-out"
          style={{ width: `${Math.min((messages.length / 20) * 100, 100)}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
      </div>

      {/* ── Header bar ── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#04091c]/90 border-b border-[#1a213b] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6dafeb] to-[#326dd1] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-sm font-bold tracking-wide text-white">EDU<span className="text-[#6dafeb]">ORB</span></span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse shadow-lg shadow-[#34d399]/30" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#7a8ba8]">CBSE Class {level === "Beginner" ? "10" : level === "Intermediate" ? "11" : "12"}</span>
          <button
            onClick={() => uploadRef.current?.click()}
            className="p-1.5 rounded-lg bg-[#1a213b] border border-[#2a3550] text-[#6dafeb] hover:bg-[#253050] transition-colors"
            title="Upload question image"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <button className="p-1.5 rounded-lg bg-[#1a213b] border border-[#2a3550] text-[#7a8ba8] hover:bg-[#253050] hover:text-white transition-colors" title="Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: Icon navigation rail ── */}
        <aside className="w-[60px] border-r border-[#1a213b] bg-[#04091c]/90 flex flex-col items-center py-3 gap-1 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${activeNav === item.id
                  ? "bg-[#6dafeb]/15 text-[#6dafeb] shadow-[0_0_12px_rgba(109,175,235,0.25)]"
                  : "text-[#5a7a9a] hover:text-[#a0b0c8] hover:bg-[#10182e]"
                }`}
            >
              {item.icon}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex flex-col gap-1 items-center">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`w-8 h-8 rounded-lg text-[8px] font-bold flex items-center justify-center transition-colors
                  ${level === l
                    ? "bg-[#6dafeb] text-[#0b0f1a]"
                    : "bg-[#1a213b] text-[#5a7a9a] hover:bg-[#253050]"
                  }`}
                title={l}
              >
                {l[0]}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Center: Armored helmet hero + Voice CTA ── */}
        <main className="flex-1 flex flex-col items-center justify-center overflow-hidden relative">
          {/* Cosmic background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6dafeb]/5 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#326dd1]/5 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 shrink-0">
            <ArmoredTutorHero state={tutorState} />
          </div>

          {/* "Speak to EduOrb" CTA */}
          <motion.button
            onClick={toggleListening}
            className={`relative z-10 mt-4 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-3
              ${isListening
                ? "bg-[#6dafeb] text-[#0b0f1a] shadow-[0_0_30px_rgba(109,175,235,0.5)]"
                : "bg-[#10182e] text-[#6dafeb] border border-[#6dafeb]/30 hover:bg-[#6dafeb]/10 hover:border-[#6dafeb]/60 hover:shadow-[0_0_20px_rgba(109,175,235,0.2)]"
              }`}
            animate={isListening ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
            {isListening ? "Listening…" : "Speak to EduOrb"}
            {isListening && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6dafeb] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#6dafeb]" />
              </span>
            )}
          </motion.button>

          {/* Level & topic info */}
          <div className="relative z-10 mt-3 flex items-center gap-3 text-[10px] text-[#5a7a9a]">
            <span>Level: <span className="text-[#6dafeb]">{level}</span></span>
            {topic && <span>Topic: <span className="text-[#6dafeb]">{topic}</span></span>}
            {chapter && <span>Ch: <span className="text-[#6dafeb]">{chapter}</span></span>}
          </div>
        </main>

        {/* ── Right: AI Chat panel ── */}
        <aside className="w-[380px] border-l border-[#1a213b] bg-[#060a14]/80 flex flex-col shrink-0">
          {/* Chat header */}
          <div className="px-3 py-2 border-b border-[#1a213b] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6dafeb] to-[#326dd1] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white">EDU-ORB Tutor</p>
                <p className="text-[8px] text-[#5a7a9a]">CBSE · {topic || "General"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#5a7a9a]">{messages.length} msgs</span>
              <span className="text-[9px] text-[#5a7a9a]">·</span>
              <span className="text-[9px] text-[#5a7a9a]">{fmtTime(elapsed)}</span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5" style={{ background: "#0d1225" }}>
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed
                      ${msg.role === "user"
                        ? "bg-[#152561] text-white rounded-br-md border border-[#2a4a8a]"
                        : "bg-[#10182e] text-[#c8d0e0] rounded-bl-md border border-[#1a213b]"
                      }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isStreaming && (
              <motion.div className="flex items-center gap-2 text-[#6dafeb] text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6dafeb] animate-pulse" />
                <span>Thinking…</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick action pills */}
          <div className="px-3 py-1.5 border-t border-[#1a213b] flex gap-1.5">
            <button
              onClick={() => { setInput(`Create a ${level.toLowerCase()} quiz about ${chapter || topic || "my current topic"}`); inputRef.current?.focus(); }}
              className="px-2 py-1 rounded-full text-[9px] bg-[#10182e] text-[#6dafeb] border border-[#1a213b] hover:bg-[#152561] transition-colors"
            >
              Quiz
            </button>
            <button onClick={speakLatest} className="px-2 py-1 rounded-full text-[9px] bg-[#10182e] text-[#6dafeb] border border-[#1a213b] hover:bg-[#152561] transition-colors">
              Speak
            </button>
            <button
              onClick={() => { setTopic(""); setChapter(""); setMessages((prev) => prev.slice(0, 2)); }}
              className="px-2 py-1 rounded-full text-[9px] bg-[#10182e] text-[#7a8ba8] border border-[#1a213b] hover:bg-[#152561] hover:text-white transition-colors"
            >
              New Topic
            </button>
          </div>

          {/* Chat input */}
          <div className="px-3 py-2 border-t border-[#1a213b] bg-[#04091c]/60">
            <div className="flex items-end gap-1.5">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  rows={1}
                  className="w-full bg-[#10182e] border border-[#2a3550] rounded-xl px-3 py-2.5 text-[13px] text-[#e8ecf1] placeholder-[#5a7a9a] focus:outline-none focus:border-[#6dafeb] focus:ring-1 focus:ring-[#6dafeb]/30 transition-colors resize-none min-h-[40px] max-h-[90px]"
                />
                <button
                  onClick={toggleListening}
                  className="absolute right-2 top-2 w-6 h-6 rounded-full bg-[#1a213b] border border-[#2a3550] flex items-center justify-center text-[#6dafeb] hover:bg-[#253050] transition-colors"
                  title="Voice input"
                  aria-pressed={isListening}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-1.5
                  ${!input.trim() || isStreaming
                    ? "bg-[#2a3550] text-[#5a7a9a] cursor-not-allowed"
                    : "bg-[#6dafeb] text-[#0b0f1a] hover:bg-[#7ab8ef] shadow-lg shadow-[#6dafeb]/20 active:scale-[0.98]"
                  }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-[8px] text-[#5a7a9a]">
              <span><kbd className="px-1 py-0.5 rounded bg-[#1a213b]">Enter</kbd> Send</span>
              <span><kbd className="px-1 py-0.5 rounded bg-[#1a213b]">Shift+Enter</kbd> New line</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
