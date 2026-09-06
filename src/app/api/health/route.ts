export const dynamic = "force-dynamic";

export async function GET() {
  let ollama = "not-configured";
  if (process.env.OLLAMA_URL) {
    try {
      const response = await fetch(`${process.env.OLLAMA_URL.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
      ollama = response.ok ? "ready" : "unhealthy";
    } catch { ollama = "unreachable"; }
  }
  return Response.json({
    ok: true,
    service: "edu-orb",
    ai: process.env.OLLAMA_URL ? "local-first" : "cloud-fallback",
    ollama,
    timestamp: new Date().toISOString(),
  });
}
