export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Vision API — hybrid provider chain.
 *
 * 1. Try local Ollama (LLaVA) first — free, fast
 * 2. Fall back to Groq Vision — free tier
 * 3. Fall back to OpenRouter Vision — free model
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  const prompt = String(form.get("prompt") || "Solve this student question step by step.");

  if (!(image instanceof File)) {
    return Response.json({ error: "Image is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Use a PNG, JPEG, or WebP image up to 5 MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");

  // ── Provider 1: Local Ollama (LLaVA) ──
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const isNetlify = !!(process.env.NETLIFY || process.env.DEPLOY_ENV === "netlify");

  if (!isNetlify) {
    try {
      const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_VISION_MODEL || "llava:7b",
          stream: false,
          messages: [{ role: "user", content: prompt, images: [bytes] }],
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        const data = await response.json();
        return Response.json({
          answer: data?.message?.content || "No answer returned",
          provider: "Local LLaVA",
        });
      }
    } catch {
      // Ollama unreachable — fall through to cloud
    }
  }

  // ── Provider 2: Groq Vision ──
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${image.type};base64,${bytes}` } },
              ],
            },
          ],
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        const data = await response.json();
        return Response.json({
          answer: data?.choices?.[0]?.message?.content || "No answer returned",
          provider: "Groq Vision",
        });
      }
    } catch {
      // Fall through
    }
  }

  // ── Provider 3: OpenRouter Vision ──
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-11b-vision-instruct:free",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${image.type};base64,${bytes}` } },
              ],
            },
          ],
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        const data = await response.json();
        return Response.json({
          answer: data?.choices?.[0]?.message?.content || "No answer returned",
          provider: "OpenRouter Vision",
        });
      }
    } catch {
      // Fall through
    }
  }

  return Response.json(
    { error: "No vision provider available. Check API keys." },
    { status: 503 }
  );
}
