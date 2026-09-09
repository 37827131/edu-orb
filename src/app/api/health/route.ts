import { getAvailableProviders } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  let ollama = "not-configured";
  if (process.env.OLLAMA_URL) {
    try {
      const response = await fetch(`${process.env.OLLAMA_URL.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
      ollama = response.ok ? "ready" : "unhealthy";
    } catch { ollama = "unreachable"; }
  }

  const providers = getAvailableProviders();
  
  // Quick test: try fetching from Groq
  let groqStatus = "not-configured";
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen/qwen3.8-27b", messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(5000),
      });
      groqStatus = res.ok ? "ok" : `error-${res.status}`;
    } catch (e: unknown) { groqStatus = `fail-${e instanceof Error ? e.message : "unknown"}`; }
  }

  // Test NVIDIA NIM
  let nvidiaStatus = "not-configured";
  if (process.env.NVIDIA_API_KEY) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "nvidia/nemotron-3-super-120b-a12b", messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(8000),
      });
      nvidiaStatus = res.ok ? "ok" : `error-${res.status}`;
    } catch (e: unknown) { nvidiaStatus = `fail-${e instanceof Error ? e.message : "unknown"}`; }
  }

  let geminiStatus = "not-configured";
  if (process.env.GOOGLE_API_KEY) {
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.GOOGLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gemini-3.5-flash-lite", messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(5000),
      });
      geminiStatus = res.ok ? "ok" : `error-${res.status}`;
    } catch (e: unknown) { geminiStatus = `fail-${e instanceof Error ? e.message : "unknown"}`; }
  }

  return Response.json({
    ok: true,
    service: "edu-orb",
    ai: process.env.OLLAMA_URL ? "local-first" : "cloud-fallback",
    ollama,
    providers: providers.map(p => p.name),
    groqStatus,
    nvidiaStatus,
    geminiStatus,
    timestamp: new Date().toISOString(),
  });
}
