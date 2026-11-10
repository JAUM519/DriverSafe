import { useEffect, useState } from "react";
import { Activity, CheckCircle, Heart, RotateCcw, Save, Shield, UserPlus } from "lucide-react";
import { api, useApi } from "../api/cliente";
import type { Configuracion as TConfig, Umbrales } from "../api/tipos";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Card, Cargando, Vacio } from "../components/ui";
import { fechaHora } from "../lib/formato";

type Campo = { k: keyof Umbrales; label: string; sub: string; unidad: string; min: number; max: number; color: "green" | "yellow" | "red" | "blue" };

const GRUPOS: { titulo: string; sub: string; icono: typeof Heart; fondo: string; campos: Campo[] }[] = [
  {
    titulo: "Frecuencia Cardíaca (FC)", sub: "Umbrales en latidos por minuto (lpm)", icono: Heart, fondo: "bg-red-100 text-red-500",
    campos: [
      { k: "fc_min_normal", label: "FC normal mínima", sub: "Límite inferior del rango saludable", unidad: "lpm", min: 30, max: 120, color: "green" },
      { k: "fc_max_normal", label: "FC normal máxima", sub: "Límite superior del rango saludable", unidad: "lpm", min: 60, max: 220, color: "green" },
      { k: "fc_caida_prealerta", label: "FC prealerta", sub: "Descenso respecto al promedio de las últimas lecturas", unidad: "lpm", min: 1, max: 40, color: "yellow" },
      { k: "fc_critica", label: "FC crítica", sub: "En o por debajo de este valor la lectura es crítica", unidad: "lpm", min: 30, max: 100, color: "red" },
    ],
  },
  {
    titulo: "Saturación de Oxígeno (SpO₂)", sub: "Umbrales en porcentaje (%)", icono: Activity, fondo: "bg-blue-100 text-blue-500",
    campos: [
      { k: "spo2_min_normal", label: "SpO₂ normal", sub: "Desde este valor la saturación es saludable", unidad: "%", min: 70, max: 100, color: "green" },
      { k: "spo2_prealerta_min", label: "SpO₂ prealerta mínima", sub: "Inicio de la zona de vigilancia", unidad: "%", min: 60, max: 100, color: "yellow" },
      { k: "spo2_prealerta_max", label: "SpO₂ prealerta máxima", sub: "Fin de la zona de vigilancia", unidad: "%", min: 60, max: 100, color: "yellow" },
      { k: "spo2_critica", label: "SpO₂ crítica", sub: "En o por debajo de este valor la lectura es crítica", unidad: "%", min: 50, max: 95, color: "red" },
    ],
  },
  {
    titulo: "Regla de alerta crítica", sub: "Cuándo una racha de lecturas críticas se vuelve alerta", icono: Shield, fondo: "bg-purple-100 text-purple-500",
    campos: [
      { k: "lecturas_criticas", label: "Lecturas críticas consecutivas", sub: "Número de lecturas críticas seguidas para encender el LED rojo", unidad: "", min: 1, max: 20, color: "blue" },
    ],
  },
];

const badge = { green: "bg-green-100 text-green-700", yellow: "bg-yellow-100 text-yellow-700", red: "bg-red-100 text-red-700", blue: "bg-blue-100 text-blue-700" };

export function Configuracion() {
  const { datos, error, recargar } = useApi<TConfig>("/configuracion");
  const [id, setId] = useState("");
  const [valores, setValores] = useState<Umbrales | null>(null);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado">("");
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const actual = datos?.conductores.find((c) => c.id_conductor === id);
  useEffect(() => {
    if (datos && !id && datos.conductores[0]) setId(datos.conductores[0].id_conductor);
  }, [datos, id]);
  useEffect(() => {
    if (actual) setValores({ ...actual.umbrales });
    setErrorGuardar(null);
  }, [actual]);

  const cambiado = actual && valores && (Object.keys(valores) as (keyof Umbrales)[]).some((k) => valores[k] !== actual.umbrales[k]);

  const guardar = async () => {
    if (!valores) return;
    setEstado("guardando");
    setErrorGuardar(null);
    try {
      await api(`/configuracion/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(valores) });
      setEstado("guardado");
      await recargar();
      setTimeout(() => setEstado(""), 2000);
    } catch (e) {
      setEstado("");
      setErrorGuardar(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <>
      <Topbar titulo="Configuración de Umbrales" subtitulo="Parámetros de detección por conductor" />
      <Pagina>
        <div className="max-w-3xl space-y-6">
          {error && <Aviso tono="error">No se pudo cargar la configuración: {error}</Aviso>}
          {!datos ? <Cargando alto={300} /> : !datos.conductores.length ? <Card><Vacio titulo="No hay conductores registrados" /></Card> : (
            <>
              <Card className="p-5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-semibold text-gray-800">Conductor</p>
                  <p className="text-xs text-muted-foreground">
                    {actual?.personalizado ? `Guardado en MongoDB · ${fechaHora(actual.fecha_actualizacion)}` : "Sin configuración guardada: se muestran los valores por defecto"}
                  </p>
                </div>
                <select value={id} onChange={(e) => setId(e.target.value)} className="text-sm px-3 py-2 rounded-xl border border-border bg-white">
                  {datos.conductores.map((c) => <option key={c.id_conductor} value={c.id_conductor}>{c.id_conductor}{c.nombre ? ` · ${c.nombre}` : ""}</option>)}
                </select>
              </Card>

              {valores && GRUPOS.map(({ titulo, sub, icono: Icon, fondo, campos }) => (
                <Card key={titulo} className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${fondo}`}><Icon size={18} /></div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{titulo}</h3>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {campos.map((c) => (
                      <div key={c.k} className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <label htmlFor={c.k} className="text-sm font-semibold text-gray-800">{c.label}</label>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge[c.color]}`}>{valores[c.k]}{c.unidad && ` ${c.unidad}`}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.sub}</p>
                        </div>
                        <div className="w-48">
                          <input type="range" min={c.min} max={c.max} value={valores[c.k]} aria-label={c.label}
                            onChange={(e) => setValores({ ...valores, [c.k]: Number(e.target.value) })} className="w-full accent-blue-600" />
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>{c.min}</span><span>{c.max}</span></div>
                        </div>
                        <input id={c.k} type="number" min={c.min} max={c.max} value={valores[c.k]}
                          onChange={(e) => setValores({ ...valores, [c.k]: Number(e.target.value) })}
                          className="w-20 px-3 py-2 border border-border rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              <Aviso>
                Los umbrales se guardan en <code>configuracion_conductor</code>. Node-RED los recarga cada 15 s, así que un cambio
                se aplica a la detección en menos de 15 s después de guardar.
              </Aviso>

              {errorGuardar && <Aviso tono="error">{errorGuardar}</Aviso>}

              <div className="flex gap-3 flex-wrap">
                <button onClick={guardar} disabled={!cambiado || estado === "guardando"}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${estado === "guardado" ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"}`}>
                  {estado === "guardado" ? <><CheckCircle size={16} />Guardado</> : <><Save size={16} />{estado === "guardando" ? "Guardando..." : "Guardar cambios"}</>}
                </button>
                <button onClick={() => setValores({ ...datos.por_defecto })}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-gray-600 bg-white hover:bg-gray-50 font-semibold text-sm">
                  <RotateCcw size={16} />Valores por defecto
                </button>
              </div>

              <RegistrarConductor
                onCreado={async (nuevo) => {
                  await recargar();
                  setId(nuevo);
                }}
              />

              <Card className="p-6">
                <h3 className="font-bold text-gray-900 text-base mb-4">Parámetros del sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { l: "Bróker MQTT", v: datos.sistema.broker },
                    { l: "Muestreo del sensor", v: `Cada ${datos.sistema.intervalo_muestreo_s} s` },
                    { l: "Tópico de datos", v: datos.sistema.topico_datos },
                    { l: "Tópico de comandos", v: datos.sistema.topico_comando },
                    { l: "Ventana de movimiento", v: `${datos.sistema.ventana_movimiento_s} s (${datos.sistema.ventana_movimiento_fatiga_s} s si la FC cae ≥5 lpm)` },
                    { l: "Zona horaria de análisis", v: datos.sistema.zona_horaria },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-4 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-sm font-semibold text-gray-800 break-all">{v}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </Pagina>
    </>
  );
}

function RegistrarConductor({ onCreado }: { onCreado: (id: string) => void }) {
  const [form, setForm] = useState({ id_conductor: "", nombre: "", vehiculo: "" });
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setEstado(null);
    try {
      const creado = await api<{ id_conductor: string }>("/conductores", { method: "POST", body: JSON.stringify(form) });
      setEstado({ tipo: "ok", texto: `Conductor ${creado.id_conductor} registrado` });
      setForm({ id_conductor: "", nombre: "", vehiculo: "" });
      onCreado(creado.id_conductor);
    } catch (err) {
      setEstado({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo registrar" });
    } finally {
      setEnviando(false);
    }
  };

  const campo = "w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100 text-green-600"><UserPlus size={18} /></div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Registrar conductor</h3>
          <p className="text-xs text-muted-foreground">Usa los umbrales por defecto hasta que se configuren</p>
        </div>
      </div>
      <form onSubmit={enviar} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={campo} placeholder="ID (BUS05-COND05)" required value={form.id_conductor}
          onChange={(e) => setForm({ ...form, id_conductor: e.target.value })} aria-label="ID del conductor" />
        <input className={campo} placeholder="Nombre completo" required value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })} aria-label="Nombre" />
        <input className={campo} placeholder="Vehículo (opcional)" value={form.vehiculo}
          onChange={(e) => setForm({ ...form, vehiculo: e.target.value })} aria-label="Vehículo" />
        <div className="sm:col-span-3 flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={enviando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            <UserPlus size={16} />{enviando ? "Registrando..." : "Registrar"}
          </button>
          {estado && <span className={`text-sm ${estado.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{estado.texto}</span>}
        </div>
      </form>
    </Card>
  );
}
