"use client";

import { motion } from "framer-motion";

export interface SessionStats {
  topic: string;
  level: string;
  messagesSent: number;
  messagesReceived: number;
  timeSpentSeconds: number;
  questionsAttempted: number;
  questionsCorrect: number;
  quizCompleted: boolean;
}

interface ProgressTrackerProps {
  stats: SessionStats;
}

/**
 * Compact progress panel showing session stats with
 * animated counters and a small radar of progress.
 */
const ProgressTracker = ({ stats }: ProgressTrackerProps) => {
  // Format time
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const quizScore =
    stats.questionsAttempted > 0
      ? Math.round((stats.questionsCorrect / stats.questionsAttempted) * 100)
      : 0;

  return (
    <div className="eo-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-eo-orb/20 flex items-center justify-center">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-eo-orb"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-eo-text uppercase tracking-wider">
          Session Progress
        </span>
      </div>

      {/* Topic + Level chips */}
      <div className="flex flex-wrap gap-1.5">
        <span className="eo-badge bg-eo-orb/15 text-eo-orb border border-eo-orb/30">
          {stats.topic}
        </span>
        <span className="eo-badge bg-eo-blue/15 text-eo-blue border border-eo-blue/30">
          {stats.level}
        </span>
      </div>

      {/* Stat rows */}
      <div className="grid grid-cols-2 gap-y-2">
        {/* Messages */}
        <div className="bg-eo-surface/50 rounded-xl p-3 border border-eo-border">
          <div className="flex items-center gap-2 text-xs text-eo-muted mb-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Conversation
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={stats.messagesSent}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-eo-cyan"
            >
              {stats.messagesSent}
            </motion.span>
            <span className="text-xs text-eo-muted">sent</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <motion.span
              key={stats.messagesReceived}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-eo-purple"
            >
              {stats.messagesReceived}
            </motion.span>
            <span className="text-xs text-eo-muted">received</span>
          </div>
        </div>

        {/* Time spent */}
        <div className="bg-eo-surface/50 rounded-xl p-3 border border-eo-border">
          <div className="flex items-center gap-2 text-xs text-eo-muted mb-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Session
          </div>
          <motion.span
            key={stats.timeSpentSeconds}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-bold text-eo-text block text-center"
          >
            {formatTime(stats.timeSpentSeconds)}
          </motion.span>
        </div>

        {/* Quiz progress */}
        <div className="bg-eo-surface/50 rounded-xl p-3 border border-eo-border col-span-2">
          <div className="flex items-center gap-2 text-xs text-eo-muted mb-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Quiz Progress
          </div>

          {stats.questionsAttempted > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-eo-muted">Score</span>
                <span
                  className={`font-semibold ${
                    quizScore >= 70
                      ? "text-eo-green"
                      : quizScore >= 40
                        ? "text-eo-amber"
                        : "text-eo-red"
                  }`}
                >
                  {quizScore}%
                </span>
              </div>
              <div className="h-2 bg-eo-deep rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #10B981 0%, #22D3EE 100%)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${quizScore}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-eo-muted">
                <span>
                  {stats.questionsAttempted} attempted
                </span>
                <span>·</span>
                <span>
                  {stats.questionsCorrect} correct
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  {stats.quizCompleted && (
                    <>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-eo-green"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      quiz complete
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-eo-muted text-center py-2">
              No quiz attempted yet.
              <br />
              Start a lesson to generate quiz questions.
            </p>
          )}

          {/* Mini progress dots */}
          {stats.questionsAttempted > 0 && (
            <div className="flex gap-1 mt-3">
              {Array.from({ length: Math.max(stats.questionsAttempted, 5) }).map(
                (_, i) => {
                  const answered =
                    i < stats.questionsAttempted;
                  const correct =
                    i < stats.questionsCorrect &&
                    i < stats.questionsAttempted;

                  return (
                    <div
                      key={i}
                      className={`w-2 h-6 rounded-sm transition-all duration-200 ${
                        !answered
                          ? "bg-eo-deep"
                          : correct
                            ? "bg-eo-green"
                            : "bg-eo-red"
                      }`}
                    />
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
