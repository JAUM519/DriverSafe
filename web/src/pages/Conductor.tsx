import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Clock, Heart, Move, Shield, Truck, User } from "lucide-react";
import { useApi } from "../api/cliente";
import type { Alerta, Series } from "../api/tipos";
import { useFlota } from "../components/FlotaContext";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Card, CardTitulo, Cargando, EstadoBadge, Vacio, ejeTick, estiloTooltip } from "../components/ui";
import { SelectorVentana } from "../components/GraficaSeries";
import { estiloNivel, nivelAlerta, nivelConductor, zonaFc, zonaSpo2 } from "../lib/estado";
import { diaLocal, duracion, hace, hora, iniciales, num } from "../lib/formato";

const LIMITE_VOLANTE_H = 6;

export function Conductor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { datos: flota } = useFlota();
  const [ventana, setVentana] = useState(60);
  const series = useApi<Series>(id ? `/series?minutos=${ventana}&conductor=${encodeURIComponent(id)}` : null, 10_000);
  const hoy = new Date(`${diaLocal(new Date())}T00:00:00-05:00`).toISOString();
  const alertas = useApi<Alerta[]>(id ? `/alertas?conductor=${encodeURIComponent(id)}&desde=${hoy}&limit=50` : null, 10_000);

  if (!flota) return (<><Topbar titulo="Detalle del Conductor" /><Pagina><Cargando alto={120} /><Cargando alto={260} /></Pagina></>);
  if (!id) {
    const primero = flota.conductores.find((c) => c.en_linea) ?? flota.conductores[0];
    return primero ? <Navigate to={`/conductores/${encodeURIComponent(primero.id)}`} replace /> : (
      <><Topbar titulo="Conductores" /><Pagina><Card><Vacio titulo="No hay conductores registrados" /></Card></Pagina></>
    );
  }
  const c = flota.conductores.find((x) => x.id === id);
  if (!c) return (
    <><Topbar titulo="Detalle del Conductor" /><Pagina><Card><Vacio titulo={`No existe el conductor ${id}`} detalle={<Link className="text-blue-600" to="/conductores">Ver conductores</Link>} /></Card></Pagina></>
  );

  const nivel = nivelConductor(c);
  const est = estiloNivel[nivel];
  const u = c.umbrales;
  const zFc = c.en_linea ? zonaFc(c.fc, u) : null;
  const zSpo2 = c.en_linea ? zonaSpo2(c.spo2, u, c.spo2_valida) : null;
  const fcCritica = zFc === "critica";
  const fcPre = zFc === "prealerta";
  const spo2Critica = zSpo2 === "critica";
  const spo2Pre = zSpo2 === "prealerta";
  const volanteMs = c.inicio_sesion && c.ultima_lectura ? new Date(c.ultima_lectura).getTime() - new Date(c.inicio_sesion).getTime() : null;
  const excede = volanteMs !== null && volanteMs > LIMITE_VOLANTE_H * 3600_000;
  const criticas = c.criticas_consecutivas ?? 0;
  const limiteCriticas = u.lecturas_criticas;

  const datosSerie = (series.datos?.filas ?? []).map((f) => ({ t: f.t, fc: f.fc, spo2: f.spo2 }));

  return (
    <>
      <Topbar titulo="Detalle del Conductor" subtitulo="Monitoreo individual" />
      <Pagina>
        <Card className="p-6 flex items-center gap-6 flex-wrap">
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold ${est.fondo} ${est.texto}`}>{iniciales(c.nombre, c.id)}</div>
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${est.dot}`} />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{c.nombre ?? c.id}</h2>
              <EstadoBadge nivel={nivel} icono grande />
            </div>
            <div className="flex items-center gap-x-5 gap-y-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><User size={14} />ID: {c.id}</span>
              <span className="flex items-center gap-1"><Truck size={14} />Vehículo {c.vehiculo}</span>
              <span className="flex items-center gap-1"><Clock size={14} />Última lectura {hace(c.ultima_lectura)}</span>
            </div>
            {!c.registrado && <p className="text-xs text-yellow-700 mt-2">Este ID envía datos pero no está en la colección <code>conductores</code>.</p>}
          </div>
          <select value={c.id} onChange={(e) => navigate(`/conductores/${encodeURIComponent(e.target.value)}`)}
            className="text-sm px-3 py-2 rounded-xl border border-border bg-white">
            {flota.conductores.map((x) => <option key={x.id} value={x.id}>{x.id}{x.nombre ? ` · ${x.nombre}` : ""}</option>)}
          </select>
        </Card>

        {!c.en_linea && (
          <Aviso tono="warn">El dispositivo no envía datos {c.ultima_lectura ? `desde ${hace(c.ultima_lectura)}` : "aún"}. Los valores mostrados son los últimos recibidos.</Aviso>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Vital titulo="Frecuencia cardíaca" icono={<Heart size={16} className={fcCritica ? "text-red-500" : "text-gray-400"} />} alerta={fcCritica} pre={fcPre}
            valor={<>{num(c.fc)}<span className="text-base font-normal ml-1">lpm</span></>}
            nota={fcCritica ? `⚠ En o por debajo del umbral crítico (${u.fc_critica} lpm)` : fcPre ? `Fuera del rango normal (${u.fc_min_normal}–${u.fc_max_normal} lpm)` : c.promedio_fc !== null ? `Promedio reciente: ${num(c.promedio_fc)} lpm` : undefined} />
          <Vital titulo="Saturación SpO₂" icono={<Activity size={16} className={spo2Critica ? "text-red-500" : "text-gray-400"} />} alerta={spo2Critica} pre={spo2Pre}
            valor={<span className={c.spo2_valida ? "" : "text-gray-400"}>{num(c.spo2)}%</span>}
            nota={!c.spo2_valida ? "Movimiento detectado: lectura no confiable" : spo2Critica ? `⚠ Nivel crítico (≤${u.spo2_critica}%)` : spo2Pre ? `Por debajo de lo normal (<${u.spo2_min_normal}%)` : undefined} />
          <Vital titulo="Tiempo al volante" icono={<Clock size={16} className="text-blue-500" />}
            valor={volanteMs !== null ? duracion(volanteMs) : "—"}
            nota={volanteMs === null ? "Sin sesión activa" : excede ? `Excede el límite recomendado (${LIMITE_VOLANTE_H}h)` : `Desde las ${hora(c.inicio_sesion)}`}
            notaColor={excede ? "text-yellow-600" : undefined} />
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lecturas críticas seguidas</p>
              <Shield size={16} className={criticas ? "text-red-500" : "text-gray-400"} />
            </div>
            <p className={`text-4xl font-bold tabular-nums ${criticas ? "text-red-600" : "text-gray-900"}`}>{criticas}<span className="text-base font-normal text-muted-foreground ml-1">/ {limiteCriticas}</span></p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all" style={{ width: `${Math.min(100, (criticas / limiteCriticas) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Con {limiteCriticas} seguidas pasa a alerta crítica</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="p-5">
            <CardTitulo titulo="Historial FC y SpO₂" subtitulo="Promedio por intervalo"
              accion={<SelectorVentana valor={ventana} onChange={setVentana} opciones={[{ m: 15, etiqueta: "15 min" }, { m: 60, etiqueta: "1 h" }, { m: 720, etiqueta: "12 h" }]} />} />
            {!series.datos ? <Cargando alto={220} /> : !datosSerie.length ? (
              <Vacio titulo="Sin lecturas en este periodo" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={datosSerie}>
                  <defs>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                    <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="t" tick={ejeTick} tickFormatter={(t) => hora(t, ventana <= 15)} minTickGap={24} />
                  <YAxis tick={ejeTick} domain={[30, 130]} width={36} />
                  <Tooltip contentStyle={estiloTooltip} labelFormatter={(t) => hora(t, true)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area dataKey="fc" name="FC (lpm)" stroke="#EF4444" fill="url(#fcGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Area dataKey="spo2" name="SpO₂ (%)" stroke="#2563EB" fill="url(#spo2Grad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <CardTitulo titulo="Alertas de hoy" subtitulo={c.ultimo_movimiento ? <span className="inline-flex items-center gap-1"><Move size={11} />Último movimiento {hace(c.ultimo_movimiento)}</span> : undefined}
              accion={<Link to={`/alertas?conductor=${encodeURIComponent(c.id)}`} className="text-sm text-blue-600 font-medium hover:underline">Ver todas</Link>} />
            {!alertas.datos ? <Cargando alto={180} /> : !alertas.datos.length ? (
              <Vacio titulo="Sin alertas hoy" detalle="Este conductor no ha generado prealertas ni alertas críticas en la jornada." />
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {alertas.datos.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-gray-50">
                    <span className="text-xs text-muted-foreground w-12 tabular-nums shrink-0">{hora(a.timestamp_inicio)}</span>
                    <span className="w-24 shrink-0"><EstadoBadge nivel={nivelAlerta(a)} /></span>
                    <span className="text-xs text-gray-700 flex-1 min-w-0">{a.descripcion.replace(/^(Pre-alerta|Alerta critica) detectada: /, "")}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {a.activa ? "Abierta" : a.timestamp_fin ? duracion(new Date(a.timestamp_fin).getTime() - new Date(a.timestamp_inicio).getTime()) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Pagina>
    </>
  );
}

function Vital({ titulo, icono, valor, nota, alerta, pre, notaColor }: {
  titulo: string; icono: React.ReactNode; valor: React.ReactNode; nota?: string; alerta?: boolean; pre?: boolean; notaColor?: string;
}) {
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${alerta ? "border-red-200 bg-red-50/30" : pre ? "border-yellow-200 bg-yellow-50/30" : "border-border bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{titulo}</p>
        {icono}
      </div>
      <p className={`text-4xl font-bold tabular-nums ${alerta ? "text-red-600" : pre ? "text-yellow-600" : "text-gray-900"}`}>{valor}</p>
      {nota && <p className={`text-xs mt-1 font-medium ${notaColor ?? (alerta ? "text-red-500" : pre ? "text-yellow-600" : "text-muted-foreground")}`}>{nota}</p>}
    </div>
  );
}
