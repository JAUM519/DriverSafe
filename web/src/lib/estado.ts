import type { Alerta, ConductorVivo, EstadoNodeRed, Umbrales } from "../api/tipos";

export type Nivel = "Normal" | "Prealerta" | "Crítico" | "Sin señal" | "Sin estado";

export const nivelDeEstado = (e: EstadoNodeRed | null): Nivel =>
  e === "NORMAL" ? "Normal" : e === "PRE-ALERTA" ? "Prealerta" : e === "ALERTA CRITICA" ? "Crítico" : "Sin estado";

export const nivelConductor = (c: ConductorVivo): Nivel => (c.en_linea ? nivelDeEstado(c.estado) : "Sin señal");

export const nivelAlerta = (a: Alerta): Nivel => (a.tipo_alerta === "ALERTA_CRITICA" ? "Crítico" : "Prealerta");

export const estiloNivel: Record<Nivel, { badge: string; dot: string; texto: string; borde: string; fondo: string }> = {
  Normal: { badge: "bg-green-100 text-green-700 border border-green-200", dot: "bg-green-500", texto: "text-green-600", borde: "border-green-200", fondo: "bg-green-100" },
  Prealerta: { badge: "bg-yellow-100 text-yellow-700 border border-yellow-200", dot: "bg-yellow-400", texto: "text-yellow-600", borde: "border-yellow-200", fondo: "bg-yellow-100" },
  Crítico: { badge: "bg-red-100 text-red-700 border border-red-200", dot: "bg-red-500", texto: "text-red-600", borde: "border-red-200", fondo: "bg-red-100" },
  "Sin señal": { badge: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-400", texto: "text-gray-500", borde: "border-border", fondo: "bg-gray-100" },
  "Sin estado": { badge: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-300", texto: "text-gray-500", borde: "border-border", fondo: "bg-gray-100" },
};

export const ordenNivel: Record<Nivel, number> = { Crítico: 0, Prealerta: 1, Normal: 2, "Sin estado": 3, "Sin señal": 4 };

export type Zona = "normal" | "prealerta" | "critica" | null;

export const zonaFc = (fc: number | null, u: Umbrales): Zona =>
  fc === null ? null : fc <= u.fc_critica ? "critica" : fc < u.fc_min_normal || fc > u.fc_max_normal ? "prealerta" : "normal";

export const zonaSpo2 = (spo2: number | null, u: Umbrales, valida = true): Zona =>
  !valida || spo2 === null ? null : spo2 <= u.spo2_critica ? "critica" : spo2 < u.spo2_min_normal ? "prealerta" : "normal";

const colorZona = (z: Zona) => (z === null ? "text-gray-400" : z === "critica" ? "text-red-500" : z === "prealerta" ? "text-yellow-500" : "text-green-500");
export const colorFc = (fc: number | null, u: Umbrales) => colorZona(zonaFc(fc, u));
export const colorSpo2 = (spo2: number | null, u: Umbrales, valida = true) => colorZona(zonaSpo2(spo2, u, valida));

export const COLORES_SERIE = ["#2563EB", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#0EA5E9", "#64748B"];
