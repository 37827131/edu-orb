"use client";

import { useEffect, useRef, useState } from "react";

interface DiagramRendererProps {
  code: string;
  type?: "flowchart" | "sequence" | "class" | "state" | "pie" | "graph";
}

/**
 * Renders Mermaid diagrams inline in chat.
 * Detects ```mermaid code blocks and renders them as SVG diagrams.
 */
export default function DiagramRenderer({ code, type = "flowchart" }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#6366f1",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#818cf8",
            lineColor: "#6366f1",
            secondaryColor: "#1e1b4b",
            tertiaryColor: "#0f172a",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          flowchart: { curve: "basis", padding: 15 },
          sequence: { mirrorActors: false, messageAlign: "center" },
        });

        const id = `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg: rendered } = await mermaid.render(id, code.trim());
        
        if (!cancelled) {
          setSvg(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (loading) {
    return (
      <div className="diagram-loading">
        <div className="diagram-spinner" />
        <span>Rendering diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Diagram Error: {error}</span>
        <pre className="diagram-fallback">{code}</pre>
      </div>
    );
  }

  return (
    <div className="diagram-container" ref={containerRef}>
      <div className="diagram-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
        </svg>
        <span>Diagram</span>
      </div>
      <div 
        className="diagram-svg" 
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
}
