import { streamChat, type ChatMessage } from "@/lib/ai/client";
import { getAvailableProviders, CBSE_SYSTEM_PROMPT } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARS = 6000;
const STREAM_TIMEOUT_MS = 20000; // 20s — skipRemainingGroq saves ~5s, so effective max is ~15s

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
    const body = await request.json().catch(() => null) as { messages?: unknown; temperature?: unknown; memoryContext?: string } | null;
    const normalizedMessages = normalizeMessages(body?.messages);

    if (normalizedMessages.length === 0) {
      return Response.json({ error: "At least one message is required" }, { status: 400 });
    }

    const temperature = typeof body?.temperature === "number" && Number.isFinite(body.temperature)
      ? Math.min(1.2, Math.max(0, body.temperature))
      : 0.7;

    const memoryContext = typeof body?.memoryContext === "string" ? body.memoryContext : "";

    const available = getAvailableProviders();
    const providerList = available.length > 0 ? available.map((provider) => provider.name).join(" → ") : "No provider configured";
    
    // Diagnostic: log provider availability
    console.log(`[chat] Providers: ${providerList}, available count: ${available.length}`);
    console.log(`[chat] GROQ_API_KEY set: ${!!process.env.GROQ_API_KEY}, GOOGLE_API_KEY set: ${!!process.env.GOOGLE_API_KEY}`);
    
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ providers: providerList })}\n\n`));

        try {
          let chunkCount = 0;
          let gotError = false;

          // Wrap streamChat with a timeout
          const streamPromise = streamChat({
            messages: normalizedMessages,
            temperature,
            systemPrompt: CBSE_SYSTEM_PROMPT + memoryContext,
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
            gotError = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI_UNAVAILABLE" })}\n\n`));
          }
        } catch (error) {
          console.error("[chat] Stream error:", error);
          // Send error signal so frontend can retry (not a delta that looks like content)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI_UNAVAILABLE" })}\n\n`));
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
