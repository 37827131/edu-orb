/**
 * EDU-ORB Voice Engine Hooks
 *
 * Provides:
 *  - useSpeechRecognition — browser-based speech-to-text (SpeechRecognition API)
 *  - useTextToSpeech     — streams TTS from /api/voice and plays audio
 *  - curated voice list  — pre-selected natural voices across providers
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ── Curated voice catalog ──────────────────────────────────────

export interface VoiceOption {
  id: string;
  label: string;
  provider: "elevenlabs" | "groq" | "gemini" | "browser";
  avatarUrl?: string;
  description: string;
  lang?: string;
}

/**
 * Pre-curated voices for EDU-ORB.
 * ElevenLabs voices: warm, natural, tutor-appropriate.
 * Browser voices: fallback when no cloud TTS key is set.
 */
export const VOICE_OPTIONS: VoiceOption[] = [
  // ElevenLabs — premier natural voices
  {
    id: "elevenlabs-bella",
    label: "Bella",
    provider: "elevenlabs",
    description: "Warm, friendly, expressive — our default tutor voice",
    avatarUrl: "https://elevenlabs.io/v1/eleven_multilingual_v2",
  },
  {
    id: "elevenlabs-daniel",
    label: "Daniel",
    provider: "elevenlabs",
    description: "Calm, deep, authoritative but approachable",
  },
  {
    id: "elevenlabs-sarah",
    label: "Sarah",
    provider: "elevenlabs",
    description: "Gentle, clear, patient — great for beginners",
  },
  {
    id: "elevenlabs-fable",
    label: "Fable",
    provider: "elevenlabs",
    description: "Bright, energetic, storytelling style",
  },
  // Groq — Orpheus TTS voices (fast, free with a Groq key)
  {
    id: "groq-tara",
    label: "Tara",
    provider: "groq",
    description: "Warm, clear Orpheus voice via Groq",
  },
  {
    id: "groq-dan",
    label: "Dan",
    provider: "groq",
    description: "Calm, deep Orpheus voice via Groq",
  },
  {
    id: "groq-zoe",
    label: "Zoe",
    provider: "groq",
    description: "Bright, friendly Orpheus voice via Groq",
  },
  // Gemini — natural Google voices
  {
    id: "gemini-default",
    label: "Gemini Voice",
    provider: "gemini",
    description: "Natural Google TTS voice (when Gemini key is set)",
  },
  // Browser — always available fallback
  {
    id: "browser-default",
    label: "System Voice",
    provider: "browser",
    description: "Built-in browser voice — always available",
  },
];

// ── Speech Recognition (STT) ───────────────────────────────────

export interface UseSpeechRecognitionOptions {
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

/**
 * Hook for browser-based speech recognition.
 * Uses the Web Speech API (SpeechRecognition /webkitSpeechRecognition).
 *
 * Requirements:
 *   - HTTPS or localhost
 *   - Microphone permission granted
 *   - Browser support (Chrome, Edge, Safari — NOT Firefox by default)
 */
export function useSpeechRecognition({
  onResult,
  onEnd,
  onError,
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check support on mount
  useEffect(() => {
    const supported = !!(window as Window).SpeechRecognition || !!(window as Window).webkitSpeechRecognition;
    setIsSupported(supported);
  }, []);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const handleResultRef = useRef(onResult);
  const handleEndRef = useRef(onEnd);
  const handleErrorRef = useRef(onError);

  // Keep callbacks fresh (they may change on each render)
  useEffect(() => {
    handleResultRef.current = onResult;
    handleEndRef.current = onEnd;
    handleErrorRef.current = onError;
  });

  const start = useCallback(() => {
    const SRConstructor =
      (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;

    if (!SRConstructor) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SRConstructor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setLastTranscript(final);
      setInterimText(interim);

      if (final) {
        handleResultRef.current?.(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone access denied. Please allow microphone permission."
          : event.error === "no-speech"
            ? "No speech detected — try speaking more clearly."
            : `Speech recognition error: ${event.error}`;
      setError(message);
      handleErrorRef.current?.(message);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      handleEndRef.current?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      setInterimText("");
      setLastTranscript("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recognition");
    }
  }, [continuous, interimResults]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  const abort = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    interimText,
    lastTranscript,
    error,
    isSupported,
    start,
    stop,
    abort,
  };
}

// ── Text-to-Speech (TTS) ───────────────────────────────────────

export interface UseTextToSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onPlaybackStatus?: (status: "idle" | "playing" | "paused" | "loading") => void;
}

export interface TTSAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
}

/**
 * Hook for streaming TTS audio from /api/voice and playing it.
 *
 * Flow:
 *  1. POST text to /api/voice → receives audio/mpeg stream
 *  2. Decode the stream into a blob
 *  3. Play via HTMLAudioElement
 *
 * The hook also tracks playback state for the UI.
 */
export function useTextToSpeech({
  onStart,
  onEnd,
  onError,
  onPlaybackStatus,
}: UseTextToSpeechOptions = {}) {
  const [state, setState] = useState<TTSAudioState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    currentTime: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const statusRef = useRef(onPlaybackStatus);
  useEffect(() => {
    statusRef.current = onPlaybackStatus;
  }, [onPlaybackStatus]);

  const speak = useCallback(
    async (text: string, voiceId?: string) => {
      // Clean up any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setState((s) => ({ ...s, isLoading: true, error: null, isPlaying: false }));
      statusRef.current?.("loading");

      onStart?.();

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            voice: voiceId,
            speed: 1.0,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({ error: "Unknown TTS error" }))) as { error?: string };
          throw new Error(errData.error ?? `TTS HTTP ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("audio")) {
          const textResp = await response.text().catch(() => "");
          throw new Error(
            contentType.includes("application/json")
              ? JSON.parse(textResp).error ?? "TTS returned non-audio response"
              : `TTS returned unexpected content type: ${contentType}`
          );
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setState((s) => ({ ...s, isPlaying: true, isLoading: false }));
          statusRef.current?.("playing");
        };

        audio.onpause = () => {
          setState((s) => ({ ...s, isPlaying: false }));
          statusRef.current?.("paused");
        };

        audio.onended = () => {
          setState((s) => ({
            ...s,
            isPlaying: false,
            isLoading: false,
            currentTime: 0,
            duration: 0,
          }));
          statusRef.current?.("idle");
          URL.revokeObjectURL(url);
          audioRef.current = null;
          onEnd?.();
        };

        audio.onerror = () => {
          const msg = audio.error?.message ?? "Audio playback failed";
          setState((s) => ({ ...s, error: msg, isLoading: false, isPlaying: false }));
          statusRef.current?.("idle");
          onError?.(msg);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        // Track time
        audio.ontimeupdate = () => {
          setState((s) => ({
            ...s,
            currentTime: audio.currentTime,
            duration: audio.duration || s.duration,
          }));
        };

        await audio.play();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, error: message, isLoading: false, isPlaying: false }));
        statusRef.current?.("idle");
        onError?.(message);
      }
    },
    [onStart, onEnd, onError]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    statusRef.current?.("idle");
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause();
      setState((s) => ({ ...s, isPlaying: false }));
      statusRef.current?.("paused");
    }
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !state.isPlaying && state.currentTime > 0) {
      audioRef.current.play().catch(() => {});
      setState((s) => ({ ...s, isPlaying: true }));
      statusRef.current?.("playing");
    }
  }, [state.isPlaying, state.currentTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    speak,
    stop,
    pause,
    resume,
  };
}

// ── Voice picker helper ────────────────────────────────────────

/**
 * Get the list of curated voices for the picker.
 *
 * Note: provider keys live server-side only (never exposed to the browser),
 * so all curated voices are listed and /api/voice falls back through
 * ElevenLabs → Groq → Gemini → error at request time.
 */
export function getAvailableVoices(): VoiceOption[] {
  return VOICE_OPTIONS;
}
