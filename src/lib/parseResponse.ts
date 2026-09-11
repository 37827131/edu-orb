/**
 * Parses bot responses to detect embedded diagrams, charts, videos, and animations.
 * 
 * Supported formats:
 * - Diagrams: ```mermaid ... ```
 * - Charts: ```chart { type: "bar", data: {...} } ```
 * - Videos: YouTube URLs (youtube.com/watch?v=... or youtu.be/...)
 * - Animations: ```animation { type: "newtonsLaws" } ``` or ```animation { type: "photosynthesis" } ```
 */

export type ParsedBlock =
  | { type: "diagram"; format: "mermaid"; code: string }
  | { type: "chart"; format: string; config: ChartConfig }
  | { type: "video"; url: string; title?: string }
  | { type: "animation"; animationType: string }
  | { type: "text"; content: string };

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "doughnut";
  title?: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }>;
  };
}

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
const MERMAID_BLOCK = /```mermaid\s*\n([\s\S]*?)```/g;
const CHART_BLOCK = /```chart\s*\n([\s\S]*?)```/g;
const ANIMATION_BLOCK = /```animation\s*\n([\s\S]*?)```/g;

/**
 * Extracts YouTube video IDs from text.
 */
function extractVideos(text: string): Array<{ url: string; title?: string }> {
  const videos: Array<{ url: string; title?: string }> = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = YOUTUBE_REGEX.exec(text)) !== null) {
    const url = match[0];
    if (!seen.has(url)) {
      seen.add(url);
      videos.push({ url });
    }
  }
  YOUTUBE_REGEX.lastIndex = 0;
  return videos;
}

/**
 * Parses a chart config from JSON string.
 */
function parseChartConfig(json: string): ChartConfig | null {
  try {
    const config = JSON.parse(json);
    if (config.type && config.data && config.data.labels && config.data.datasets) {
      return config as ChartConfig;
    }
  } catch {
    // Invalid JSON
  }
  return null;
}

/**
 * Parses a bot response into renderable blocks.
 */
export function parseResponse(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let remaining = text;

  // Extract mermaid diagrams
  remaining = remaining.replace(MERMAID_BLOCK, (_, code) => {
    blocks.push({ type: "diagram", format: "mermaid", code: code.trim() });
    return "";
  });
  MERMAID_BLOCK.lastIndex = 0;

  // Extract chart blocks
  remaining = remaining.replace(CHART_BLOCK, (_, json) => {
    const config = parseChartConfig(json);
    if (config) {
      blocks.push({ type: "chart", format: config.type, config });
    } else {
      blocks.push({ type: "text", content: `<!-- invalid chart: ${json.slice(0, 50)}... -->` });
    }
    return "";
  });
  CHART_BLOCK.lastIndex = 0;

  // Extract animation blocks
  remaining = remaining.replace(ANIMATION_BLOCK, (_, json) => {
    try {
      const config = JSON.parse(json);
      if (config.type) {
        blocks.push({ type: "animation", animationType: config.type });
      }
    } catch {
      blocks.push({ type: "text", content: `<!-- invalid animation: ${json.slice(0, 50)}... -->` });
    }
    return "";
  });
  ANIMATION_BLOCK.lastIndex = 0;

  // Extract YouTube videos
  const videos = extractVideos(remaining);
  for (const video of videos) {
    blocks.push({ type: "video", url: video.url, title: video.title });
    // Remove video URL from remaining text
    remaining = remaining.replace(video.url, "");
  }

  // Add remaining text
  const trimmed = remaining.trim();
  if (trimmed) {
    blocks.push({ type: "text", content: trimmed });
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: text }];
}

/**
 * Quick check if text contains any visual blocks.
 */
export function hasVisuals(text: string): boolean {
  return /```mermaid\s*\n/.test(text) ||
         /```chart\s*\n/.test(text) ||
         /```animation\s*\n/.test(text) ||
         /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(text);
}
