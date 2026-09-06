"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  answer: string;
  distractors: string[];
  explanation: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Array<string | null>;
  results: Array<{ correct: boolean; answered: boolean }>;
  isFinished: boolean;
}

// ── Multiple choice button ─────────────────────────────────────

const QuizOption = ({
  text,
  label,
  selected,
  showResult,
  isCorrect,
  onSelect,
  disabled,
  explanation,
}: {
  text: string;
  label: string;
  selected: boolean;
  showResult: boolean;
  isCorrect: boolean;
  onSelect: () => void;
  disabled: boolean;
  explanation?: string;
}) => {
  const getBorderColor = () => {
    if (showResult) {
      return isCorrect ? "border-eo-green" : "border-eo-red";
    }
    if (selected) {
      return "border-eo-cyan";
    }
    return "border-eo-border";
  };

  const getBgColor = () => {
    if (showResult && isCorrect) return "bg-eo-green/10";
    if (showResult && !isCorrect && selected) return "bg-eo-red/10";
    if (selected) return "bg-eo-cyan/10";
    return "bg-eo-card";
  };

  const getTextColor = () => {
    if (showResult && isCorrect) return "text-eo-green";
    if (showResult && !isCorrect && selected) return "text-eo-red";
    return "text-eo-text";
  };

  return (
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                 ${getBorderColor()} ${getBgColor()} ${getTextColor()}
                 ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-eo-card-hov hover:border-eo-muted"}`}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center gap-3">
        {/* Letter indicator */}
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                       ${showResult && isCorrect
                         ? "bg-eo-green/20 text-eo-green"
                         : showResult && !isCorrect && selected
                           ? "bg-eo-red/20 text-eo-red"
                           : selected
                             ? "bg-eo-cyan/20 text-eo-cyan"
                             : "bg-eo-surface text-eo-muted"
                       }`}
        >
          {label}
        </span>

        <span className="flex-1 text-sm font-medium">{text}</span>

        {/* Correct/incorrect icon */}
        {showResult && (
          <span
            className={`flex-shrink-0 ${
              isCorrect ? "text-eo-green" : "text-eo-red"
            }`}
          >
            {isCorrect ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </span>
        )}
      </div>

      {/* Explanation (shown after answering) */}
      {showResult && explanation && (
        <motion.div
          className="mt-2 pl-11 pr-2 text-xs text-eo-muted leading-relaxed italic border-l-2 border-eo-muted"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {explanation}
        </motion.div>
      )}
    </motion.button>
  );
};

// ── Quiz Panel ─────────────────────────────────────────────────

export interface QuizPanelProps {
  quiz?: {
    topic: string;
    questions: QuizQuestion[];
  } | null;
  onAnswer?: (questionIndex: number, answer: string) => void;
  disabled?: boolean;
}

/**
 * Display quiz questions one at a time with multiple choice.
 * Shows a results summary at the end.
 */
const QuizPanel = ({ quiz, onAnswer, disabled = false }: QuizPanelProps) => {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: [],
    results: [],
    isFinished: false,
  });

  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionOrder, setOptionOrder] = useState<number[]>([]);

  // Initialize quiz when it's provided
  const handleQuizReady = useCallback(
    (newQuiz: { topic: string; questions: QuizQuestion[] }) => {
      setState({
        questions: newQuiz.questions,
        currentIndex: 0,
        answers: newQuiz.questions.map(() => null),
        results: newQuiz.questions.map(() => ({ correct: false, answered: false })),
        isFinished: false,
      });
      setSelectedOption(null);
      setShowExplanation(false);
    },
    []
  );

  // Call onAnswer when provided
  useEffect(() => {
    if (quiz) {
      handleQuizReady(quiz);
    }
  }, [quiz, handleQuizReady]);

  const currentQ = state.questions[state.currentIndex];

  // Shuffle option display order once per question so options don't
  // jump around when the component re-renders (e.g. on selection).
  useEffect(() => {
    if (!currentQ) return;
    const count = currentQ.distractors.length + 1;
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setOptionOrder(order);
  }, [currentQ]);

  const handleSelect = useCallback(
    (answer: string) => {
      if (!currentQ || state.results[state.currentIndex]?.answered || disabled) return;

      setSelectedOption(answer);
      const isCorrect = answer.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();

      const newResults = [...state.results];
      newResults[state.currentIndex] = { correct: isCorrect, answered: true };

      const newAnswers = [...state.answers];
      newAnswers[state.currentIndex] = answer;

      setState((s) => ({
        ...s,
        answers: newAnswers,
        results: newResults,
      }));

      onAnswer?.(state.currentIndex, answer);
      setShowExplanation(true);
    },
    [currentQ, state.currentIndex, state.results, disabled, onAnswer]
  );

  const handleNext = useCallback(() => {
    if (!showExplanation) return;
    setShowExplanation(false);
    setSelectedOption(null);

    if (state.currentIndex + 1 < state.questions.length) {
      setState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }));
    } else {
      setState((s) => ({ ...s, isFinished: true }));
    }
  }, [showExplanation, state.currentIndex, state.questions.length]);

  const handleRetry = useCallback(() => {
    setState({
      questions: state.questions,
      currentIndex: 0,
      answers: state.questions.map(() => null),
      results: state.questions.map(() => ({ correct: false, answered: false })),
      isFinished: false,
    });
    setSelectedOption(null);
    setShowExplanation(false);
  }, [state.questions]);

  // Compute score
  const score = state.results.filter((r) => r.correct).length;
  const total = state.questions.length;

  if (!quiz || !currentQ) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-eo-muted">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-sm">No quiz loaded yet.</p>
        <p className="text-xs mt-1">Start a lesson to generate quiz questions.</p>
      </div>
    );
  }

  // ── Question view ───────────────────────────────────────────
  if (!state.isFinished) {
    const allOptions = [
      { text: currentQ.answer, isCorrect: true },
      ...currentQ.distractors.map((d) => ({ text: d, isCorrect: false })),
    ];
    // Options in the shuffled order established for this question
    const orderedOptions =
      optionOrder.length === allOptions.length
        ? optionOrder.map((i) => allOptions[i])
        : allOptions;

    return (
      <div className="flex flex-col h-full">
        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-eo-border bg-eo-surface/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-eo-muted font-medium">
              Question {state.currentIndex + 1} of {total}
            </span>
            <span className="text-xs text-eo-muted">
              {score} correct so far
            </span>
          </div>
          <div className="h-1.5 bg-eo-deep rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-eo-green to-eo-cyan rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((state.currentIndex) / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <AnimatePresence mode="wait">
            {showExplanation ? (
              <motion.div
                key="explanation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4"
              >
                <div className="eo-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        selectedOption?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()
                          ? "bg-eo-green/20 text-eo-green"
                          : "bg-eo-red/20 text-eo-red"
                      }`}
                    >
                      {selectedOption?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()
                        ? "Correct"
                        : "Not quite"}
                    </span>
                  </div>
                  <p className="text-sm text-eo-text">
                    <strong>Correct answer:</strong>{" "}
                    <span className="text-eo-green font-medium">{currentQ.answer}</span>
                  </p>
                  <p className="text-sm text-eo-muted mt-1 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>

                <button
                  onClick={handleNext}
                  className="eo-button-primary mt-3 w-full"
                  disabled={disabled}
                >
                  {state.currentIndex + 1 < total ? "Next question →" : "See results →"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Question text */}
                <div className="eo-card p-4">
                  <p className="text-sm font-medium text-eo-text leading-relaxed">
                    {currentQ.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {orderedOptions.map((opt, idx) => {
                    const isCorrect = opt.isCorrect;
                    const isSelected = selectedOption?.toLowerCase() === opt.text.toLowerCase();

                    return (
                      <QuizOption
                        key={idx}
                        text={opt.text}
                        label={String.fromCharCode(65 + idx)}
                        selected={isSelected}
                        showResult={false}
                        isCorrect={isCorrect}
                        onSelect={() => handleSelect(opt.text)}
                        disabled={disabled}
                      />
                    );
                  })}
                </div>

                {/* Help text */}
                <p className="text-xs text-eo-muted text-center pt-2">
                  Select an answer to check if you're right.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Results view ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Progress bar (full) */}
      <div className="px-4 py-3 border-b border-eo-border bg-eo-surface/30" />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-md mx-auto w-full"
        >
          {/* Score card */}
          <div className="eo-card p-6 text-center">
            <div className="text-5xl mb-3">
              {score === total ? "🏆" : score >= total * 0.6 ? "🎉" : "💪"}
            </div>
            <h3 className="text-lg font-semibold text-eo-text mb-1">
              {score === total
                ? "Perfect score!"
                : score >= total * 0.6
                  ? "Great job!"
                  : "Keep practicing!"}
            </h3>
            <p className="text-sm text-eo-muted">
              You got {score} out of {total} correct.
            </p>

            {/* Score bar */}
            <div className="mt-4 h-3 bg-eo-deep rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(score / total) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-eo-muted mt-2">
              {Math.round((score / total) * 100)}%
            </p>
          </div>

          {/* Per-question results */}
          <div className="space-y-2">
            {state.questions.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`eo-card p-3 border-l-4 ${
                  state.results[i].correct
                    ? "border-eo-green bg-eo-green/5"
                    : "border-eo-red bg-eo-red/5"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      state.results[i].correct
                        ? "text-eo-green"
                        : "text-eo-red"
                    }
                  >
                    {state.results[i].correct ? "✅" : "❌"}
                  </span>
                  <span className="text-eo-text font-medium">
                    Q{i + 1}:{" "}
                    {q.question.length > 50
                      ? q.question.slice(0, 47) + "…"
                      : q.question}
                  </span>
                </div>
                <p className="text-xs text-eo-muted mt-1">
                  Answer:{" "}
                  <span className="text-eo-cyan">{q.answer}</span>
                </p>
              </motion.div>
            ))}
          </div>

          {/* Retry button */}
          <button
            onClick={handleRetry}
            className="eo-button-secondary w-full mt-2"
            disabled={disabled}
          >
            Retry quiz
          </button>

          {/* Back to chat hint */}
          <p className="text-center text-xs text-eo-muted">
            Return to the chat and keep learning.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// ── Helper ─────────────────────────────────────────────────────



export default QuizPanel;
