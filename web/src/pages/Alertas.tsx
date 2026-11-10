import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Activity, CheckCircle, Clock, Download, Eye, Heart, Truck } from "lucide-react";
import { api, useApi } from "../api/cliente";
import type { Alerta } from "../api/tipos";
import { useFlota } from "../components/FlotaContext";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Boton, Card, Cargando, EstadoBadge, IconoNivel, Vacio } from "../components/ui";
import { estiloNivel, nivelAlerta } from "../lib/estado";
import { duracion, fechaHora, nombreCorto, num, vitalesDeDescripcion } from "../lib/formato";
import { descargarCsv } from "../lib/csv";

type FiltroNivel = "todas" | "PRE_ALERTA" | "ALERTA_CRITICA";
type FiltroEstado = "todas" | "activas" | "cerradas";

export function Alertas() {
  const [params, setParams] = useSearchParams();
  const nivel = (params.get("nivel") as FiltroNivel) || "todas";
  const estado = (params.get("estado") as FiltroEstado) || "todas";
  const conductor = params.get("conductor") ?? "";
  const fecha = params.get("fecha") ?? "";
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v && v !== "todas") p.set(k, v); else p.delete(k);
    setParams(p, { replace: true });
  };

  const { datos: flota } = useFlota();
  const conductores = flota?.conductores ?? [];
  const enLinea = new Set(conductores.filter((c) => c.en_linea).map((c) => c.id));

  const consulta = new URLSearchParams({ limit: "300" });
  if (nivel !== "todas") consulta.set("tipo", nivel);
  if (estado === "activas") consulta.set("activa", "true");
  if (estado === "cerradas") consulta.set("activa", "false");
  if (conductor) consulta.set("conductor", conductor);
  if (fecha) {
    const d = new Date(`${fecha}T00:00:00-05:00`);
    consulta.set("desde", d.toISOString());
    consulta.set("hasta", new Date(d.getTime() + 86_400_000).toISOString());
  }
  const { datos, error, recargar } = useApi<Alerta[]>(`/alertas?${consulta}`, 5000);
  const [errorRevision, setErrorRevision] = useState<string | null>(null);

  const alertas = datos ?? [];
  const nombre = useMemo(() => new Map(conductores.map((c) => [c.id, c.nombre])), [conductores]);

  const revisar = async (a: Alerta) => {
    try {
      setErrorRevision(null);
      await api(`/alertas/${encodeURIComponent(a._id)}/revisar`, { method: "PUT", body: "{}" });
      recargar();
    } catch (e) {
      setErrorRevision(e instanceof Error ? e.message : "No se pudo marcar la alerta");
    }
  };

  const exportar = () => descargarCsv(`alertas-${new Date().toISOString().slice(0, 10)}`,
    ["id", "id_conductor", "nombre", "tipo", "descripcion", "inicio", "fin", "activa", "revisada"],
    alertas.map((a) => [a._id, a.id_conductor, nombre.get(a.id_conductor), a.tipo_alerta, a.descripcion, a.timestamp_inicio, a.timestamp_fin, a.activa, a.revisada ?? false]));

  const chip = (activo: boolean, color: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activo ? color : "bg-white text-gray-600 border-border hover:bg-gray-50"}`;

  return (
    <>
      <Topbar titulo="Gestión de Alertas" subtitulo="Control y seguimiento" />
      <Pagina>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => set("nivel", "todas")} className={chip(nivel === "todas", "bg-blue-600 text-white border-blue-600")}>Todas las alertas</button>
          <button onClick={() => set("nivel", "PRE_ALERTA")} className={chip(nivel === "PRE_ALERTA", "bg-yellow-400 text-gray-900 border-yellow-400")}>Prealerta</button>
          <button onClick={() => set("nivel", "ALERTA_CRITICA")} className={chip(nivel === "ALERTA_CRITICA", "bg-red-500 text-white border-red-500")}>Crítico</button>
          <div className="lg:ml-auto flex gap-2 flex-wrap">
            <select value={estado} onChange={(e) => set("estado", e.target.value)} className="text-sm text-gray-600 px-3 py-2 rounded-xl border border-border bg-white">
              <option value="todas">Abiertas y cerradas</option>
              <option value="activas">Solo abiertas</option>
              <option value="cerradas">Solo cerradas</option>
            </select>
            <select value={conductor} onChange={(e) => set("conductor", e.target.value)} className="text-sm text-gray-600 px-3 py-2 rounded-xl border border-border bg-white">
              <option value="">Todos los conductores</option>
              {conductores.map((c) => <option key={c.id} value={c.id}>{c.id}{c.nombre ? ` · ${nombreCorto(c.nombre, c.id)}` : ""}</option>)}
            </select>
            <input type="date" value={fecha} onChange={(e) => set("fecha", e.target.value)} className="text-sm text-gray-600 px-3 py-2 rounded-xl border border-border bg-white" aria-label="Filtrar por fecha" />
            <Boton icono={Download} onClick={exportar} disabled={!alertas.length} className="!py-2 !rounded-xl">Exportar CSV</Boton>
          </div>
        </div>

        {error && <Aviso tono="error">No se pudieron cargar las alertas: {error}</Aviso>}
        {errorRevision && <Aviso tono="error">{errorRevision}</Aviso>}

        {!datos ? <div className="space-y-4"><Cargando alto={88} /><Cargando alto={88} /><Cargando alto={88} /></div> : !alertas.length ? (
          <Card><Vacio titulo="No hay alertas con estos filtros" detalle="Las alertas las crea Node-RED cuando un conductor pasa a prealerta o alerta crítica." /></Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{alertas.length === 300 ? "Mostrando las 300 más recientes" : `${alertas.length} alerta${alertas.length === 1 ? "" : "s"}`}</p>
            <div className="grid grid-cols-1 gap-3">
              {alertas.map((a) => {
                const n = nivelAlerta(a);
                const v = vitalesDeDescripcion(a.descripcion);
                const sinCierre = a.activa && !enLinea.has(a.id_conductor);
                const atenuada = !a.activa || a.revisada;
                return (
                  <div key={a._id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${atenuada ? "border-border" : n === "Crítico" ? "border-red-200 bg-red-50/20" : "border-yellow-200 bg-yellow-50/20"}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${estiloNivel[n].fondo} ${atenuada ? "opacity-60" : ""}`}>
                        <IconoNivel nivel={n} size={24} />
                      </div>
                      <div className={`flex-1 min-w-[220px] ${atenuada ? "opacity-75" : ""}`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-gray-900">{nombreCorto(nombre.get(a.id_conductor) ?? null, a.id_conductor)}</span>
                          <EstadoBadge nivel={n} />
                          {a.activa ? (
                            sinCierre
                              ? <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200" title="La alerta sigue abierta en MongoDB pero el conductor ya no transmite">Abierta sin cierre</span>
                              : <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">En curso</span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200">Cerrada</span>
                          )}
                          {a.revisada && <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle size={10} className="inline mr-1" />Revisada</span>}
                        </div>
                        <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                          <span><Truck size={11} className="inline mr-1" />{a.id_conductor}</span>
                          <span><Heart size={11} className="inline mr-1" />FC: {num(v.fc)} lpm</span>
                          <span><Activity size={11} className="inline mr-1" />SpO₂: {num(v.spo2)}%</span>
                          <span><Clock size={11} className="inline mr-1" />{fechaHora(a.timestamp_inicio)}</span>
                          {a.timestamp_fin && <span>Duración: {duracion(new Date(a.timestamp_fin).getTime() - new Date(a.timestamp_inicio).getTime())}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link to={`/conductores/${encodeURIComponent(a.id_conductor)}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Eye size={13} />Ver
                        </Link>
                        {!a.revisada && (
                          <button onClick={() => revisar(a)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-700 hover:bg-green-100">
                            <CheckCircle size={13} />Marcar revisada
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Pagina>
    </>
  );
}
