import {
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

Chart.defaults.font.family = "Inter, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#64748B";

export function opcionesBase<T extends "line" | "bar">(min?: number, max?: number): ChartOptions<T> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
      tooltip: { backgroundColor: "#0F172A", padding: 10, cornerRadius: 8, titleFont: { weight: "bold" } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
      y: { min, max, grid: { color: "#F1F5F9" }, border: { display: false } },
    },
  } as unknown as ChartOptions<T>;
}

export function lineaReferencia(valor: number, etiqueta: string, color: string, puntos: number) {
  return {
    label: etiqueta,
    data: Array<number>(puntos).fill(valor),
    borderColor: color,
    borderWidth: 1.5,
    borderDash: [5, 5],
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
  };
}
