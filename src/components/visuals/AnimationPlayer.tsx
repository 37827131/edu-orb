"use client";

import { useEffect, useRef, useState } from "react";

interface AnimationStep {
  title: string;
  description: string;
  svgContent: string; // SVG markup for the visual
  highlight?: string; // CSS class for highlighting
}

interface AnimationPlayerProps {
  steps: AnimationStep[];
  autoPlay?: boolean;
  interval?: number; // ms between steps
}

/**
 * Plays step-by-step educational animations.
 * Useful for explaining processes, formulas, and concepts visually.
 */
export default function AnimationPlayer({
  steps,
  autoPlay = false,
  interval = 3000,
}: AnimationPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && steps.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, steps.length, interval]);

  const goToStep = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div className="animation-player">
      <div className="animation-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>Animation</span>
        <span className="animation-step-count">
          Step {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div className="animation-viewport">
        <div 
          className="animation-svg"
          dangerouslySetInnerHTML={{ __html: step.svgContent }}
        />
        <div className="animation-overlay">
          <h4>{step.title}</h4>
          <p>{step.description}</p>
        </div>
      </div>

      <div className="animation-controls">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="animation-btn"
          aria-label="Previous step"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="animation-btn animation-btn--play"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          className="animation-btn"
          aria-label="Next step"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="animation-dots">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            className={`animation-dot ${i === currentStep ? "animation-dot--active" : ""}`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-built animation templates for common educational concepts.
 */
export const ANIMATION_TEMPLATES = {
  newtonsLaws: (): AnimationStep[] => [
    {
      title: "Newton's First Law: Inertia",
      description: "An object at rest stays at rest, an object in motion stays in motion, unless acted upon by a force.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ball-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1"/>
              <stop offset="100%" style="stop-color:#8b5cf6"/>
            </linearGradient>
          </defs>
          <!-- Surface -->
          <rect x="10" y="90" width="280" height="4" rx="2" fill="#334155"/>
          <!-- Ball at rest -->
          <circle cx="60" cy="80" r="15" fill="url(#ball-grad)" stroke="#a78bfa" stroke-width="2"/>
          <text x="60" y="50" text-anchor="middle" fill="#94a3b8" font-size="10">At Rest</text>
          <!-- Arrow (force) -->
          <line x1="150" y1="80" x2="200" y2="80" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow)"/>
          <text x="175" y="70" text-anchor="middle" fill="#f59e0b" font-size="10">Force</text>
          <!-- Ball moving -->
          <circle cx="250" cy="80" r="15" fill="url(#ball-grad)" stroke="#a78bfa" stroke-width="2" opacity="0.7"/>
          <text x="250" y="50" text-anchor="middle" fill="#94a3b8" font-size="10">Moving</text>
          <!-- Motion lines -->
          <line x1="220" y1="80" x2="235" y2="80" stroke="#6366f1" stroke-width="2" opacity="0.5"/>
          <line x1="215" y1="75" x2="230" y2="75" stroke="#6366f1" stroke-width="2" opacity="0.3"/>
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b"/>
            </marker>
          </defs>
        </svg>
      `,
    },
    {
      title: "Newton's Second Law: F = ma",
      description: "Force equals mass times acceleration. More mass = more force needed for same acceleration.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Formula -->
          <text x="150" y="25" text-anchor="middle" fill="#e2e8f0" font-size="16" font-weight="bold" font-family="monospace">F = m × a</text>
          <!-- Small mass -->
          <rect x="30" y="50" width="30" height="30" rx="4" fill="#6366f1" stroke="#818cf8" stroke-width="2"/>
          <text x="45" y="70" text-anchor="middle" fill="white" font-size="10">1kg</text>
          <line x1="70" y1="65" x2="100" y2="65" stroke="#10b981" stroke-width="3" marker-end="url(#arrow2)"/>
          <text x="85" y="55" text-anchor="middle" fill="#10b981" font-size="8">Fast</text>
          <!-- Large mass -->
          <rect x="30" y="85" width="60" height="30" rx="4" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2"/>
          <text x="60" y="105" text-anchor="middle" fill="white" font-size="10">5kg</text>
          <line x1="100" y1="100" x2="130" y2="100" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow2)"/>
          <text x="115" y="90" text-anchor="middle" fill="#f59e0b" font-size="8">Slow</text>
          <!-- Equal force label -->
          <text x="150" y="85" text-anchor="middle" fill="#94a3b8" font-size="9">Same Force</text>
          <defs>
            <marker id="arrow2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="currentColor"/>
            </marker>
          </defs>
        </svg>
      `,
    },
    {
      title: "Newton's Third Law: Action-Reaction",
      description: "For every action, there is an equal and opposite reaction.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Person pushing wall -->
          <circle cx="80" cy="60" r="12" fill="#6366f1"/>
          <rect x="74" y="72" width="12" height="20" rx="2" fill="#6366f1"/>
          <!-- Wall -->
          <rect x="140" y="30" width="8" height="80" rx="2" fill="#475569"/>
          <!-- Action arrow -->
          <line x1="100" y1="60" x2="135" y2="60" stroke="#10b981" stroke-width="3" marker-end="url(#arrow3)"/>
          <text x="118" y="50" text-anchor="middle" fill="#10b981" font-size="9">Action</text>
          <!-- Reaction arrow -->
          <line x1="140" y1="60" x2="105" y2="60" stroke="#ef4444" stroke-width="3" marker-end="url(#arrow4)"/>
          <text x="122" y="80" text-anchor="middle" fill="#ef4444" font-size="9">Reaction</text>
          <!-- Equal sign -->
          <text x="200" y="65" text-anchor="middle" fill="#e2e8f0" font-size="14">=</text>
          <!-- Labels -->
          <text x="240" y="50" text-anchor="middle" fill="#10b981" font-size="9">Action</text>
          <text x="240" y="70" text-anchor="middle" fill="#ef4444" font-size="9">Reaction</text>
          <text x="240" y="90" text-anchor="middle" fill="#94a3b8" font-size="8">Equal & Opposite</text>
          <defs>
            <marker id="arrow3" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#10b981"/>
            </marker>
            <marker id="arrow4" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444"/>
            </marker>
          </defs>
        </svg>
      `,
    },
  ],

  photosynthesis: (): AnimationStep[] => [
    {
      title: "Step 1: Light Absorption",
      description: "Chlorophyll in leaves absorbs sunlight energy.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Sun -->
          <circle cx="50" cy="30" r="20" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
          <text x="50" y="35" text-anchor="middle" fill="#92400e" font-size="10">Sun</text>
          <!-- Light rays -->
          <line x1="70" y1="40" x2="130" y2="80" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4"/>
          <line x1="60" y1="50" x2="140" y2="85" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4"/>
          <line x1="50" y1="55" x2="150" y2="90" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4"/>
          <!-- Leaf -->
          <ellipse cx="180" cy="85" rx="50" ry="25" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
          <text x="180" y="90" text-anchor="middle" fill="white" font-size="10">Chlorophyll</text>
          <!-- Arrow -->
          <text x="100" y="65" text-anchor="middle" fill="#fbbf24" font-size="9">Light Energy</text>
        </svg>
      `,
    },
    {
      title: "Step 2: Water + CO₂",
      description: "Water from roots and CO₂ from air enter the leaf.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Leaf -->
          <ellipse cx="150" cy="60" rx="60" ry="30" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
          <!-- Water from below -->
          <line x1="100" y1="110" x2="130" y2="85" stroke="#3b82f6" stroke-width="3" marker-end="url(#water)"/>
          <text x="85" y="108" text-anchor="middle" fill="#3b82f6" font-size="9">H₂O</text>
          <!-- CO2 from air -->
          <line x1="200" y1="20" x2="170" y2="45" stroke="#94a3b8" stroke-width="3" marker-end="url(#co2)"/>
          <text x="215" y="18" text-anchor="middle" fill="#94a3b8" font-size="9">CO₂</text>
          <!-- Inside leaf -->
          <text x="150" y="65" text-anchor="middle" fill="white" font-size="10">Leaf</text>
          <defs>
            <marker id="water" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6"/>
            </marker>
            <marker id="co2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8"/>
            </marker>
          </defs>
        </svg>
      `,
    },
    {
      title: "Step 3: Glucose + Oxygen",
      description: "Light energy converts CO₂ and H₂O into glucose (food) and releases oxygen.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Leaf -->
          <ellipse cx="150" cy="60" rx="50" ry="25" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
          <!-- Output arrows -->
          <line x1="200" y1="60" x2="250" y2="40" stroke="#10b981" stroke-width="3" marker-end="url(#gluc)"/>
          <text x="260" y="42" text-anchor="middle" fill="#10b981" font-size="9">Glucose</text>
          <line x1="200" y1="70" x2="250" y2="90" stroke="#3b82f6" stroke-width="3" marker-end="url(#oxy)"/>
          <text x="260" y="92" text-anchor="middle" fill="#3b82f6" font-size="9">O₂</text>
          <!-- Equation -->
          <text x="150" y="115" text-anchor="middle" fill="#e2e8f0" font-size="10" font-family="monospace">6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</text>
          <defs>
            <marker id="gluc" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#10b981"/>
            </marker>
            <marker id="oxy" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6"/>
            </marker>
          </defs>
        </svg>
      `,
    },
  ],

  pythagoreanTheorem: (): AnimationStep[] => [
    {
      title: "The Right Triangle",
      description: "A right triangle has one 90° angle. The side opposite the right angle is the hypotenuse (c).",
      svgContent: `
        <svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
          <!-- Triangle -->
          <polygon points="50,120 200,120 50,30" fill="none" stroke="#6366f1" stroke-width="3"/>
          <!-- Right angle marker -->
          <rect x="50" y="110" width="10" height="10" fill="none" stroke="#f59e0b" stroke-width="2"/>
          <!-- Sides labels -->
          <text x="125" y="140" text-anchor="middle" fill="#3b82f6" font-size="12" font-weight="bold">a = 3</text>
          <text x="30" y="75" text-anchor="middle" fill="#10b981" font-size="12" font-weight="bold">b = 4</text>
          <text x="140" y="65" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">c = 5</text>
          <!-- Angle label -->
          <text x="65" y="108" text-anchor="middle" fill="#f59e0b" font-size="10">90°</text>
        </svg>
      `,
    },
    {
      title: "Squares on Each Side",
      description: "If you build squares on each side, the areas relate: a² + b² = c²",
      svgContent: `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
          <!-- Triangle -->
          <polygon points="80,150 230,150 80,60" fill="none" stroke="#6366f1" stroke-width="2"/>
          <!-- Square on a (bottom) -->
          <rect x="80" y="150" width="70" height="70" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" stroke-width="2" transform="translate(0,-120)"/>
          <text x="115" y="95" text-anchor="middle" fill="#3b82f6" font-size="10">a² = 9</text>
          <!-- Square on b (left) -->
          <rect x="10" y="60" width="70" height="70" fill="rgba(16,185,129,0.3)" stroke="#10b981" stroke-width="2" transform="translate(0,20)"/>
          <text x="45" y="105" text-anchor="middle" fill="#10b981" font-size="10">b² = 16</text>
          <!-- Square on c (hypotenuse) -->
          <rect x="160" y="30" width="90" height="90" fill="rgba(239,68,68,0.3)" stroke="#ef4444" stroke-width="2" transform="rotate(-37,205,75)"/>
          <text x="220" y="80" text-anchor="middle" fill="#ef4444" font-size="10">c² = 25</text>
          <!-- Formula -->
          <text x="150" y="175" text-anchor="middle" fill="#e2e8f0" font-size="11" font-family="monospace">9 + 16 = 25 ✓</text>
        </svg>
      `,
    },
    {
      title: "The Formula",
      description: "For any right triangle: a² + b² = c² where c is the hypotenuse.",
      svgContent: `
        <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Large formula -->
          <text x="150" y="40" text-anchor="middle" fill="#e2e8f0" font-size="22" font-weight="bold" font-family="monospace">a² + b² = c²</text>
          <!-- Example -->
          <text x="150" y="70" text-anchor="middle" fill="#94a3b8" font-size="12">Example: 3² + 4² = 5²</text>
          <text x="150" y="90" text-anchor="middle" fill="#94a3b8" font-size="12">9 + 16 = 25 ✓</text>
          <!-- Application -->
          <text x="150" y="115" text-anchor="middle" fill="#6366f1" font-size="10">Used in: Construction, Navigation, Physics</text>
        </svg>
      `,
    },
  ],
};
