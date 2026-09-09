import { streamChat, type ChatMessage } from "@/lib/ai/client";
import { getAvailableProviders, CBSE_SYSTEM_PROMPT } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARS = 6000;
const STREAM_TIMEOUT_MS = 12000; // 12s to fit within Netlify free tier ~10-15s function limit

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((message): message is { role: string; content: string } => (
      !!message &&
      typeof message === "object" &&
      typeof (message as { role?: unknown }).role === "string" &&
      typeof (message as { content?: unknown }).content === "string"
    ))
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
      content: message.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES) as ChatMessage[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { messages?: unknown; temperature?: unknown } | null;
    const normalizedMessages = normalizeMessages(body?.messages);

    if (normalizedMessages.length === 0) {
      return Response.json({ error: "At least one message is required" }, { status: 400 });
    }

    const temperature = typeof body?.temperature === "number" && Number.isFinite(body.temperature)
      ? Math.min(1.2, Math.max(0, body.temperature))
      : 0.7;

    const available = getAvailableProviders();
    const providerList = available.length > 0 ? available.map((provider) => provider.name).join(" → ") : "No provider configured";
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ providers: providerList })}\n\n`));

        try {
          let chunkCount = 0;

          // Wrap streamChat with a timeout
          const streamPromise = streamChat({
            messages: normalizedMessages,
            temperature,
            systemPrompt: CBSE_SYSTEM_PROMPT,
            onChunk: (text) => {
              chunkCount += 1;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            },
            onError: (error, providerName) => {
              console.error(`[chat] ${providerName} error:`, error.message);
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Stream timed out")), STREAM_TIMEOUT_MS)
          );

          await Promise.race([streamPromise, timeoutPromise]);

          if (chunkCount === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: "I couldn't generate a response. Please try again." })}\n\n`));
          }
        } catch (error) {
          console.error("[chat] Stream error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: "AI service is temporarily unavailable. Please try again." })}\n\n`));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[chat] Route error:", error);
    return Response.json({ error: "Failed to stream response" }, { status: 500 });
  }
}
