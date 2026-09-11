"use client";

import { useMemo } from "react";
import { parseResponse, type ParsedBlock } from "../lib/parseResponse";
import { DiagramRenderer, ChartRenderer, VideoEmbed, AnimationPlayer, ANIMATION_TEMPLATES } from "./visuals";

interface ChatMessageProps {
  role: "user" | "bot";
  text: string;
  meta?: string;
  isStreaming?: boolean;
}

/**
 * Renders a single chat message with support for:
 * - Mermaid diagrams
 * - Chart.js charts
 * - YouTube video embeds
 * - Regular text with markdown-like formatting
 */
export default function ChatMessage({ role, text, meta, isStreaming }: ChatMessageProps) {
  const blocks = useMemo(() => {
    if (role === "user") return [{ type: "text" as const, content: text }];
    return parseResponse(text);
  }, [role, text]);

  return (
    <div className={`chat-bubble ${role === "user" ? "chat-bubble--user" : "chat-bubble--bot"}`}>
      {meta && <div className="message-meta">{meta}</div>}
      
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} isStreaming={isStreaming && i === blocks.length - 1} />
      ))}
      
      {isStreaming && blocks.every(b => b.type === "text") && <span className="typing-cursor" />}
    </div>
  );
}

function RenderBlock({ block, isStreaming }: { block: ParsedBlock; isStreaming?: boolean }) {
  switch (block.type) {
    case "diagram":
      return <DiagramRenderer code={block.code} type={block.format as any} />;
    
    case "chart":
      return <ChartRenderer type={block.config.type} data={block.config.data} title={block.config.title} />;
    
    case "video":
      return <VideoEmbed url={block.url} title={block.title} />;
    
    case "animation":
      const templateKey = block.animationType as keyof typeof ANIMATION_TEMPLATES;
      const templateFn = ANIMATION_TEMPLATES[templateKey];
      if (templateFn) {
        return <AnimationPlayer steps={templateFn()} autoPlay />;
      }
      return <span>[Animation: {block.animationType} not found]</span>;
    
    case "text":
    default:
      return <span>{block.content}{isStreaming && <span className="typing-cursor" />}</span>;
  }
}
