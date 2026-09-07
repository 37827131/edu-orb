import { streamChat, type ChatMessage } from "@/lib/ai/client";
import { getAvailableProviders } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, systemPrompt, temperature } = body as {
      messages: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      temperature?: number;
    };

    const normalizedMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role as ChatMessage["role"],
      content: m.content,
    }));

    // Show which providers are configured
    const available = getAvailableProviders();
    const providerList = available.map((p) => p.name).join(" → ");

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Send provider chain info
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ providers: providerList })}\n\n`)
        );

        try {
          let chunkCount = 0;
          let prevCleanLen = 0;

          await streamChat({
            messages: normalizedMessages,
            systemPrompt: systemPrompt ?? undefined,
            temperature: temperature ?? 0.7,
            onChunk: (text) => {
              chunkCount++;
              // Send raw delta — client handles think stripping
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            },
            onError: (err) => {
              console.error("[chat] Provider error:", err.message);
            },
          });

          if (chunkCount === 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: "I couldn't generate a response. Please try again." })}\n\n`)
            );
          }
        } catch (err) {
          console.error("[chat] Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: "AI service is temporarily unavailable. Please try again." })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[chat] Route error:", err);
    return new Response(JSON.stringify({ error: "Failed to stream response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
