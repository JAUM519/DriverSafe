import { useState } from "react";
import { Activity, CheckCircle, Shield, User, Zap } from "lucide-react";
import { api, sesion } from "../api/cliente";
import { IlustracionLogin } from "../components/IlustracionLogin";

export function Login({ onLogin }: { onLogin: (usuario: string) => void }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const r = await api<{ token: string; usuario: string }>("/login", { method: "POST", body: JSON.stringify({ usuario, clave }) });
      sesion.guardar(r.token, recordar);
      onLogin(r.usuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif", background: "#F8FAFC" }}>
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${Math.sin(i) * 40 + 50}%`, left: `${Math.cos(i) * 40 + 50}%`, transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md">
          <IlustracionLogin className="w-full max-w-md mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-white mb-3">Monitoreo Inteligente</h2>
          <p className="text-blue-200 text-base leading-relaxed">Detectamos fatiga en conductores con wearables IoT: frecuencia cardíaca, SpO₂ y acelerómetro en tiempo real.</p>
          <div className="flex justify-center gap-6 mt-8">
            {[{ label: "Muestreo", val: "1 s" }, { label: "Sensores", val: "3" }, { label: "Niveles de alerta", val: "3" }].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-white font-bold text-xl">{val}</p>
                <p className="text-blue-300 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 sm:p-10 bg-white">
        <form className="w-full max-w-sm" onSubmit={entrar}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Activity size={22} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">DriverSafe IoT</h1>
              <p className="text-xs text-muted-foreground">Sistema IoT para monitoreo de fatiga</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h2>
          <p className="text-sm text-muted-foreground mb-7">Inicia sesión con tu cuenta de supervisor</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="usuario" className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="usuario" autoComplete="username" required value={usuario} onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="supervisor" />
              </div>
            </div>
            <div>
              <label htmlFor="clave" className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="clave" type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 mb-6 w-fit">
            <input type="checkbox" className="sr-only peer" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 ${recordar ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
              {recordar && <CheckCircle size={10} className="text-white" />}
            </span>
            <span className="text-sm text-gray-600">Recordarme en este equipo</span>
          </label>

          {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}

          <button type="submit" disabled={cargando}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-blue-200 active:scale-[0.99] flex items-center justify-center gap-2">
            {cargando ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Iniciando sesión...</> : <><Zap size={16} />Iniciar sesión</>}
          </button>
        </form>
      </div>
    </div>
  );
}
