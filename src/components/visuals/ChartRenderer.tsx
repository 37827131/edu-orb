"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

interface ChartRendererProps {
  type: "bar" | "line" | "pie" | "doughnut";
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
    }>;
  };
  title?: string;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#3b82f6", "#60a5fa", "#93c5fd",
  "#10b981", "#34d399", "#6ee7b7",
  "#f59e0b", "#fbbf24", "#fcd34d",
  "#ef4444", "#f87171", "#fca5a5",
];

/**
 * Renders charts inline in chat.
 * Supports bar, line, pie, and doughnut charts.
 */
export default function ChartRenderer({ type, data, title }: ChartRendererProps) {
  const chartData = useMemo(() => {
    // Apply default colors if not provided
    return {
      ...data,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || (
          type === "pie" || type === "doughnut"
            ? data.labels.map((_, j) => COLORS[j % COLORS.length])
            : COLORS[i % COLORS.length] + "80"
        ),
        borderColor: ds.borderColor || (
          type === "pie" || type === "doughnut"
            ? data.labels.map((_, j) => COLORS[j % COLORS.length])
            : COLORS[i % COLORS.length]
        ),
        borderWidth: ds.borderWidth ?? 2,
        fill: ds.fill ?? (type === "line"),
      })),
    };
  }, [data, type]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: data.datasets.length > 1 || type === "pie" || type === "doughnut",
        labels: { color: "#e2e8f0", font: { size: 12 } },
      },
      title: {
        display: !!title,
        text: title || "",
        color: "#e2e8f0",
        font: { size: 14, weight: "bold" as const },
      },
      tooltip: {
        backgroundColor: "#1e1b4b",
        titleColor: "#e2e8f0",
        bodyColor: "#e2e8f0",
        borderColor: "#6366f1",
        borderWidth: 1,
      },
    },
    scales: type === "bar" || type === "line" ? {
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "#334155" },
      },
      y: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "#334155" },
      },
    } : undefined,
  }), [title, data.datasets.length, type]);

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
  }[type];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        <span>{title || "Chart"}</span>
      </div>
      <div className="chart-canvas">
        <ChartComponent data={chartData} options={options} />
      </div>
    </div>
  );
}
