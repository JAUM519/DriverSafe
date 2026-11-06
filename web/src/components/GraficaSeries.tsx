import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ConductorVivo, FilaSerie } from "../api/tipos";
import { COLORES_SERIE } from "../lib/estado";
import { hora, nombreCorto } from "../lib/formato";
import { ejeTick, estiloTooltip } from "./ui";

export function GraficaMultiConductor({ filas, conductores, variable, dominio, referencias = [], conSegundos }: {
  filas: FilaSerie[];
  conductores: ConductorVivo[];
  variable: "fc" | "spo2";
  dominio: [number | "auto", number | "auto"];
  referencias?: { y: number; color: string; etiqueta: string }[];
  conSegundos?: boolean;
}) {
  const { datos, ids } = useMemo(() => {
    const porT = new Map<string, Record<string, number | string>>();
    const ids = new Set<string>();
    for (const f of filas) {
      ids.add(f.id);
      const fila = porT.get(f.t) ?? { t: f.t };
      fila[f.id] = f[variable];
      porT.set(f.t, fila);
    }
    return { datos: [...porT.values()].sort((a, b) => String(a.t).localeCompare(String(b.t))), ids: [...ids].sort() };
  }, [filas, variable]);

  const nombre = (id: string) => nombreCorto(conductores.find((c) => c.id === id)?.nombre ?? null, id);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="t" tick={ejeTick} tickFormatter={(t) => hora(t, conSegundos)} minTickGap={24} />
        <YAxis tick={ejeTick} domain={dominio} width={36} />
        <Tooltip contentStyle={estiloTooltip} labelFormatter={(t) => hora(t, true)} formatter={(v: number, id: string) => [v.toFixed(1), nombre(id)]} />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(id: string) => nombre(id)} />
        {referencias.map((r) => (
          <ReferenceLine key={r.y} y={r.y} stroke={r.color} strokeDasharray="4 4" label={{ value: r.etiqueta, fontSize: 10, fill: r.color, position: "insideTopRight" }} />
        ))}
        {ids.map((id, i) => (
          <Line key={id} dataKey={id} stroke={COLORES_SERIE[i % COLORES_SERIE.length]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SelectorVentana({ valor, onChange, opciones }: { valor: number; onChange: (m: number) => void; opciones: { m: number; etiqueta: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-gray-50 p-0.5">
      {opciones.map((o) => (
        <button key={o.m} onClick={() => onChange(o.m)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${valor === o.m ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
