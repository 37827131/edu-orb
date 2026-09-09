"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { motion } from "framer-motion";

// ── Data ────────────────────────────────────────────────────────

type Board = "cbse" | "cambridge";

const NAV_ITEMS = [
  { id: "voice", label: "Voice", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3" },
  { id: "upload", label: "Vision", icon: "M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
  { id: "schedule", label: "Schedule", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { id: "progress", label: "Progress", icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" },
  { id: "syllabus", label: "Syllabus", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
] as const;

const SEED_MESSAGES = [
  { role: "user" as const, text: "Explain the Pythagoras theorem with a diagram." },
  { role: "bot" as const, text: "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c²." },
  { role: "user" as const, text: "Can you show me a real-world example?" },
  { role: "bot" as const, text: "Imagine a ladder leaning against a wall. If the ladder is 5 m long and the base is 3 m from the wall, the height is √(5²−3²) = 4 m." },
];

// ── Board-Specific Data ────────────────────────────────────────

const BOARD_DATA: Record<Board, {
  label: string;
  classes: string[];
  defaultClass: string;
  subjects: { name: string; pct: number; color: string }[];
  schedule: { time: string; subject: string; topic: string; done?: boolean; active?: boolean }[];
  chapters: { title: string; status: "done" | "active" | "locked" }[];
}> = {
  cbse: {
    label: "CBSE NCERT",
    classes: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    defaultClass: "Class 9",
    subjects: [
      { name: "Mathematics", pct: 92, color: "#00d4ff" },
      { name: "Physics", pct: 78, color: "#a855f7" },
      { name: "Chemistry", pct: 65, color: "#22d3ee" },
      { name: "English", pct: 88, color: "#00d4ff" },
      { name: "Biology", pct: 71, color: "#a855f7" },
    ],
    schedule: [
      { time: "09:00", subject: "Mathematics", topic: "Polynomials", done: true },
      { time: "10:30", subject: "Physics", topic: "Motion & Force", done: true },
      { time: "12:00", subject: "Chemistry", topic: "Atoms & Molecules", active: true },
      { time: "14:00", subject: "English", topic: "The Fun They Had" },
      { time: "15:30", subject: "Biology", topic: "Cell Structure" },
    ],
    chapters: [
      { title: "Number Systems", status: "done" },
      { title: "Polynomials", status: "done" },
      { title: "Coordinate Geometry", status: "done" },
      { title: "Linear Equations", status: "active" },
      { title: "Euclid's Geometry", status: "locked" },
      { title: "Lines and Angles", status: "locked" },
      { title: "Triangles", status: "locked" },
      { title: "Quadrilaterals", status: "locked" },
    ],
  },
  cambridge: {
    label: "Cambridge IGCSE",
    classes: ["Year 7", "Year 8", "Year 9", "IGCSE Year 10", "IGCSE Year 11", "AS Level", "A Level"],
    defaultClass: "IGCSE Year 10",
    subjects: [
      { name: "Mathematics", pct: 85, color: "#00d4ff" },
      { name: "Physics", pct: 82, color: "#a855f7" },
      { name: "Chemistry", pct: 74, color: "#22d3ee" },
      { name: "English Language", pct: 90, color: "#00d4ff" },
      { name: "Biology", pct: 79, color: "#a855f7" },
    ],
    schedule: [
      { time: "08:30", subject: "Mathematics", topic: "Algebra & Functions", done: true },
      { time: "09:45", subject: "Physics", topic: "Forces & Motion", done: true },
      { time: "11:00", subject: "Chemistry", topic: "Atomic Structure", active: true },
      { time: "13:00", subject: "English Language", topic: "Reading Comprehension" },
      { time: "14:15", subject: "Biology", topic: "Cell Biology" },
    ],
    chapters: [
      { title: "Number & Algebra", status: "done" },
      { title: "Coordinate Geometry", status: "done" },
      { title: "Mensuration", status: "done" },
      { title: "Statistics & Probability", status: "active" },
      { title: "Forces & Motion", status: "locked" },
      { title: "Energy Resources", status: "locked" },
      { title: "Chemical Bonding", status: "locked" },
      { title: "Organic Chemistry", status: "locked" },
    ],
  },
};

const MAX_VISION_BYTES = 10 * 1024 * 1024;
const VISION_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ── Types ───────────────────────────────────────────────────────

type Msg = { id: string; role: "user" | "bot"; text: string; meta?: string; timestamp?: number };
type ChatPayload = { providers?: string; delta?: string; error?: string };
type UploadState = "idle" | "uploading" | "done" | "error";

type OrbDot = {
  id: number;
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
};

type FloatingParticle = {
  id: number;
  left: number;
  bottom: number;
  duration: number;
  delay: number;
  size: number;
};

// ── Helpers ─────────────────────────────────────────────────────

function stripThink(raw: string): string {
  let s = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, "");
  s = s.replace(/<think>[\s\S]*$/, "");
  s = s.replace(/^<\/?t?h?i?n?k?(?:\s[^>]*)?>?/, "");
  s = s.replace(/^<\/think>/, "");
  return s.trim();
}

function getReadableError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toApiMessages(messages: Msg[]) {
  // Deduplicate consecutive identical messages (prevents loop artifacts)
  const deduped: Msg[] = [];
  for (const m of messages) {
    if (m.text.trim().length === 0) continue;
    const last = deduped[deduped.length - 1];
    if (last && last.role === m.role && last.text.trim() === m.text.trim()) continue;
    deduped.push(m);
  }
  // Send last 12 messages max (keeps context manageable)
  return deduped.slice(-12).map((m) => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.text,
  }));
}

async function readChatStream(response: Response, onPayload: (payload: ChatPayload) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body returned");

  const decoder = new TextDecoder();
  let buffer = "";

  const processEvent = (eventText: string) => {
    const data = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (!data || data === "[DONE]") return;

    try {
      onPayload(JSON.parse(data) as ChatPayload);
    } catch {
      // Ignore malformed partial payloads.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const event of events) processEvent(event);
  }

  buffer += decoder.decode();
  if (buffer.trim()) processEvent(buffer);
}

function makeOrbDots(): OrbDot[] {
  return Array.from({ length: 135 }, (_, id) => {
    const angle = ((id * 137.508) % 360) * (Math.PI / 180);
    const band = (id % 11) / 10;
    const radius = 13 + band * 79 + ((id * 17) % 9);
    const squash = 0.72 + ((id % 5) * 0.045);
    const cx = 100 + Math.cos(angle) * radius;
    const cy = 100 + Math.sin(angle) * radius * squash;
    const edge = Math.hypot(cx - 100, cy - 100) / 92;
    return {
      id,
      cx,
      cy,
      r: id % 9 === 0 ? 1.25 : id % 4 === 0 ? 0.9 : 0.65,
      opacity: Math.max(0.18, 0.82 - edge * 0.44),
      delay: (id % 17) * 0.13,
    };
  }).filter((dot) => Math.hypot(dot.cx - 100, dot.cy - 100) <= 92);
}

function makeOrbParticles(): FloatingParticle[] {
  return Array.from({ length: 12 }, (_, id) => ({
    id,
    left: 34 + ((id * 13) % 34),
    bottom: 8 + ((id * 19) % 26),
    duration: 3.2 + ((id * 7) % 24) / 10,
    delay: ((id * 11) % 30) / 10,
    size: 1.2 + ((id * 5) % 14) / 10,
  }));
}

function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-full flex items-center justify-center ${className}`} style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
      <svg width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
    </div>
  );
}

// ── Voice Hook ──────────────────────────────────────────────────

function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const transcriptRef = useRef("");
  const restartCountRef = useRef(0);
  const finalTextRef = useRef("");
  const lastSentRef = useRef("");

  useEffect(() => {
    listeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = finalTextRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
          finalTextRef.current = finalText;
        } else {
          interimText += result[0].transcript;
        }
      }

      const displayText = (finalText + interimText).trim();
      if (displayText) {
        transcriptRef.current = displayText;
        setTranscript(displayText);
      }
    };

    recognition.onend = () => {
      if (listeningRef.current && restartCountRef.current < 3 && !finalTextRef.current) {
        restartCountRef.current += 1;
        try { recognition.start(); } catch {}
        return;
      }
      setIsListening(false);
      listeningRef.current = false;
      restartCountRef.current = 0;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      console.warn("[voice] error:", event.error);
      setError(event.error || "unknown");
      setIsListening(false);
      listeningRef.current = false;
      restartCountRef.current = 0;
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    transcriptRef.current = "";
    finalTextRef.current = "";
    setTranscript("");
    setError("");
    setIsListening(true);
    listeningRef.current = true;
    restartCountRef.current = 0;
    window.setTimeout(() => {
      try { recognitionRef.current?.start(); } catch (error) {
        console.warn("[voice] start failed:", error);
        setIsListening(false);
        listeningRef.current = false;
      }
    }, 100);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
    listeningRef.current = false;
    restartCountRef.current = 0;
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    finalTextRef.current = "";
    lastSentRef.current = "";
    setTranscript("");
  }, []);

  return { isListening, transcript, isSupported, error, startListening, stopListening, resetTranscript };
}

// ── TTS Hook ───────────────────────────────────────────────────

function useTTS() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis.onvoiceschanged === loadVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const chooseClearVoice = useCallback(() => {
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const preferredNames = [
      "microsoft aria",
      "microsoft jenny",
      "google us english",
      "google uk english female",
      "samantha",
      "daniel",
      "alex",
      "zira",
      "david",
    ];

    for (const preferred of preferredNames) {
      const match = englishVoices.find((voice) => voice.name.toLowerCase().includes(preferred));
      if (match) return match;
    }

    return englishVoices.find((voice) => voice.localService) || englishVoices[0] || voices[0] || null;
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
      onDone?.();
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\s+/g, " ").trim();
    const chunks = cleanText.match(/.{1,220}(?:[.!?]\s|,\s|\s|$)/g)?.map((chunk) => chunk.trim()).filter(Boolean) || [cleanText];
    const voice = chooseClearVoice();
    let remaining = chunks.length;

    const finishChunk = () => {
      remaining -= 1;
      if (remaining <= 0) onDone?.();
    };

    chunks.forEach((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = voice?.lang || "en-US";
      utterance.voice = voice;
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      utterance.onend = finishChunk;
      utterance.onerror = finishChunk;
      window.speechSynthesis.speak(utterance);
    });
  }, [chooseClearVoice]);

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
      const width = window.innerWidth;
      const height = window.innerHeight;
      const minSide = Math.min(width, height);

      if (width < 380 || height < 620) setSize(Math.max(128, Math.min(158, minSide * 0.35)));
      else if (width < 640) setSize(Math.max(150, Math.min(188, minSide * 0.42)));
      else if (width < 768) setSize(190);
      else if (width < 1024) setSize(Math.min(220, Math.max(180, minSide * 0.36)));
      else if (width < 1280) setSize(Math.min(230, Math.max(190, minSide * 0.32)));
      else setSize(Math.min(270, Math.max(220, minSide * 0.34)));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return size;
}

// ── Background ──────────────────────────────────────────────────

function Stars() {
  const data = useRef(Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    y: (i * 61) % 100,
    s: 1 + ((i * 11) % 18) / 10,
    d: 2 + ((i * 13) % 40) / 10,
    dl: ((i * 17) % 30) / 10,
  }))).current;

  return (
    <div className="starfield" aria-hidden="true">
      {data.map((star) => (
        <div key={star.id} className="star" style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.s, height: star.s, animationDuration: `${star.d}s`, animationDelay: `${star.dl}s` }} />
      ))}
    </div>
  );
}

// ── Math Diagram ────────────────────────────────────────────────

function MathDiagram() {
  return (
    <div className="math-diagram" aria-hidden="true">
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

// ── Orb Face ────────────────────────────────────────────────────

function PixelConstellation({ accent }: { accent: string }) {
  const dots = useMemo(makeOrbDots, []);
  const clipId = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className="absolute inset-0 orb-pixel-map" aria-hidden="true">
      <clipPath id={`${clipId}-orbClip`}>
        <circle cx="100" cy="100" r="96" />
      </clipPath>
      <g clipPath={`url(#${clipId}-orbClip)`}>
        {dots.map((dot) => (
          <circle key={dot.id} cx={dot.cx} cy={dot.cy} r={dot.r} fill={accent} opacity={dot.opacity} style={{ animationDelay: `${dot.delay}s` }} />
        ))}
      </g>
    </svg>
  );
}

function FuturisticFace({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) {
  const id = useId().replace(/:/g, "");
  const accent = isListening ? "#00ffcc" : isSpeaking ? "#38e8ff" : "#7ae8ff";
  const eyeOpacity = isListening ? 1 : isSpeaking ? 0.96 : 0.88;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className="absolute inset-0 orb-face" style={{ pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <filter id={`${id}-softGlow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-eyeGlow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={`${id}-plate`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.09" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id={`${id}-eyeCore`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="34%" stopColor="#cfffff" stopOpacity="0.95" />
          <stop offset="64%" stopColor={accent} stopOpacity="0.65" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d="M100 26 C130 26 153 45 160 74 C165 97 158 118 143 135 C130 149 114 157 100 157 C86 157 70 149 57 135 C42 118 35 97 40 74 C47 45 70 26 100 26 Z" fill={`url(#${id}-plate)`} stroke={accent} strokeWidth="0.8" opacity="0.32" />
      <path d="M100 32 L135 48 L145 73 L137 103 L124 116 H76 L63 103 L55 73 L65 48 Z" fill="rgba(1, 16, 42, 0.22)" stroke={accent} strokeWidth="0.55" opacity="0.5" />
      <path d="M64 50 L46 69 L44 98 L58 121 M136 50 L154 69 L156 98 L142 121" fill="none" stroke="#dffcff" strokeWidth="0.6" opacity="0.33" />
      <path d="M71 45 L100 35 L129 45 M66 58 L100 47 L134 58" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.22" />
      <path d="M59 80 L71 72 H94 L105 83 L99 96 H69 L56 90 Z" fill={accent} opacity="0.2" filter={`url(#${id}-softGlow)`} />
      <path d="M141 80 L129 72 H106 L95 83 L101 96 H131 L144 90 Z" fill={accent} opacity="0.2" filter={`url(#${id}-softGlow)`} />
      <ellipse cx="80" cy="85" rx="24" ry="12" fill={`url(#${id}-eyeCore)`} opacity={eyeOpacity} filter={`url(#${id}-eyeGlow)`} />
      <ellipse cx="120" cy="85" rx="24" ry="12" fill={`url(#${id}-eyeCore)`} opacity={eyeOpacity} filter={`url(#${id}-eyeGlow)`} />
      <rect x="63" y="82" width="35" height="5" rx="2.5" fill="#ffffff" opacity="0.48" />
      <rect x="102" y="82" width="35" height="5" rx="2.5" fill="#ffffff" opacity="0.48" />
      <path d="M91 98 L100 108 L109 98" fill="none" stroke={accent} strokeWidth="0.65" opacity="0.34" />
      <path d="M69 116 L83 112 L96 116 H104 L117 112 L131 116" fill="none" stroke={accent} strokeWidth="1.25" opacity={isSpeaking ? 0.85 : isListening ? 0.64 : 0.4} strokeLinecap="round" filter={`url(#${id}-softGlow)`} />
      <path d="M75 129 L91 138 H109 L125 129" fill="none" stroke="#eaffff" strokeWidth="0.6" opacity="0.22" />
      <path d="M73 135 C85 146 115 146 127 135" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.14" />
      <circle cx="100" cy="36" r="2.4" fill={accent} opacity={isListening ? 0.9 : 0.42} filter={`url(#${id}-softGlow)`} />
    </svg>
  );
}

function OrbHero({ isListening, isSpeaking, orbSize }: { isListening: boolean; isSpeaking: boolean; orbSize: number }) {
  const particles = useMemo(makeOrbParticles, []);
  const accent = isListening ? "#00ffcc" : isSpeaking ? "#38e8ff" : "#7ae8ff";
  const ring1 = orbSize + 30;
  const ring2 = orbSize + 50;
  const glowSize = orbSize + 100;

  return (
    <div className="orb-stage" style={{ width: ring2, height: ring2 }}>
      <div className="orb-aura" style={{ width: glowSize, height: glowSize }} />
      <div className="orb-ring orb-ring--one" style={{ width: ring1, height: ring1 }} />
      <div className="orb-ring orb-ring--two" style={{ width: ring2, height: ring2 }} />
      {particles.map((particle) => (
        <div key={particle.id} className="orb-particle" style={{ left: `${particle.left}%`, bottom: `${particle.bottom}%`, animationDuration: `${particle.duration}s`, animationDelay: `${particle.delay}s`, width: particle.size, height: particle.size }} />
      ))}
      <motion.div
        className="orb-sphere"
        style={{ width: orbSize, height: orbSize }}
        animate={isListening ? { scale: [1, 1.035, 1] } : isSpeaking ? { scale: [1, 1.018, 1] } : { scale: 1 }}
        transition={{ duration: isListening ? 1.4 : 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelConstellation accent={accent} />
        <FuturisticFace isListening={isListening} isSpeaking={isSpeaking} />
      </motion.div>
    </div>
  );
}

// ── Tab Panels ──────────────────────────────────────────────────

function VoicePanel({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  return (
    <div className="tab-panel-content">
      <div className="feature-icon feature-icon--voice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
      <div className="panel-title">Voice Command</div>
      <div className="hint-box">
        <div className="hint-label">Try saying:</div>
        {["Explain quadratic equations", "Quiz me on trigonometry", "Show me a diagram"].map((command) => (
          <button key={command} type="button" onClick={() => onVoiceSend(command)} className="hint-command">
            &ldquo;{command}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadPanel({ onVisionSend }: { onVisionSend: (file: File) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("Upload a question, diagram, or worksheet image.");

  const handleUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;

    if (!VISION_TYPES.has(file.type)) {
      setStatus("error");
      setMessage("Only JPG, PNG, and WebP files are supported.");
      return;
    }

    if (file.size > MAX_VISION_BYTES) {
      setStatus("error");
      setMessage("Please upload an image up to 10 MB.");
      return;
    }

    setStatus("uploading");
    setMessage(`Analyzing ${file.name}...`);

    try {
      await onVisionSend(file);
      setStatus("done");
      setMessage("Image analyzed. Open Chat to view the answer.");
    } catch (error) {
      setStatus("error");
      setMessage(getReadableError(error, "Vision analysis failed."));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onVisionSend]);

  return (
    <div className="tab-panel-content">
      <div className="feature-icon feature-icon--vision">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.5">
          <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <div className="panel-title">Vision Upload</div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => void handleUpload(event.target.files?.[0])} />
      <button type="button" disabled={status === "uploading"} onClick={() => inputRef.current?.click()} className="upload-btn">
        {status === "uploading" ? "Analyzing..." : "Choose File"}
      </button>
      <div className="upload-status" data-state={status}>{message}</div>
      <div className="hint-label">JPG, PNG, WEBP &mdash; Max 10MB</div>
    </div>
  );
}

function SchedulePanel({ board }: { board: Board }) {
  const data = BOARD_DATA[board].schedule;
  return (
    <div className="panel-list">
      <h3 className="panel-heading">Today&apos;s Schedule</h3>
      {data.map((item) => (
        <div key={`${item.time}-${item.subject}`} className={`schedule-row ${item.done ? "opacity-45" : item.active ? "schedule-row--active" : ""}`}>
          <span className="schedule-time">{item.time}</span>
          <div className="min-w-0 flex-1">
            <div className="schedule-subject">{item.subject}</div>
            <div className="schedule-topic">{item.topic}</div>
          </div>
          {item.done && <span className="status-done">&check;</span>}
          {item.active && <span className="status-active" />}
        </div>
      ))}
    </div>
  );
}

function ProgressPanel({ board }: { board: Board }) {
  const subjects = BOARD_DATA[board].subjects;
  const avg = Math.round(subjects.reduce((a, b) => a + b.pct, 0) / subjects.length);

  return (
    <div className="panel-list">
      <h3 className="panel-heading">Progress Report</h3>
      {subjects.map((subject) => (
        <div key={subject.name}>
          <div className="progress-title-row">
            <span>{subject.name}</span>
            <span style={{ color: subject.color }}>{subject.pct}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${subject.pct}%`, background: subject.color }} /></div>
        </div>
      ))}
      <div className="overall-card">
        <div className="hint-label">Overall Average</div>
        <div className="overall-value">{avg}%</div>
      </div>
    </div>
  );
}

function SyllabusPanel({ board, selectedClass }: { board: Board; selectedClass: string }) {
  const data = BOARD_DATA[board];
  return (
    <div className="panel-list panel-list--tight">
      <h3 className="panel-heading">{data.label} &mdash; {selectedClass}</h3>
      {data.chapters.map((chapter, index) => (
        <div key={chapter.title} className={`chapter-row ${chapter.status === "locked" ? "opacity-35" : ""}`}>
          <div className={`chapter-badge chapter-badge--${chapter.status}`}>
            {chapter.status === "done" ? "&check;" : chapter.status === "active" ? "&#9654;" : "&#128274;"}
          </div>
          <div className="chapter-title">Ch {index + 1}: {chapter.title}</div>
        </div>
      ))}
    </div>
  );
}

function BoardSelector({ board, onBoardChange, selectedClass, onClassChange }: {
  board: Board;
  onBoardChange: (b: Board) => void;
  selectedClass: string;
  onClassChange: (c: string) => void;
}) {
  const data = BOARD_DATA[board];
  return (
    <div className="board-selector">
      <div className="board-tabs">
        <button type="button" className={`board-tab ${board === "cbse" ? "active" : ""}`} onClick={() => { onBoardChange("cbse"); onClassChange(BOARD_DATA.cbse.defaultClass); }}>CBSE</button>
        <button type="button" className={`board-tab ${board === "cambridge" ? "active" : ""}`} onClick={() => { onBoardChange("cambridge"); onClassChange(BOARD_DATA.cambridge.defaultClass); }}>Cambridge</button>
      </div>
      <select className="class-select" value={selectedClass} onChange={(e) => onClassChange(e.target.value)}>
        {data.classes.map((cls) => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>
    </div>
  );
}

function PanelForTab({ tab, onVoiceSend, onVisionSend, board, selectedClass }: {
  tab: string;
  onVoiceSend: (text: string) => void;
  onVisionSend: (file: File) => Promise<void>;
  board: Board;
  selectedClass: string;
}) {
  switch (tab) {
    case "voice": return <VoicePanel onVoiceSend={onVoiceSend} />;
    case "upload": return <UploadPanel onVisionSend={onVisionSend} />;
    case "schedule": return <SchedulePanel board={board} />;
    case "progress": return <ProgressPanel board={board} />;
    case "syllabus": return <SyllabusPanel board={board} selectedClass={selectedClass} />;
    default: return null;
  }
}

// ── Chat Panel Component ───────────────────────────────────────

function ChatPanel({
  messages,
  input,
  setInput,
  send,
  onKey,
  endRef,
  providerInfo,
  progress,
  isCompact,
  boardLabel,
  selectedClass,
  isSending,
}: {
  messages: Msg[];
  input: string;
  setInput: (value: string) => void;
  send: () => void;
  onKey: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  endRef: RefObject<HTMLDivElement | null>;
  providerInfo: string;
  progress: number;
  isCompact?: boolean;
  boardLabel: string;
  selectedClass: string;
  isSending: boolean;
}) {
  return (
    <section className="chat-panel-root">
      <header className={`chat-header ${isCompact ? "chat-header--compact" : ""}`}>
        <div className="min-w-0">
          <div className="chat-title">EduOrb &ndash; AI Tutor</div>
          <div className="chat-provider truncate">{providerInfo || `${boardLabel} &middot; Online`}</div>
        </div>
        <div className="chat-class">
          <div>{selectedClass} {boardLabel.split(" ")[0]}</div>
          <div className="progress-track mt-1"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className={`chat-scroll ${isCompact ? "chat-scroll--compact" : ""}`} aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`chat-bubble ${message.role === "user" ? "chat-bubble--user" : "chat-bubble--bot"}`}>
              {message.meta && <div className="message-meta">{message.meta}</div>}
              {message.text || <span className="typing-cursor" />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {!isCompact && <div className="chat-diagram-wrap"><MathDiagram /></div>}

      <footer className={`chat-input-wrap ${isCompact ? "chat-input-wrap--compact" : ""}`}>
        <div className="chat-input-row">
          <textarea
            value={input}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
            onKeyDown={onKey}
            placeholder={isSending ? "AI is thinking..." : "Ask EduOrb anything..."}
            className="chat-input flex-1"
            rows={1}
            disabled={isSending}
          />
          <button type="button" onClick={send} disabled={!input.trim() || isSending} className="send-btn">
            {isSending ? "..." : "Send"}
          </button>
        </div>
      </footer>
    </section>
  );
}

// ── Retry-capable fetch ─────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      // Don't retry on 4xx client errors (except 429 rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Request failed (${response.status})`);
      }
      lastError = new Error(`Server error (${response.status})`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError || new Error("Request failed after retries");
}

// ── Main ────────────────────────────────────────────────────────

export default function SessionSetup() {
  const [activeTab, setActiveTab] = useState("voice");
  const [input, setInput] = useState("");
  const [providerInfo, setProviderInfo] = useState("");
  const [messages, setMessages] = useState<Msg[]>(SEED_MESSAGES.map((message, index) => ({ id: String(index), ...message })));
  const [showChat, setShowChat] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [board, setBoard] = useState<Board>("cbse");
  const [selectedClass, setSelectedClass] = useState(BOARD_DATA.cbse.defaultClass);
  const endRef = useRef<HTMLDivElement>(null);
  const orbSize = useOrbSize();
  const lastVoiceSentRef = useRef("");

  // Use refs for values needed inside callbacks to avoid stale closures
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const { isListening, transcript, isSupported: voiceSupported, error: voiceError, startListening, stopListening, resetTranscript } = useVoice();
  const { speak: ttsSpeak, stop: ttsStop } = useTTS();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMsg = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    // Prevent duplicate messages (same text sent within 3 seconds)
    const now = Date.now();
    const lastMsg = messagesRef.current[messagesRef.current.length - 1];
    if (lastMsg && lastMsg.role === "user" && lastMsg.text.trim() === trimmed && now - (lastMsg.timestamp || 0) < 3000) {
      console.log("[chat] Duplicate message blocked:", trimmed.slice(0, 30));
      return;
    }

    const userMessage: Msg = { id: crypto.randomUUID(), role: "user", text: trimmed, timestamp: now };
    const botId = crypto.randomUUID();
    const visibleMessages = [...messagesRef.current, userMessage];
    const displayMessages: Msg[] = [...visibleMessages, { id: botId, role: "bot", text: "" }];

    setMessages(displayMessages);
    setShowChat(true);
    setIsSending(true);

    try {
      const response = await fetchWithRetry("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(visibleMessages), subject: activeTab }),
      });

      let raw = "";
      let gotError = false;
      await readChatStream(response, (payload) => {
        if (payload.providers) setProviderInfo(payload.providers);
        if (payload.error) {
          gotError = true;
          throw new Error(payload.error);
        }
        if (payload.delta) {
          raw += payload.delta;
          const clean = stripThink(raw);
          setMessages((previous) => previous.map((message) => message.id === botId ? { ...message, text: clean } : message));
        }
      });

      const finalClean = stripThink(raw);
      if (finalClean) {
        setMessages((previous) => previous.map((message) => message.id === botId ? { ...message, text: finalClean } : message));
        setIsSpeaking(true);
        stopListening();
        ttsSpeak(finalClean, () => setIsSpeaking(false));
      } else {
        setMessages((previous) => previous.map((message) => message.id === botId ? { ...message, text: "I couldn&apos;t generate a response. Please try again." } : message));
      }
    } catch (error) {
      console.error("[chat] sendMsg error:", error);
      setIsSpeaking(false);
      setMessages((previous) => previous.map((message) => message.id === botId ? { ...message, text: getReadableError(error, "AI service is temporarily unavailable. Please try again.") } : message));
    } finally {
      setIsSending(false);
    }
  }, [activeTab, isSending, ttsSpeak, stopListening]);

  const handleVisionUpload = useCallback(async (file: File) => {
    const userId = crypto.randomUUID();
    const botId = crypto.randomUUID();

    setMessages((previous) => [
      ...previous,
      { id: userId, role: "user", text: `Uploaded image: ${file.name}`, meta: "Vision request" },
      { id: botId, role: "bot", text: "" },
    ]);
    setShowChat(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("prompt", "Analyze this uploaded educational image. Explain the solution clearly, step by step, and keep the answer student-friendly.");

    const response = await fetchWithRetry("/api/vision", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({} as { answer?: string; provider?: string; error?: string }));

    if (!response.ok) {
      const message = typeof data.error === "string" ? data.error : `Vision request failed (${response.status})`;
      setMessages((previous) => previous.map((item) => item.id === botId ? { ...item, text: message } : item));
      throw new Error(message);
    }

    const answer = stripThink(typeof data.answer === "string" && data.answer.trim() ? data.answer : "No answer returned from vision provider.");
    if (typeof data.provider === "string" && data.provider.trim()) {
      setProviderInfo(`Vision: ${data.provider}`);
    }
    setMessages((previous) => previous.map((item) => item.id === botId ? { ...item, text: answer } : item));
  }, []);

  useEffect(() => {
    if (transcript && !isListening) {
      const finalTranscript = transcript.trim();
      // Prevent re-triggering: skip if same transcript was already sent
      if (finalTranscript && finalTranscript !== lastVoiceSentRef.current) {
        lastVoiceSentRef.current = finalTranscript;
        setInput("");
        resetTranscript();
        void sendMsg(finalTranscript);
      }
    }
    return undefined;
  }, [isListening, sendMsg, transcript]);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    void sendMsg(trimmed);
  }, [input, sendMsg, isSending]);

  const onKey = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }, [send]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) {
        ttsStop();
        setIsSpeaking(false);
      }
      startListening();
    }
  }, [isListening, isSpeaking, startListening, stopListening, ttsStop]);

  const openTab = useCallback((tab: string, shouldShowChat = false) => {
    setActiveTab(tab);
    setShowChat(shouldShowChat);
  }, []);

  const boardLabel = BOARD_DATA[board].label;

  return (
    <div className="app-root">
      <div className="cosmos" /><Stars />
      <div className="nebula-glow nebula-glow--purple" />
      <div className="nebula-glow nebula-glow--blue" />
      <div className="nebula-glow nebula-glow--cyan" />

      {/* Desktop */}
      <div className="desktop-shell">
        <aside className="glass desktop-sidebar">
          <div className="brand-row">
            <LogoIcon className="w-7 h-7" />
            <span className="brand-text">EduOrb</span>
          </div>
          <BoardSelector board={board} onBoardChange={setBoard} selectedClass={selectedClass} onClassChange={setSelectedClass} />
          <nav className="nav-list">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => openTab(item.id)} className={`nav-item ${activeTab === item.id ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon} /></svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="parent-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
            Parent Connect
          </button>
        </aside>

        <main className="desktop-center">
          <div className="orb-copy">
            <motion.div initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
              <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            </motion.div>
            <h1 className="app-title">EduOrb</h1>
            <span className="orb-status">{isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to speak"}</span>
            {voiceError && voiceError !== "no-speech" && <span className="voice-error">Mic error: {voiceError}</span>}
            <button type="button" className={`voice-btn mt-4 ${isListening ? "active" : ""}`} onClick={toggleVoice} disabled={isSending && !isListening}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : isSpeaking ? "Tap to interrupt" : "Voice Command"}
            </button>
            {!voiceSupported && <span className="voice-error">Voice not supported in this browser</span>}
          </div>
          <div className="glass info-panel">
            <PanelForTab tab={activeTab} onVoiceSend={sendMsg} onVisionSend={handleVisionUpload} board={board} selectedClass={selectedClass} />
          </div>
        </main>

        <aside className="glass desktop-chat">
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            send={send}
            onKey={onKey}
            endRef={endRef}
            providerInfo={providerInfo}
            progress={Math.round(BOARD_DATA[board].subjects.reduce((a, b) => a + b.pct, 0) / BOARD_DATA[board].subjects.length)}
            boardLabel={boardLabel}
            selectedClass={selectedClass}
            isSending={isSending}
          />
        </aside>
      </div>

      {/* Tablet */}
      <div className="tablet-shell">
        <header className="tablet-topbar glass">
          <div className="brand-row brand-row--compact"><LogoIcon className="w-6 h-6" /><span className="brand-text">EduOrb</span></div>
          <BoardSelector board={board} onBoardChange={setBoard} selectedClass={selectedClass} onClassChange={setSelectedClass} />
          <div className="topbar-actions">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => openTab(item.id)} className={`topbar-icon ${activeTab === item.id ? "active" : ""}`} aria-label={item.label}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon} /></svg>
              </button>
            ))}
          </div>
        </header>
        <div className="tablet-main">
          <main className="tablet-center">
            <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            <h1 className="app-title app-title--tablet">EduOrb</h1>
            <button type="button" className={`voice-btn mt-3 text-xs ${isListening ? "active" : ""}`} onClick={toggleVoice} disabled={isSending && !isListening}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : isSpeaking ? "Interrupt" : "Voice"}
            </button>
            <div className="glass info-panel info-panel--tablet">
              <PanelForTab tab={activeTab} onVoiceSend={sendMsg} onVisionSend={handleVisionUpload} board={board} selectedClass={selectedClass} />
            </div>
          </main>
          <aside className="glass tablet-chat">
            <ChatPanel
              messages={messages}
              input={input}
              setInput={setInput}
              send={send}
              onKey={onKey}
              endRef={endRef}
              providerInfo={providerInfo}
              progress={Math.round(BOARD_DATA[board].subjects.reduce((a, b) => a + b.pct, 0) / BOARD_DATA[board].subjects.length)}
              boardLabel={boardLabel}
              selectedClass={selectedClass}
              isSending={isSending}
            />
          </aside>
        </div>
      </div>

      {/* Mobile */}
      <div className="mobile-shell">
        <header className="mobile-topbar glass">
          <div className="brand-row brand-row--compact"><LogoIcon className="w-6 h-6" /><span className="brand-text">EduOrb</span></div>
          <div className="mobile-topbar-right">
            <div className="mobile-board-toggle">
              <button type="button" className={`board-pill ${board === "cbse" ? "active" : ""}`} onClick={() => { setBoard("cbse"); setSelectedClass(BOARD_DATA.cbse.defaultClass); }}>CBSE</button>
              <button type="button" className={`board-pill ${board === "cambridge" ? "active" : ""}`} onClick={() => { setBoard("cambridge"); setSelectedClass(BOARD_DATA.cambridge.defaultClass); }}>Cambridge</button>
            </div>
            <button type="button" onClick={() => setShowChat((value) => !value)} className="mobile-toggle">
              {showChat ? "Orb" : "Chat"}
            </button>
          </div>
        </header>

        {!showChat ? (
          <main className="mobile-orb-view">
            <OrbHero isListening={isListening} isSpeaking={isSpeaking} orbSize={orbSize} />
            <h1 className="app-title app-title--mobile">EduOrb</h1>
            <span className="orb-status">{isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to speak"}</span>
            {voiceError && voiceError !== "no-speech" && <span className="voice-error">Mic error: {voiceError}</span>}
            <button type="button" className={`voice-btn mt-4 text-xs ${isListening ? "active" : ""}`} onClick={toggleVoice} disabled={isSending && !isListening}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
              {isListening ? "Listening..." : isSpeaking ? "Tap to interrupt" : "Voice Command"}
            </button>
            {!voiceSupported && <span className="voice-error">Voice not supported in this browser</span>}
            <div className="glass info-panel info-panel--mobile">
              <PanelForTab tab={activeTab} onVoiceSend={sendMsg} onVisionSend={handleVisionUpload} board={board} selectedClass={selectedClass} />
            </div>
          </main>
        ) : (
          <div className="mobile-chat-view">
            <ChatPanel
              messages={messages}
              input={input}
              setInput={setInput}
              send={send}
              onKey={onKey}
              endRef={endRef}
              providerInfo={providerInfo}
              progress={Math.round(BOARD_DATA[board].subjects.reduce((a, b) => a + b.pct, 0) / BOARD_DATA[board].subjects.length)}
              isCompact
              boardLabel={boardLabel}
              selectedClass={selectedClass}
              isSending={isSending}
            />
          </div>
        )}

        <nav className="mobile-bottom-nav glass">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} type="button" onClick={() => openTab(item.id, false)} className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
