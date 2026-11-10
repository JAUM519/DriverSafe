import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Activity, BarChart2, Bell, Clock, Gauge, LayoutDashboard, LogOut, Menu, Search, Settings, Truck, Users, X } from "lucide-react";
import { useFlota } from "./FlotaContext";
import { fechaLarga, iniciales } from "../lib/formato";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, fin: true },
  { to: "/conductores", label: "Conductores", icon: Users },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/tiempo-real", label: "Tiempo real (Node-RED)", icon: Gauge },
  { to: "/historial", label: "Historial & Analítica", icon: BarChart2 },
  { to: "/configuracion", label: "Configuración", icon: Settings },
  { to: "/panel", label: "Panel Vehículo", icon: Truck },
];

const MenuContexto = createContext<() => void>(() => {});

export function Layout({ usuario, onSalir, children }: { usuario: string; onSalir: () => void; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const { datos } = useFlota();
  const vigentes = datos?.resumen.alertas_vigentes ?? 0;
  const location = useLocation();
  useEffect(() => setAbierto(false), [location.pathname]);

  const sidebar = (
    <aside className="w-64 h-full bg-white border-r border-border flex flex-col">
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 leading-tight">DriverSafe IoT</p>
          <p className="text-xs text-muted-foreground">Monitor de Fatiga</p>
        </div>
        <button className="lg:hidden text-gray-500" onClick={() => setAbierto(false)} aria-label="Cerrar menú"><X size={18} /></button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, fin }) => (
          <NavLink key={to} to={to} end={fin}
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}>
            {({ isActive }) => (
              <>
                <Icon size={18} />
                {label}
                {to === "/alertas" && vigentes > 0 && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>{vigentes}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
            {iniciales(usuario, usuario)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{usuario}</p>
            <p className="text-xs text-muted-foreground">Supervisor</p>
          </div>
          <button onClick={onSalir} title="Cerrar sesión" className="text-gray-400 hover:text-gray-700"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">{sidebar}</div>
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAbierto(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <MenuContexto.Provider value={() => setAbierto(true)}>{children}</MenuContexto.Provider>
      </div>
    </div>
  );
}

export function Topbar({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  const abrirMenu = useContext(MenuContexto);
  const { datos } = useFlota();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const vigentes = datos?.resumen.alertas_vigentes ?? 0;
  const conductores = datos?.conductores ?? [];

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const q = busqueda.trim().toLowerCase();
    if (!q) return;
    const c = conductores.find((x) => x.id.toLowerCase() === q)
      ?? conductores.find((x) => x.id.toLowerCase().includes(q) || x.nombre?.toLowerCase().includes(q) || x.vehiculo.toLowerCase().includes(q));
    if (c) {
      navigate(`/conductores/${encodeURIComponent(c.id)}`);
      setBusqueda("");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
      <button className="lg:hidden w-9 h-9 rounded-xl border border-border flex items-center justify-center" onClick={abrirMenu} aria-label="Abrir menú">
        <Menu size={18} className="text-gray-600" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">{titulo}</h1>
        {subtitulo && <p className="text-xs text-muted-foreground truncate">{subtitulo}</p>}
      </div>
      <div className="flex items-center gap-3">
        <form onSubmit={buscar} className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            list="lista-conductores"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-border rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Buscar conductor..."
          />
          <datalist id="lista-conductores">
            {conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre ?? c.vehiculo}</option>)}
          </datalist>
        </form>
        <button onClick={() => navigate("/alertas?estado=activas")} title="Alertas vigentes"
          className="relative w-9 h-9 rounded-xl bg-gray-50 border border-border flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell size={16} className="text-gray-600" />
          {vigentes > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{vigentes}</span>
          )}
        </button>
        <div className="hidden xl:flex items-center gap-2 bg-gray-50 border border-border rounded-xl px-3 py-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs text-gray-600">{fechaLarga()}</span>
        </div>
      </div>
    </header>
  );
}

export function Pagina({ children }: { children: ReactNode }) {
  return <div className="flex-1 p-4 sm:p-6 space-y-6">{children}</div>;
}
