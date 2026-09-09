/**
 * EDU-ORB AI Provider Layer
 *
 * Hybrid architecture — 6 providers, tried in order:
 *   1. LOCAL Ollama — fastest, zero cost, runs on GTX 1650
 *   2. Groq — fast cloud (free tier, 200K tokens/day)
 *   3. NVIDIA NIM — 120+ free models, 40 RPM, no daily cap
 *   4. Google Gemini — free tier fallback
 *   5. Groq-Backup — different model, same key (last resort)
 *
 * When running on Netlify (serverless), Ollama is unreachable,
 * so it auto-skips to cloud providers.
 *
 * Environment variables (loaded from .env.local):
 *   OLLAMA_URL           — Local Ollama endpoint (default: http://127.0.0.1:11434)
 *   OLLAMA_CHAT_MODEL    — Local model (default: qwen2.5:7b)
 *   OLLAMA_VISION_MODEL  — Local vision model (default: llava:7b)
 *   GROQ_API_KEY         — Groq (fast inference, primary cloud)
 *   NVIDIA_API_KEY       — NVIDIA NIM (120+ free models, no daily cap)
 *   GOOGLE_API_KEY       — Google Gemini (free tier)
 */

export interface ProviderConfig {
  name: string;
  baseURL: string;
  apiKeyEnv: string;
  defaultModel: string;
  headers?: Record<string, string>;
  requiresApiKey?: boolean;
  /** If true, provider is skipped when DEPLOY_ENV=netlify (serverless) */
  skipOnNetlify?: boolean;
}

/**
 * Provider chain — tried in order.
 * Local Ollama is first (fastest, free), cloud providers follow as fallback.
 * NVIDIA NIM is inserted early because it has 40 RPM with no daily cap.
 */
export const PROVIDERS: ProviderConfig[] = [
  // ── LOCAL ──
  {
    name: "Local Ollama",
    baseURL: `${(process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "")}/v1`,
    apiKeyEnv: "OLLAMA_API_KEY",
    defaultModel: process.env.OLLAMA_CHAT_MODEL || "qwen2.5:3b",
    requiresApiKey: false,
    skipOnNetlify: true,
  },

  // ── CLOUD (tried in order) ──
  {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "qwen/qwen3.8-27b",
  },
  {
    name: "NVIDIA NIM",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKeyEnv: "NVIDIA_API_KEY",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b",
  },
  {
    name: "NVIDIA NIM (DeepSeek)",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKeyEnv: "NVIDIA_API_KEY",
    defaultModel: "deepseek-ai/deepseek-v4-flash-0731",
  },
  {
    name: "Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKeyEnv: "GOOGLE_API_KEY",
    defaultModel: "gemini-3.5-flash-lite",
  },
  {
    name: "Groq-Backup",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "qwen/qwen3.6-27b",
  },
];

/** Detect if running on Netlify serverless */
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.DEPLOY_ENV === "netlify" ||
    process.env.CONTEXT === "production" ||
    process.env.CONTEXT === "deploy-preview" ||
    // Netlify sets these automatically
    (typeof process.env.URL === "string" && process.env.URL.includes("netlify"))
  );
}

/**
 * Get the API key for a provider from environment.
 */
export function getApiKey(provider: ProviderConfig): string | undefined {
  const key = process.env[provider.apiKeyEnv];
  if (!key || key.trim().length === 0) return undefined;
  return key.trim();
}

/**
 * Check if a provider is available and should be tried.
 */
export function isProviderAvailable(provider: ProviderConfig): boolean {
  // Skip Ollama on Netlify (can't reach localhost)
  if (provider.skipOnNetlify && isNetlify()) return false;
  return provider.requiresApiKey === false || getApiKey(provider) !== undefined;
}

/**
 * Get providers that are available right now.
 */
export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDERS.filter(isProviderAvailable);
}

/**
 * Get a human-readable label showing which provider is active.
 */
export function getProviderStatus(): string {
  const available = getAvailableProviders();
  if (available.length === 0) return "No providers available";
  const primary = available[0];
  const fallbacks = available.length - 1;
  return `${primary.name}${fallbacks > 0 ? ` (+${fallbacks} fallback${fallbacks > 1 ? "s" : ""})` : ""}`;
}

// ── Vision provider (separate chain for image analysis) ──

export const VISION_PROVIDERS: ProviderConfig[] = [
  {
    name: "Local LLaVA",
    baseURL: `${(process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "")}/v1`,
    apiKeyEnv: "OLLAMA_API_KEY",
    defaultModel: process.env.OLLAMA_VISION_MODEL || "llava:7b",
    requiresApiKey: false,
    skipOnNetlify: true,
  },
  {
    name: "Groq Vision",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "llama-3.2-11b-vision-preview",
  },
  {
    name: "OpenRouter Vision",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "meta-llama/llama-3.2-11b-vision-instruct:free",
  },
];

// ── System Prompts ──

export const TUTOR_SYSTEM_PROMPT = `You are EDU-ARB, an AI tutor. Warm, encouraging, and patient.

IMPORTANT: Do NOT use <think> tags. Just answer directly. Keep responses concise (2-4 sentences).

Break complex topics into steps, check understanding, use analogies, celebrate progress. Adapt to student's level. Ask follow-up questions.`;

export const LESSON_SYSTEM_PROMPT = `You are EDU-ORB, an AI tutor. Create a structured lesson plan on the given topic for the indicated level.
Return a JSON object with this exact structure:
{
  "topic": "short topic name",
  "level": "beginner | intermediate | advanced",
  "overview": "2-3 sentence overview of the topic",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "quizQuestions": [
    {
      "question": "the question text",
      "answer": "the correct answer (short)",
      "distractors": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
      "explanation": "why the answer is correct"
    }
  ],
  "nextSteps": "1-2 sentence suggestion for what to learn next"
}

Rules:
- quizQuestions should have 3-5 questions
- Each distractor must be plausible but clearly wrong
- Keep everything concise and accurate
- Match the level: beginner = simple concepts, advanced = nuanced/technical`;

export const QUIZ_SYSTEM_PROMPT = `You are EDU-ORB, an AI tutor. Generate a quiz on the given topic for the indicated level.
Return a JSON object with this exact structure:
{
  "topic": "short topic name",
  "questions": [
    {
      "question": "the question text",
      "answer": "the correct answer (short, 1-5 words)",
      "distractors": ["wrong 1", "wrong 2", "wrong 3"],
      "explanation": "brief explanation of why the answer is correct"
    }
  ]
}

Rules:
- 5 questions total
- All questions must be answerable in 1-5 words
- Distractors must be plausible
- Match the difficulty to the level
- Keep explanations short (1 sentence)`;

export const CBSE_SYSTEM_PROMPT = `You are EDU-ARB, an AI tutor for CBSE NCERT and Cambridge IGCSE/A-Level.

IMPORTANT: Do NOT use <think> tags. Just give your answer directly. Keep responses concise (2-4 sentences unless explaining a complex concept).

Teaching approach: Break topics into small steps, check understanding, use examples, be encouraging.

Cover: Math, Science (Physics/Chemistry/Biology), Social Science, English, and other subjects across CBSE Classes 1-12 and Cambridge Year 7 to A-Level.

For CBSE: Follow NCERT textbooks, CBSE marking schemes, and question paper patterns.
For Cambridge: Cover IGCSE, AS/A Level syllabuses, past papers, and mark schemes.

To get started, ask for: Board (CBSE/Cambridge), Class/Year, Subject, Topic, and what they need.`;
