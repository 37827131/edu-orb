"use client";

import { useState } from "react";

interface VideoEmbedProps {
  url: string;
  title?: string;
}

/**
 * Extracts YouTube video ID from various URL formats.
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Embeds YouTube videos inline in chat.
 * Supports standard YouTube URLs and video IDs.
 */
export default function VideoEmbed({ url, title }: VideoEmbedProps) {
  const [expanded, setExpanded] = useState(false);
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="video-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
        </svg>
        {title || "Watch Video"}
      </a>
    );
  }

  return (
    <div className="video-container">
      <div className="video-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>{title || "Educational Video"}</span>
        <button 
          className="video-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse video" : "Expand video"}
        >
          {expanded ? " Collapse" : " Watch"}
        </button>
      </div>
      
      {expanded ? (
        <div className="video-iframe-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={title || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <div className="video-thumbnail" onClick={() => setExpanded(true)}>
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={title || "Video thumbnail"}
            loading="lazy"
          />
          <div className="video-play-button">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
