/**
 * EDU-ORB AI Client
 *
 * Streams completions from the first available provider.
 * Falls back through the provider list on failure.
 */

import {
  PROVIDERS,
  getApiKey,
  isProviderAvailable,
  TUTOR_SYSTEM_PROMPT,
  LESSON_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  type ProviderConfig,
} from "./providers";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface StreamingOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Fetch a streaming completion from a single provider.
 * Returns the Response object or throws.
 */
async function fetchFromProvider(
  provider: ProviderConfig,
  messages: ChatMessage[],
  options: StreamingOptions = {}
): Promise<Response> {
  const apiKey = getApiKey(provider);
  if (!apiKey && provider.requiresApiKey !== false) {
    throw new Error(`${provider.name}: API key not configured`);
  }

  const body: Record<string, unknown> = {
    model: provider.defaultModel || "gpt-4o-mini",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (provider.headers) {
    for (const [k, v] of Object.entries(provider.headers)) {
      headers[k] = String(v);
    }
  }

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `${provider.name}: HTTP ${response.status} — ${text.slice(0, 200)}`
    );
  }

  return response;
}

/**
 * Parse a streaming SSE response into an async iterable of text deltas.
 *
 * Handles both standard OpenAI-style SSE (data: {...}\n\n) and
 * any provider that sends newline-delimited JSON with a "delta" field.
 */
async function* parseStream(
  response: Response
): AsyncIterableIterator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6).trim();
      if (data === "[DONE]" || data === "") continue;

      try {
        const parsed = JSON.parse(data);
        const choice = parsed.choices?.[0];
        if (choice?.delta?.content) {
          yield choice.delta.content;
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

/**
 * Options for the chat streaming function.
 */
export interface ChatStreamOptions {
  messages: ChatMessage[];
  onChunk: (text: string) => void;
  onError?: (error: Error, providerName: string) => void;
  fallbackEnabled?: boolean;
  systemPrompt?: string;
  temperature?: number;
}

/**
 * Stream a completion, trying providers in order.
 * Falls back to the next provider on error.
 *
 * Yields text chunks via onChunk as they arrive.
 * Throws the last error if all providers fail.
 */
export async function streamChat({
  messages,
  onChunk,
  onError,
  fallbackEnabled = true,
  systemPrompt = TUTOR_SYSTEM_PROMPT,
  temperature = 0.7,
}: ChatStreamOptions): Promise<void> {
  // Prepend system message if not already present
  const allMessages: ChatMessage[] =
    messages[0]?.role === "system"
      ? messages
      : [{ role: "system", content: systemPrompt }, ...messages];

  const options: StreamingOptions = { temperature };

  const providersToTry = fallbackEnabled
    ? PROVIDERS
    : PROVIDERS.slice(0, 1);

  let lastError: Error = new Error("No providers available");

  for (const provider of providersToTry) {
    // Skip providers without keys
    if (!isProviderAvailable(provider)) {
      const skipErr = new Error(`${provider.name}: skipped (API key not configured or unreachable)`);
      console.log(`[ai] ${skipErr.message}`);
      lastError = skipErr;
      continue;
    }

    try {
      console.log(`[ai] Trying ${provider.name} (${provider.defaultModel})...`);
      const response = await fetchFromProvider(provider, allMessages, options);
      const stream = parseStream(response);

      let chunkCount = 0;
      for await (const chunk of stream) {
        onChunk(chunk);
        chunkCount++;
      }

      console.log(`[ai] ${provider.name} succeeded with ${chunkCount} chunks`);
      // Success — exit the fallback loop
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ai] ${provider.name} failed:`, lastError.message);
      if (onError) {
        onError(lastError, provider.name);
      }
      // Continue to next provider
    }
  }

  throw lastError;
}

/**
 * Non-streaming completion (for lesson/quiz generation where we need
 * the full JSON response before proceeding).
 */
export async function complete(
  messages: ChatMessage[],
  options: StreamingOptions = {}
): Promise<string> {
  const provider = PROVIDERS.find(isProviderAvailable);
  if (!provider) throw new Error("No AI provider configured");
  const apiKey = getApiKey(provider);
  if (!apiKey && provider.requiresApiKey !== false) throw new Error(`${provider.name}: API key not configured`);

  const body: Record<string, unknown> = {
    model: provider.defaultModel || "gpt-4o-mini",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (provider.headers) {
    for (const [k, v] of Object.entries(provider.headers)) {
      headers[k] = String(v);
    }
  }

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `${provider.name}: HTTP ${response.status} — ${text.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Generate a lesson plan. Uses the first available provider.
 * Returns parsed JSON from the LLM response.
 */
export interface LessonPlan {
  topic: string;
  level: string;
  overview: string;
  keyPoints: string[];
  quizQuestions: Array<{
    question: string;
    answer: string;
    distractors: string[];
    explanation: string;
  }>;
  nextSteps: string;
}

export async function generateLesson(
  topic: string,
  level: string,
  systemPrompt?: string
): Promise<LessonPlan> {
  const userPrompt = `Create a lesson plan on "${topic}" for a ${level} student.`;

  const systemContent = systemPrompt ?? LESSON_SYSTEM_PROMPT;
  const userContent = `${userPrompt}\n\nRespond with ONLY valid JSON. No markdown, no explanation.`;

  const raw = await complete(
    [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],    { temperature: 0.3, maxTokens: 2048 }
  );

  // Try to extract JSON from the response (handle markdown fences etc.)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM returned invalid lesson plan (no JSON found)");
  }

  return JSON.parse(jsonMatch[0]) as LessonPlan;
}

/**
 * Generate quiz questions. Uses the first available provider.
 */
export interface QuizQuestion {
  question: string;
  answer: string;
  distractors: string[];
  explanation: string;
}
export interface QuizPlan {
  topic: string;
  questions: QuizQuestion[];
}
export async function generateQuiz(
  topic: string,
  level: string,
  systemPrompt?: string
): Promise<QuizPlan> {
  const userPrompt = `Generate a quiz on "${topic}" for a ${level} student.`;

  const systemContent = systemPrompt ?? QUIZ_SYSTEM_PROMPT;
  const userContent = `${userPrompt}\n\nRespond with ONLY valid JSON. No markdown, no explanation.`;

  const raw = await complete(
    [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    { temperature: 0.3, maxTokens: 2048 }
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM returned invalid quiz (no JSON found)");
  }

  return JSON.parse(jsonMatch[0]) as QuizPlan;
}
