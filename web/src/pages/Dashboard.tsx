import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, AlertOctagon, AlertTriangle, Download, Eye, Heart, RefreshCw, Truck, Users, WifiOff } from "lucide-react";
import { useApi } from "../api/cliente";
import type { Alerta, Series } from "../api/tipos";
import { useFlota } from "../components/FlotaContext";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Boton, Card, CardTitulo, Cargando, EstadoBadge, IconoNivel, KpiCard, Vacio } from "../components/ui";
import { GraficaMultiConductor, SelectorVentana } from "../components/GraficaSeries";
import { colorFc, colorSpo2, estiloNivel, nivelAlerta, nivelConductor, ordenNivel, type Nivel } from "../lib/estado";
import { hace, hora, iniciales, nombreCorto, num } from "../lib/formato";
import { descargarCsv } from "../lib/csv";

const FILTROS: ("Todos" | Nivel)[] = ["Todos", "Crítico", "Prealerta", "Normal", "Sin señal"];

export function Dashboard() {
  const { datos: flota, error, actualizado, recargar } = useFlota();
  const [ventana, setVentana] = useState(60);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");
  const series = useApi<Series>(`/series?minutos=${ventana}`, 10_000);
  const recientes = useApi<Alerta[]>("/alertas?limit=5", 5000);

  const conductores = flota?.conductores ?? [];
  const enLinea = conductores.filter((c) => c.en_linea);
  const prealerta = enLinea.filter((c) => c.estado === "PRE-ALERTA").length;
  const criticoAhora = enLinea.filter((c) => c.estado === "ALERTA CRITICA").length;
  const fcs = enLinea.map((c) => c.fc).filter((x): x is number => x !== null);
  const fcProm = fcs.length ? fcs.reduce((a, b) => a + b, 0) / fcs.length : null;
  const r = flota?.resumen;
  const dif = r ? r.criticas_hoy - r.criticas_ayer : 0;

  const filas = useMemo(
    () => [...conductores]
      .filter((c) => filtro === "Todos" || nivelConductor(c) === filtro)
      .sort((a, b) => ordenNivel[nivelConductor(a)] - ordenNivel[nivelConductor(b)] || a.id.localeCompare(b.id)),
    [conductores, filtro],
  );

  const vivo = actualizado && Date.now() - actualizado.getTime() < 10_000 && !error;

  const exportar = () => descargarCsv(`flota-${new Date().toISOString().slice(0, 19)}`,
    ["id_conductor", "nombre", "vehiculo", "estado", "fc", "spo2", "spo2_valida", "ultima_lectura"],
    filas.map((c) => [c.id, c.nombre, c.vehiculo, nivelConductor(c), c.fc, c.spo2, c.spo2_valida, c.ultima_lectura]));

  return (
    <>
      <Topbar titulo="Dashboard" subtitulo="Monitoreo en tiempo real" />
      <Pagina>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {vivo ? (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />EN VIVO
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                <WifiOff size={12} />SIN CONEXIÓN CON LA API
              </div>
            )}
            <span className="text-xs text-muted-foreground">Última actualización: {actualizado ? hace(actualizado) : "—"}</span>
          </div>
          <Boton variante="texto" icono={RefreshCw} onClick={recargar}>Actualizar</Boton>
        </div>

        {error && <Aviso tono="error">No se pudo consultar la API: {error}</Aviso>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard titulo="Conductores en línea" valor={flota ? enLinea.length : "—"} unidad={flota ? `/ ${conductores.length}` : undefined}
            icono={Users} color="bg-blue-600" nota="Con lecturas en el último minuto" />
          <KpiCard titulo="Alertas críticas hoy" valor={r?.criticas_hoy ?? "—"} icono={AlertOctagon} color="bg-red-500"
            tendencia={dif > 0 ? "mala" : dif < 0 ? "buena" : "neutral"}
            etiquetaTendencia={r ? (dif === 0 ? "Igual que ayer" : `${dif > 0 ? "+" : ""}${dif} vs ayer`) : undefined}
            nota={criticoAhora ? `${criticoAhora} en estado crítico ahora` : undefined} />
          <KpiCard titulo="En prealerta" valor={flota ? prealerta : "—"} icono={AlertTriangle} color="bg-yellow-400" nota="Conductores en línea" />
          <KpiCard titulo="Promedio FC" valor={num(fcProm, 0)} unidad={fcProm === null ? undefined : "lpm"} icono={Heart} color="bg-purple-500" nota="Conductores en línea" />
        </div>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-gray-900 text-base">Conductores</h3>
            <div className="flex gap-2 items-center flex-wrap">
              <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}
                className="text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-border bg-white">
                {FILTROS.map((f) => <option key={f} value={f}>{f === "Todos" ? "Todos los estados" : f}</option>)}
              </select>
              <Boton icono={Download} onClick={exportar} disabled={!filas.length}>Exportar</Boton>
            </div>
          </div>
          {!flota ? (
            <div className="p-6"><Cargando /></div>
          ) : !filas.length ? (
            <Vacio titulo="No hay conductores con este estado" detalle="Cambia el filtro o revisa que el simulador esté publicando datos." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    {["Vehículo", "Conductor", "FC (lpm)", "SpO₂ (%)", "Estado", "Última lectura", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((c, i) => {
                    const nivel = nivelConductor(c);
                    return (
                      <tr key={c.id} className={`border-b border-border hover:bg-gray-50 transition-colors ${i % 2 ? "bg-gray-50/30" : ""} ${c.en_linea ? "" : "text-gray-400"}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Truck size={14} className="text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{c.vehiculo}</p>
                              <p className="text-xs text-muted-foreground">{c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{iniciales(c.nombre, c.id)}</div>
                            <span className="font-medium text-gray-800">{nombreCorto(c.nombre, c.id)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Heart size={13} className={c.en_linea ? colorFc(c.fc, c.umbrales) : "text-gray-300"} />
                            <span className="font-semibold tabular-nums">{num(c.fc)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5" title={c.spo2_valida ? undefined : "Movimiento detectado: SpO₂ no confiable"}>
                            <Activity size={13} className={c.en_linea ? colorSpo2(c.spo2, c.umbrales, c.spo2_valida) : "text-gray-300"} />
                            <span className={`font-semibold tabular-nums ${c.spo2_valida ? "" : "line-through text-gray-400"}`}>{num(c.spo2)}</span>
                            {!c.spo2_valida && c.en_linea && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 rounded">mov.</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><EstadoBadge nivel={nivel} /></td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{hace(c.ultima_lectura)}</td>
                        <td className="px-5 py-3.5">
                          <Link to={`/conductores/${encodeURIComponent(c.id)}`} className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline whitespace-nowrap">
                            <Eye size={12} />Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(["fc", "spo2"] as const).map((v) => (
            <Card key={v} className="p-5">
              <CardTitulo
                titulo={v === "fc" ? "Evolución FC" : "Evolución SpO₂"}
                subtitulo={v === "fc" ? "Frecuencia cardíaca promedio por conductor (lpm)" : "Saturación de oxígeno promedio por conductor (%)"}
                accion={<SelectorVentana valor={ventana} onChange={setVentana} opciones={[{ m: 15, etiqueta: "15 min" }, { m: 60, etiqueta: "1 h" }, { m: 480, etiqueta: "8 h" }]} />}
              />
              {!series.datos ? <Cargando alto={220} /> : !series.datos.filas.length ? (
                <Vacio titulo="Sin lecturas en este periodo" detalle="Inicia la simulación o amplía la ventana de tiempo." />
              ) : (
                <GraficaMultiConductor filas={series.datos.filas} conductores={conductores} variable={v} conSegundos={ventana <= 15}
                  dominio={v === "fc" ? [30, 130] : [55, 100]}
                  referencias={v === "fc"
                    ? [{ y: 60, color: "#EF4444", etiqueta: "Crítico ≤60" }]
                    : [{ y: 90, color: "#EAB308", etiqueta: "Normal ≥90" }, { y: 80, color: "#EF4444", etiqueta: "Crítico ≤80" }]} />
              )}
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <CardTitulo titulo="Alertas recientes" accion={<Link to="/alertas" className="text-sm text-blue-600 font-medium hover:underline">Ver todas</Link>} />
          {!recientes.datos ? <Cargando alto={120} /> : !recientes.datos.length ? (
            <Vacio titulo="Sin alertas registradas" />
          ) : (
            <div className="space-y-1">
              {recientes.datos.map((a) => {
                const nivel = nivelAlerta(a);
                const c = conductores.find((x) => x.id === a.id_conductor);
                return (
                  <Link key={a._id} to={`/conductores/${encodeURIComponent(a.id_conductor)}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${estiloNivel[nivel].fondo}`}>
                      <IconoNivel nivel={nivel} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{nombreCorto(c?.nombre ?? null, a.id_conductor)} <span className="font-normal text-muted-foreground">· {a.id_conductor}</span></p>
                      <p className="text-xs text-gray-600">{a.descripcion}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground">{hora(a.timestamp_inicio)}</span>
                      <div className="mt-1"><EstadoBadge nivel={nivel} /></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </Pagina>
    </>
  );
}
