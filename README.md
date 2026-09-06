# EDU-ORB — AI Tutor

 A self-hostable AI tutor with an animated armored tutor hero, streaming cloud AI,
and natural voice selection. Built with **Next.js 15 (App Router)**, **React 19**,
**TypeScript**, **Tailwind CSS**, and **Framer Motion**.

![stack](https://img.shields.io/badge/Next.js%2015-React%2019-TypeScript-blue)

## Features

- 🎓 **Animated Orb avatar** — idle / listening / speaking / thinking / error states with ambient particles and glow effects
- 🛡️ **Armored tutor hero** — original Iron-Man-inspired helmet treatment with state-aware glow, listening, thinking, speaking, and error states
- 💬 **Streaming chat** — SSE streamed responses rendered as they arrive
- 📚 **Lesson mode** — auto-generated lesson plans with key points
- 📝 **Quiz mode** — auto-generated multiple-choice quizzes with instant feedback and score tracking
- 🗣️ **Voice** — speech-to-text dictation (browser mic) and text-to-speech via ElevenLabs / Gemini with a voice picker
- 🔁 **Multi-provider AI fallback** — Groq → OpenRouter → Gemini → GitHub Models, tried in order until one responds
- 📊 **Session progress** — message counts, time spent, quiz score
- 🖼️ **Vision upload** — local Ollama/LLaVA image-question analysis through `/api/vision`

## Getting started

### Prerequisites

- Node.js 18.18+ (tested on 24.x)
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

Copy the environment template and fill in at least **one** AI provider key:

```bash
cp .env.example .env.local   # or create .env.local manually
```

The following keys are read from `.env.local` (see `.env.local` in the repo root for the full list):

| Variable               | Provider         | Required |
| ---------------------- | ---------------- | -------- |
| `GROQ_API_KEY`         | Groq (primary)   | optional |
| `OPENROUTER_API_KEY`   | OpenRouter (free model) | optional |
| `GOOGLE_API_KEY`       | Google Gemini    | optional |
| `GITHUB_TOKEN`         | GitHub Models    | optional |
| `ELEVENLABS_API_KEY`   | TTS voice        | optional |

At least one AI provider key is required for chat/lesson/quiz features.
Without a key, the app runs but returns "API key not configured" errors.

Spoken responses use **Groq Orpheus TTS** (fast, free with `GROQ_API_KEY`)
as the first fallback after ElevenLabs — the first time you use it, accept the
model terms once at console.groq.com → Playground → `canopylabs/orpheus-v1-english`.
`ELEVENLABS_API_KEY` or `GOOGLE_API_KEY` are also supported; otherwise the
built-in browser "System Voice" is available as a fallback.

> `.env.local` is gitignored — never commit API keys.

### 3. Run

```bash
# Development (port 3311)
npm run dev

# Production (Next.js API routes enabled)
npm run build
npm start
```

Open http://localhost:3311.

### Self-hosted Docker

The original nginx static Dockerfile could not serve Next.js API routes. The current
Dockerfile uses Next.js standalone output and the dedicated Compose file includes
the web runtime, PostgreSQL, MinIO-compatible object storage, and Caddy:

```bash
cp .env.selfhost.example .env.selfhost
# Set strong values in .env.selfhost; do not commit it.
docker compose --env-file .env.selfhost -f docker-compose.eduorb.yml up -d --build
curl http://127.0.0.1:3311/api/health
```

The web container reaches a host Ollama service through
`host.docker.internal:11434`. For a fully containerized model, add the official
Ollama image with the NVIDIA runtime only on a host with NVIDIA Container Toolkit
and enough VRAM; the current GTX 1650 is suitable for small/quantized models but
not frontier-scale inference.

### Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start dev server on port 3311        |
| `npm run build`      | Production build                     |
| `npm start`          | Serve production build on port 3311  |
| `npm run typecheck`  | Run `tsc --noEmit`                   |
| `npm run lint`       | Run Next.js lint                     |

## How it works

```
┌─────────────────────┐   SSE stream    ┌──────────────────────┐
│  Tutor UI (client)  │ ──────────────▶ │  /api/chat           │
│  OrbAvatar          │ ◀────────────── │  /api/lesson         │
│  ChatPanel          │    JSON/audio   │  /api/voice          │
│  QuizPanel          │                 └──────────┬───────────┘
└─────────────────────┘                            │
                                                   ▼
                              ┌──────────────────────────────┐
                              │  AI provider layer (lib/ai)  │
                              │  Groq → OpenRouter → Gemini  │
                              │  → GitHub Models (fallback)  │
                              └──────────────────────────────┘
```

- **`src/lib/ai/providers.ts`** — provider registry, system prompts, key lookup
- **`src/lib/ai/client.ts`** — `streamChat` (SSE parsing + provider fallback) and `complete` (JSON for lesson/quiz generation)
- **`src/lib/voice/useVoice.ts`** — `useSpeechRecognition` (STT) and `useTextToSpeech` (TTS) hooks
- **`src/app/api/*`** — server routes that call providers with keys only ever read server-side (never shipped to the browser)

### API routes

| Route          | Method | Body                                        | Returns                          |
| -------------- | ------ | ------------------------------------------- | -------------------------------- |
| `/api/chat`    | POST   | `{ messages: [{role, content}], systemPrompt?, temperature? }` | SSE stream of `{type: "delta"}` events |
| `/api/lesson`  | POST   | `{ topic, level }`                          | `{ lesson, quiz }`               |
| `/api/voice`   | POST   | `{ text, voice?, speed? }`                  | `audio/mpeg` stream              |

## Known limitations

- Speech recognition requires Chrome/Edge/Safari on HTTPS or localhost (not Firefox).
- Gemini TTS via the `generateContent` audio modality is experimental; ElevenLabs is the preferred TTS provider.
