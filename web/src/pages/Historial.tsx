import { useMemo } from "react";
import { Link } from "react-router";
import { Bar } from "react-chartjs-2";
import { AlertOctagon, Bell, CheckCircle, Clock, Download } from "lucide-react";
import { useApi } from "../api/cliente";
import type { Analitica } from "../api/tipos";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Boton, Card, CardTitulo, Cargando, Vacio } from "../components/ui";
import { opcionesBase } from "../lib/graficas";
import { fechaHora, hace, iniciales, nombreCorto, num } from "../lib/formato";
import { descargarCsv } from "../lib/csv";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function Historial() {
  const { datos, error } = useApi<Analitica>("/analitica", 60_000);

  const { porDia, matriz, maxCelda, pctNormal } = useMemo(() => {
    const filas = datos?.dia_hora ?? [];
    const dias = [...new Set(filas.map((f) => f.dia))].sort();
    const porDia = dias.map((dia) => {
      const delDia = filas.filter((f) => f.dia === dia);
      const dsem = delDia[0]?.dsem ?? 0;
      return {
        dia,
        etiqueta: `${DIAS[dsem]} ${dia.slice(8)}`,
        normal: delDia.reduce((s, f) => s + f.normal, 0),
        prealerta: delDia.reduce((s, f) => s + f.prealerta, 0),
        critica: delDia.reduce((s, f) => s + f.critica, 0),
      };
    });
    const matriz = dias.map((dia) => {
      const fila = Array<number>(24).fill(0);
      for (const f of filas) if (f.dia === dia) fila[f.hora] = f.alertas;
      return { dia, etiqueta: porDia.find((d) => d.dia === dia)!.etiqueta, valores: fila };
    });
    const maxCelda = Math.max(0, ...matriz.flatMap((m) => m.valores));
    const tot = porDia.reduce((s, d) => s + d.normal + d.prealerta + d.critica, 0);
    const pctNormal = tot ? (porDia.reduce((s, d) => s + d.normal, 0) / tot) * 100 : null;
    return { porDia, matriz, maxCelda, pctNormal };
  }, [datos]);

  const semana = datos?.semana;
  const actualizado = semana?.actualizado ?? datos?.conductores[0]?.actualizado ?? null;
  const viejo = actualizado ? Date.now() - new Date(actualizado).getTime() > 24 * 3600_000 : true;
  const sinActividad = porDia.length > 0 && porDia.every((d) => d.normal + d.prealerta + d.critica === 0);

  const exportar = () => descargarCsv("analisis-conductores",
    ["conductor", "nombre", "vehiculo", "alertas", "alertas_criticas", "fc_prom", "spo2_prom", "horas_conduccion"],
    (datos?.conductores ?? []).map((c) => [c.conductor, c.nombre, c.vehiculo, c.alertas, c.alertas_criticas, c.fc_prom, c.spo2_prom, c.horas_conduccion]));

  return (
    <>
      <Topbar titulo="Historial & Analítica" subtitulo="Tendencias de los últimos 7 días" />
      <Pagina>
        {error && <Aviso tono="error">No se pudo cargar la analítica: {error}</Aviso>}
        {datos && (
          <Aviso tono={viejo ? "warn" : "info"}>
            {actualizado
              ? <>Resultados del análisis de Node-RED, calculado {hace(actualizado)} ({fechaHora(actualizado)}){semana ? <>, ventana del {fechaHora(semana.desde)} al {fechaHora(semana.hasta)}</> : null}.</>
              : <>Todavía no hay resultados de análisis.</>}
            {viejo && <> Para actualizarlo, ejecuta el nodo <b>“Ejecutar limpieza”</b> y luego <b>“Ejecutar análisis”</b> en Node-RED.</>}
          </Aviso>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total alertas (7 días)", val: semana ? String(semana.alertas_total) : "—", icon: Bell, color: "bg-blue-600" },
            { label: "Alertas críticas", val: semana ? String(semana.alertas_criticas) : "—", icon: AlertOctagon, color: "bg-red-500" },
            { label: "Horas de conducción", val: semana ? `${num(semana.horas_conduccion, 1)}h` : "—", icon: Clock, color: "bg-purple-500" },
            { label: "Lecturas en estado normal", val: pctNormal === null ? "—" : `${num(pctNormal, 1)}%`, icon: CheckCircle, color: "bg-green-500" },
          ].map(({ label, val, icon: Icon, color }) => (
            <Card key={label} className="p-5">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon size={18} className="text-white" /></div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{val}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <CardTitulo titulo="Distribución de estados por día" subtitulo="Lecturas clasificadas por Node-RED (una por segundo de conducción)" />
          {!datos ? <Cargando alto={220} /> : !porDia.length || sinActividad ? (
            <Vacio titulo="Sin lecturas en la ventana analizada" detalle="Si ya hay datos nuevos, vuelve a ejecutar el análisis en Node-RED." />
          ) : (
            <div className="h-[240px]">
              <Bar
                options={opcionesBase<"bar">()}
                data={{
                  labels: porDia.map((d) => d.etiqueta),
                  datasets: [
                    { label: "Normal", data: porDia.map((d) => d.normal), backgroundColor: "#22C55E", borderRadius: 4, maxBarThickness: 20 },
                    { label: "Prealerta", data: porDia.map((d) => d.prealerta), backgroundColor: "#FACC15", borderRadius: 4, maxBarThickness: 20 },
                    { label: "Crítico", data: porDia.map((d) => d.critica), backgroundColor: "#EF4444", borderRadius: 4, maxBarThickness: 20 },
                  ],
                }}
              />
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          <Card className="p-5">
            <CardTitulo titulo="Mapa de calor de alertas" subtitulo="Alertas iniciadas por día y hora (hora de Colombia)" />
            {!datos ? <Cargando alto={200} /> : !matriz.length ? <Vacio titulo="Sin datos de análisis" /> : (
              <div className="overflow-x-auto">
                <div className="inline-block">
                  <div className="flex gap-1 mb-2">
                    <div className="w-14 shrink-0" />
                    {Array.from({ length: 24 }, (_, h) => <div key={h} className="w-5 text-center text-[9px] text-muted-foreground font-mono">{h}</div>)}
                  </div>
                  {matriz.map((fila) => (
                    <div key={fila.dia} className="flex gap-1 mb-1 items-center">
                      <div className="w-14 shrink-0 text-[10px] text-muted-foreground font-semibold">{fila.etiqueta}</div>
                      {fila.valores.map((v, h) => (
                        <div key={h} title={`${fila.etiqueta} ${h}:00 — ${v} alerta${v === 1 ? "" : "s"}`}
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: v === 0 || maxCelda === 0 ? "#F1F5F9" : `rgba(37,99,235,${0.15 + (v / maxCelda) * 0.85})` }} />
                      ))}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] text-muted-foreground">0</span>
                    {[0.15, 0.35, 0.55, 0.75, 1].map((o) => <div key={o} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(37,99,235,${o})` }} />)}
                    <span className="text-[10px] text-muted-foreground">{maxCelda} {maxCelda === 1 ? "alerta" : "alertas"}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardTitulo titulo="Resumen por conductor" subtitulo="Últimos 7 días"
              accion={<Boton variante="texto" icono={Download} onClick={exportar} disabled={!datos?.conductores.length}>Exportar CSV</Boton>} />
            {!datos ? <Cargando alto={200} /> : !datos.conductores.length ? <Vacio titulo="Sin conductores en el análisis" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Conductor", "Alertas", "Críticas", "FC prom.", "SpO₂ prom.", "Horas"].map((h) => <th key={h} className="pb-2 pr-3 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {datos.conductores.map((c) => (
                      <tr key={c.conductor} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-3">
                          <Link to={`/conductores/${encodeURIComponent(c.conductor)}`} className="flex items-center gap-2 hover:underline">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">{iniciales(c.nombre, c.conductor)}</div>
                            <span className="font-medium text-gray-800">{nombreCorto(c.nombre, c.conductor)}</span>
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold tabular-nums">{c.alertas}</td>
                        <td className={`py-2.5 pr-3 font-bold tabular-nums ${c.alertas_criticas ? "text-red-600" : "text-gray-400"}`}>{c.alertas_criticas}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{num(c.fc_prom)} lpm</td>
                        <td className="py-2.5 pr-3 tabular-nums">{num(c.spo2_prom)}%</td>
                        <td className="py-2.5 pr-3 tabular-nums">{num(c.horas_conduccion, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </Pagina>
    </>
  );
}
