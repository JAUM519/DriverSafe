import { Navigate, useNavigate, useParams } from "react-router";
import type { Umbrales } from "../api/tipos";
import { useFlota } from "../components/FlotaContext";
import { Pagina, Topbar } from "../components/Layout";
import { Aviso, Card, Cargando, EstadoBadge, Vacio } from "../components/ui";
import { nivelConductor, type Nivel } from "../lib/estado";
import { hace, num } from "../lib/formato";

const LED: Record<"Normal" | "Prealerta" | "Crítico", string> = { Normal: "#22C55E", Prealerta: "#FACC15", Crítico: "#EF4444" };

const significados = (u: Umbrales): { nivel: "Normal" | "Prealerta" | "Crítico"; comando: string; desc: string; fc: string; spo2: string }[] => [
  { nivel: "Normal", comando: "Prender led verde", desc: "Parámetros vitales dentro del rango saludable.", fc: `${u.fc_min_normal}–${u.fc_max_normal} lpm`, spo2: `≥ ${u.spo2_min_normal}%` },
  { nivel: "Prealerta", comando: "Prender led amarillo", desc: "Señales tempranas de fatiga: una lectura crítica aislada, SpO₂ en zona de vigilancia o caída de FC.", fc: `Caída > ${u.fc_caida_prealerta} lpm vs. promedio, o una lectura ≤ ${u.fc_critica}`, spo2: `${u.spo2_prealerta_min}–${u.spo2_prealerta_max}%` },
  { nivel: "Crítico", comando: "Prender led rojo", desc: `Riesgo alto de microsueño: ${u.lecturas_criticas} lecturas críticas consecutivas.`, fc: `≤ ${u.fc_critica} lpm (${u.lecturas_criticas} seguidas)`, spo2: `≤ ${u.spo2_critica}% (${u.lecturas_criticas} seguidas)` },
];

export function PanelVehiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { datos: flota } = useFlota();

  if (!flota) return (<><Topbar titulo="Panel del Vehículo" /><Pagina><Cargando alto={320} /></Pagina></>);
  if (!id) {
    const c = flota.conductores.find((x) => x.en_linea) ?? flota.conductores[0];
    return c ? <Navigate to={`/panel/${encodeURIComponent(c.id)}`} replace /> : (
      <><Topbar titulo="Panel del Vehículo" /><Pagina><Card><Vacio titulo="No hay vehículos registrados" /></Card></Pagina></>
    );
  }
  const c = flota.conductores.find((x) => x.id === id);
  if (!c) return <Navigate to="/panel" replace />;

  const nivel: Nivel = nivelConductor(c);
  const activo = c.en_linea && (nivel === "Normal" || nivel === "Prealerta" || nivel === "Crítico") ? nivel : null;
  const luz = (n: keyof typeof LED) => (activo === n ? LED[n] : "#1E293B");
  const brillo = (n: keyof typeof LED) => (activo === n ? { filter: `drop-shadow(0 0 8px ${LED[n]})` } : undefined);

  return (
    <>
      <Topbar titulo="Panel del Vehículo" subtitulo="Indicador LED que controla Node-RED en el tablero" />
      <Pagina>
        <Card className="p-5 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-gray-800">Vehículo {c.vehiculo}</p>
            <p className="text-xs text-muted-foreground">{c.nombre ?? c.id} · última lectura {hace(c.ultima_lectura)}</p>
          </div>
          <EstadoBadge nivel={nivel} icono grande />
          <select value={c.id} onChange={(e) => navigate(`/panel/${encodeURIComponent(e.target.value)}`)} className="text-sm px-3 py-2 rounded-xl border border-border bg-white">
            {flota.conductores.map((x) => <option key={x.id} value={x.id}>{x.vehiculo} · {x.id}</option>)}
          </select>
        </Card>

        {!c.en_linea && <Aviso tono="warn">El dispositivo de este vehículo no envía datos; los LEDs se muestran apagados.</Aviso>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col items-center gap-6">
            <h3 className="font-bold text-gray-900 text-base self-start">Estado del dispositivo</h3>
            <svg viewBox="0 0 320 200" className="w-full max-w-sm drop-shadow-xl" xmlns="http://www.w3.org/2000/svg" role="img"
              aria-label={`Panel del vehículo ${c.vehiculo}: ${activo ? `LED ${activo}` : "LEDs apagados"}`}>
              <rect x="20" y="30" width="280" height="140" rx="20" fill="#1E293B" />
              <rect x="28" y="38" width="264" height="124" rx="16" fill="#0F172A" />
              <rect x="40" y="50" width="160" height="100" rx="10" fill="#1E40AF" opacity="0.3" />
              <rect x="40" y="50" width="160" height="100" rx="10" fill="none" stroke="#2563EB" strokeWidth="1" />
              <text x="120" y="70" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace" opacity="0.9">{c.id}</text>
              <text x="120" y="95" fill="#60A5FA" fontSize="18" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{c.en_linea ? `${num(c.fc, 0)} lpm` : "-- lpm"}</text>
              <text x="120" y="107" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">FC</text>
              <text x="120" y="127" fill={c.spo2_valida ? "#60A5FA" : "#64748B"} fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                {c.en_linea ? (c.spo2_valida ? `${num(c.spo2, 0)}%` : "MOV") : "--%"}
              </text>
              <text x="120" y="139" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">SpO₂</text>
              <circle cx="235" cy="75" r="12" fill={luz("Normal")} style={brillo("Normal")} />
              <circle cx="235" cy="100" r="12" fill={luz("Prealerta")} style={brillo("Prealerta")} />
              <circle cx="235" cy="125" r="12" fill={luz("Crítico")} style={brillo("Crítico")} />
              <text x="252" y="79" fill="#94A3B8" fontSize="7" fontFamily="monospace">NORMAL</text>
              <text x="252" y="104" fill="#94A3B8" fontSize="7" fontFamily="monospace">PREALERTA</text>
              <text x="252" y="129" fill="#94A3B8" fontSize="7" fontFamily="monospace">CRÍTICO</text>
              <line x1="280" y1="30" x2="295" y2="10" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="295" cy="9" r="3" fill={c.en_linea ? "#60A5FA" : "#475569"} opacity="0.8" />
              <text x="270" y="8" fill="#94A3B8" fontSize="7" fontFamily="monospace">MQTT</text>
            </svg>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">Último comando:</span> <span className="text-gray-700">{c.accion ?? "—"}</span></div>
              <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">Estado desde:</span> <span className="text-gray-700">{hace(c.estado_desde)}</span></div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-base">Significado de estados <span className="text-xs font-normal text-muted-foreground">· umbrales de {c.id}</span></h3>
            {significados(c.umbrales).map((s) => (
              <div key={s.nivel} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                activo === s.nivel
                  ? s.nivel === "Crítico" ? "border-red-300 ring-2 ring-red-100" : s.nivel === "Prealerta" ? "border-yellow-300 ring-2 ring-yellow-100" : "border-green-300 ring-2 ring-green-100"
                  : "border-border opacity-70"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: LED[s.nivel] }} />
                  <EstadoBadge nivel={s.nivel} grande />
                </div>
                <p className="text-sm text-gray-700 mb-3">{s.desc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">FC:</span> <span className="text-gray-700">{s.fc}</span></div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">SpO₂:</span> <span className="text-gray-700">{s.spo2}</span></div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 sm:col-span-2"><span className="font-semibold text-gray-600">Comando MQTT:</span> <span className="text-gray-700 font-mono">“{s.comando}”</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Pagina>
    </>
  );
}
