import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import type { ConductorVivo, FilaSerie } from "../api/tipos";
import { COLORES_SERIE } from "../lib/estado";
import { hora, nombreCorto } from "../lib/formato";
import { lineaReferencia, opcionesBase } from "../lib/graficas";

export function GraficaMultiConductor({ filas, conductores, variable, dominio, referencias = [], conSegundos }: {
  filas: FilaSerie[];
  conductores: ConductorVivo[];
  variable: "fc" | "spo2";
  dominio: [number, number];
  referencias?: { y: number; color: string; etiqueta: string }[];
  conSegundos?: boolean;
}) {
  const datos = useMemo(() => {
    const tiempos = [...new Set(filas.map((f) => f.t))].sort();
    const ids = [...new Set(filas.map((f) => f.id))].sort();
    const valor = new Map(filas.map((f) => [`${f.id}|${f.t}`, f[variable]]));
    const nombre = (id: string) => nombreCorto(conductores.find((c) => c.id === id)?.nombre ?? null, id);

    return {
      labels: tiempos.map((t) => hora(t, conSegundos)),
      datasets: [
        ...ids.map((id, i) => ({
          label: nombre(id),
          data: tiempos.map((t) => valor.get(`${id}|${t}`) ?? null),
          borderColor: COLORES_SERIE[i % COLORES_SERIE.length],
          backgroundColor: COLORES_SERIE[i % COLORES_SERIE.length],
          borderWidth: 2,
          pointRadius: tiempos.length > 40 ? 0 : 2,
          tension: 0.3,
          spanGaps: false,
        })),
        ...referencias.map((r) => lineaReferencia(r.y, r.etiqueta, r.color, tiempos.length)),
      ],
    };
  }, [filas, conductores, variable, referencias, conSegundos]);

  return (
    <div className="h-[240px]">
      <Line data={datos} options={opcionesBase<"line">(dominio[0], dominio[1])} />
    </div>
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
