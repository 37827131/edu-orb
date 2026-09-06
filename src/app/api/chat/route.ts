import { streamChat, type ChatMessage } from "@/lib/ai/client";
import { getProviderStatus } from "@/lib/ai/providers";

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

    const encoder = new TextEncoder();
    let providerUsed = "";

    const stream = new ReadableStream({
      async start(controller) {
        // Send provider status as first message
        providerUsed = getProviderStatus();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ provider: providerUsed })}\n\n`)
        );

        await streamChat({
          messages: normalizedMessages,
          systemPrompt: systemPrompt ?? undefined,
          temperature: temperature ?? 0.7,
          onChunk: (text) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
          },
          onError: (err) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err })}\n\n`));
            controller.close();
          },
        });
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
    return new Response(JSON.stringify({ error: "Failed to stream response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
