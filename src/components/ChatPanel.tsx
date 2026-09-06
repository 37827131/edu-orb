"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
  inputDisabled?: boolean;
  autoFocus?: boolean;
  hideInput?: boolean;
}

// ── Component ──────────────────────────────────────────────────

const ChatPanel = ({
  messages,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  inputDisabled = false,
  autoFocus = false,
  hideInput = false,
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  // Auto-focus input
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || inputDisabled) return;
      setInput("");
      onSendMessage(text);
    },
    [input, inputDisabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleStop = useCallback(() => {
    onStopStreaming?.();
  }, [onStopStreaming]);

  return (
    <div
      className={`flex flex-col bg-eo-deep rounded-2xl border border-eo-border overflow-hidden ${
        hideInput ? "" : "h-full"
      }`}
    >
      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
        style={hideInput ? undefined : { maxHeight: "calc(100vh - 320px)" }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming cursor indicator */}
        {isStreaming && (
          <motion.div
            className="flex items-center gap-2 text-eo-cyan text-sm animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="w-2 h-4 rounded-full bg-eo-cyan" />
            <span>EDU-ORB is thinking…</span>
          </motion.div>
        )}

        {/* Stop button during streaming */}
        {isStreaming && onStopStreaming && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleStop}
              className="eo-button-secondary px-3 py-1 text-xs"
              type="button"
            >
              Stop generating
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {hideInput ? null : (
      <div className="border-t border-eo-border bg-eo-surface/50 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything about the topic…"
              disabled={inputDisabled || isStreaming}
              rows={1}
              className="eo-input resize-none min-h-[44px] max-h-[120px] pr-12"

            />

            {/* Mic button */}
            <button
              type="button"
              className="absolute right-3 bottom-2.5 w-8 h-8 rounded-full flex items-center justify-center
                         bg-eo-card border border-eo-border hover:border-eo-muted transition-colors"
              disabled={inputDisabled || isStreaming}
              title="Dictate (speech-to-text)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-eo-cyan"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || inputDisabled || isStreaming}
            className={`eo-button-primary px-4 py-2.5 rounded-xl text-sm
                       ${!input.trim() || inputDisabled || isStreaming ? "opacity-50 cursor-not-allowed" : ""}
                       flex items-center gap-2`}
          >
            <SendIcon />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        {/* Voice status bar */}
        {isFocused && (
          <div className="mt-2 flex items-center gap-2 text-xs text-eo-muted">
            <kbd className="px-1.5 py-0.5 rounded bg-eo-card border border-eo-border text-eo-muted text-[10px]">
              Enter
            </kbd>
            <span>Send</span>
            <span className="mx-1">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-eo-card border border-eo-border text-eo-muted text-[10px]">
              Shift+Enter
            </kbd>
            <span>New line</span>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

// ── Message Bubble ─────────────────────────────────────────────

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <motion.div
        className="flex justify-center text-xs text-eo-muted italic"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <span>{message.content}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed
                   ${isUser
                     ? "bg-eo-orb text-white rounded-br-md"
                     : "bg-eo-card border border-eo-border text-eo-text rounded-bl-md"
                   }`}
      >
        {/* Inline code support */}
        <FormattedText text={message.content} />
      </div>
    </motion.div>
  );
};

// ── Text formatting ────────────────────────────────────────────

const FormattedText = ({ text }: { text: string }) => {
  // Simple markdown-like formatting: inline code, bold
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-eo-deep text-eo-cyan text-xs font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// ── Send Icon ───────────────────────────────────────────────────

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default ChatPanel;
