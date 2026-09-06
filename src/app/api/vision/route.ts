export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  const prompt = String(form.get("prompt") || "Solve this student question step by step.");
  if (!(image instanceof File)) return Response.json({ error: "Image is required" }, { status: 400 });
  if (!ALLOWED_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Use a PNG, JPEG, or WebP image up to 5 MB" }, { status: 400 });
  }
  const ollama = process.env.OLLAMA_URL;
  if (!ollama) return Response.json({ error: "Local vision service is not configured" }, { status: 503 });
  const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");
  const response = await fetch(`${ollama.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_VISION_MODEL || "llava:7b",
      stream: false,
      messages: [{ role: "user", content: prompt, images: [bytes] }],
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) return Response.json({ error: "Vision service unavailable" }, { status: 502 });
  const data = await response.json();
  return Response.json({ answer: data?.message?.content || "No answer returned" });
}
