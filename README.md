# EDU-ORB — AI Tutor

A self-hostable AI tutor with an animated armored tutor hero, streaming cloud AI,
and natural voice. Built with **Next.js 15 (App Router)**, **React 19**,
**TypeScript**, **Tailwind CSS**, and **Framer Motion**.

![stack](https://img.shields.io/badge/Next.js%2015-React%2019-TypeScript-blue)

## Features

- 🎓 **Animated Orb avatar** — idle / listening / speaking / thinking / error states
- 🛡️ **Iron Man visor face** — JARVIS-inspired helmet with state-aware glow
- 💬 **Streaming chat** — SSE streamed responses rendered as they arrive
- 📚 **Lesson mode** — auto-generated lesson plans with key points
- 📝 **Quiz mode** — auto-generated multiple-choice quizzes with score tracking
- 🗣️ **Voice command** — speech-to-text with continuous listening + browser TTS
- 🔁 **6-provider AI chain** — automatic failover across providers
- 📊 **Session progress** — message counts, time spent, quiz score
- 🖼️ **Vision upload** — image analysis via Ollama/LLaVA
- 🔐 **GPG encrypted vault** — API keys stored securely at rest

## Provider Chain (6 providers, tried in order)

| # | Provider | Model | Limit | Notes |
|---|----------|-------|-------|-------|
| 1 | **Local Ollama** | qwen2.5:3b | Unlimited | Fastest, runs on GTX 1650 |
| 2 | **Groq** | qwen3.8-27b | 200K tokens/day | Fast cloud inference |
| 3 | **NVIDIA NIM** | nemotron-3-super-120b | 40 RPM, no daily cap | 120+ free models |
| 4 | **NVIDIA NIM** | deepseek-v4-flash | 40 RPM, no daily cap | Backup NVIDIA model |
| 5 | **Gemini** | 3.5-flash-lite | Free tier | Google fallback |
| 6 | **Groq-Backup** | qwen3.6-27b | Same key as #2 | Last resort |

**Smart failover:** If a provider returns 429, all models from that provider are skipped.

## Getting Started

### Prerequisites

- Node.js 18.18+ (tested on 24.x)
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

```bash
cp .env.example .env.local
```

Required keys (at least one AI provider):

| Variable | Provider | Required |
|----------|----------|----------|
| `GROQ_API_KEY` | Groq (primary) | optional |
| `NVIDIA_API_KEY` | NVIDIA NIM (120+ models) | optional |
| `GOOGLE_API_KEY` | Google Gemini | optional |

Get free keys:
- **Groq:** https://console.groq.com (200K tokens/day)
- **NVIDIA NIM:** https://build.nvidia.com (40 RPM, no daily cap)
- **Gemini:** https://aistudio.google.com (free tier)

### 3. Run

```bash
# Development (port 3311)
npm run dev

# Production
npm run build
npm start
```

### GPG Encrypted Vault

API keys are stored encrypted at `~/.edu-orb-vault/secrets.gpg`:

```bash
# Unlock (decrypt to .env.local)
~/.edu-orb-vault/unlock.sh

# Lock (encrypt .env.local back to vault)
~/.edu-orb-vault/lock.sh

# Status
~/.edu-orb-vault/status.sh
```

## Architecture

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
                              │  Ollama → Groq → NVIDIA NIM  │
                              │  → Gemini → Groq-Backup      │
                              └──────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/ai/providers.ts` | Provider registry, system prompts, key lookup |
| `src/lib/ai/client.ts` | `streamChat` (SSE + fallback) and `complete` (JSON) |
| `src/app/SessionSetup.tsx` | Main UI with voice, chat, panels |
| `src/app/api/chat/route.ts` | Chat API route |
| `src/app/api/health/route.ts` | Provider health check endpoint |

### API Routes

| Route | Method | Body | Returns |
|-------|--------|------|---------|
| `/api/chat` | POST | `{ messages, subject }` | SSE stream |
| `/api/lesson` | POST | `{ topic, level }` | `{ lesson, quiz }` |
| `/api/health` | GET | — | Provider status JSON |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3311) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint check |

## Deployment

### Netlify (current)

```bash
# Draft deploy
netlify deploy --dir=.next --site SITE_ID

# Promote to production
DRAFT_ID=$(netlify api listSiteDeploys --data '{"site_id":"SITE_ID","per_page":1}' | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
netlify api restoreSiteDeploy --data '{"site_id":"SITE_ID","deploy_id":"DRAFT_ID"}'
```

### Environment Variables (Netlify)

```bash
netlify env:set GROQ_API_KEY "gsk_..."
netlify env:set NVIDIA_API_KEY "nvapi-..."
netlify env:set GOOGLE_API_KEY "AIza..."
```

## Known Limitations

- Speech recognition requires Chrome/Edge/Safari on HTTPS or localhost
- Voice command works best with clear, short phrases
- Groq has 200K tokens/day limit (NVIDIA NIM has no daily cap as backup)
- Browser TTS is robotic — consider ElevenLabs for production

## License

MIT
