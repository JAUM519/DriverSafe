import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from "recharts";
import {
  LayoutDashboard, Users, Truck, Bell, History, BarChart2, Settings, User,
  Search, ChevronRight, LogOut, Heart, Activity, Clock, Shield, Filter,
  Download, Eye, CheckCircle, AlertTriangle, AlertOctagon, Wifi, Battery,
  Home, Menu, X, ChevronDown, RefreshCw, Plus, Sliders, Save, RotateCcw,
  MapPin, TrendingUp, TrendingDown, Zap, Moon, Coffee, Phone
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "login" | "dashboard" | "driver-detail" | "alerts" | "history" | "settings" | "mobile" | "vehicle-panel";
type DriverStatus = "Normal" | "Prealerta" | "Crítico";

interface Driver {
  id: string; name: string; avatar: string; vehicle: string; vehicleId: string;
  fc: number; spo2: number; status: DriverStatus; lastUpdate: string;
  drivingTime: string; riskLevel: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const drivers: Driver[] = [
  { id: "D001", name: "Carlos Mendoza", avatar: "CM", vehicle: "Camión T-01", vehicleId: "ABC-123", fc: 78, spo2: 97, status: "Normal", lastUpdate: "Hace 2 min", drivingTime: "4h 23m", riskLevel: 12 },
  { id: "D002", name: "Ana Rodríguez", avatar: "AR", vehicle: "Van V-03", vehicleId: "DEF-456", fc: 55, spo2: 83, status: "Crítico", lastUpdate: "Hace 30 seg", drivingTime: "7h 10m", riskLevel: 92 },
  { id: "D003", name: "Luis Herrera", avatar: "LH", vehicle: "Bus B-07", vehicleId: "GHI-789", fc: 63, spo2: 87, status: "Prealerta", lastUpdate: "Hace 1 min", drivingTime: "5h 45m", riskLevel: 58 },
  { id: "D004", name: "María Gómez", avatar: "MG", vehicle: "Camión T-04", vehicleId: "JKL-012", fc: 82, spo2: 98, status: "Normal", lastUpdate: "Hace 3 min", drivingTime: "2h 15m", riskLevel: 8 },
  { id: "D005", name: "Pedro Castro", avatar: "PC", vehicle: "Van V-08", vehicleId: "MNO-345", fc: 61, spo2: 86, status: "Prealerta", lastUpdate: "Hace 45 seg", drivingTime: "6h 02m", riskLevel: 65 },
  { id: "D006", name: "Elena Torres", avatar: "ET", vehicle: "Bus B-12", vehicleId: "PQR-678", fc: 75, spo2: 96, status: "Normal", lastUpdate: "Hace 4 min", drivingTime: "1h 50m", riskLevel: 15 },
];

const fcHistory = [
  { time: "08:00", Carlos: 76, Ana: 80, Luis: 77 },
  { time: "09:00", Carlos: 78, Ana: 75, Luis: 72 },
  { time: "10:00", Carlos: 80, Ana: 68, Luis: 68 },
  { time: "11:00", Carlos: 77, Ana: 60, Luis: 65 },
  { time: "12:00", Carlos: 75, Ana: 55, Luis: 63 },
  { time: "13:00", Carlos: 78, Ana: 52, Luis: 61 },
  { time: "14:00", Carlos: 80, Ana: 48, Luis: 58 },
];

const spo2History = [
  { time: "08:00", Carlos: 98, Ana: 97, Luis: 96 },
  { time: "09:00", Carlos: 97, Ana: 96, Luis: 95 },
  { time: "10:00", Carlos: 98, Ana: 92, Luis: 93 },
  { time: "11:00", Carlos: 97, Ana: 88, Luis: 89 },
  { time: "12:00", Carlos: 97, Ana: 85, Luis: 87 },
  { time: "13:00", Carlos: 96, Ana: 82, Luis: 86 },
  { time: "14:00", Carlos: 97, Ana: 80, Luis: 85 },
];

const weeklyAlerts = [
  { day: "Lun", normal: 42, prealerta: 8, critico: 2 },
  { day: "Mar", normal: 38, prealerta: 12, critico: 5 },
  { day: "Mié", normal: 45, prealerta: 6, critico: 1 },
  { day: "Jue", normal: 40, prealerta: 10, critico: 3 },
  { day: "Vie", normal: 35, prealerta: 15, critico: 7 },
  { day: "Sáb", normal: 28, prealerta: 9, critico: 4 },
  { day: "Dom", normal: 20, prealerta: 5, critico: 2 },
];

const driverFcData = [
  { t: "06:00", fc: 75, spo2: 97 }, { t: "07:00", fc: 77, spo2: 98 },
  { t: "08:00", fc: 80, spo2: 97 }, { t: "09:00", fc: 78, spo2: 96 },
  { t: "10:00", fc: 74, spo2: 95 }, { t: "11:00", fc: 70, spo2: 94 },
  { t: "12:00", fc: 65, spo2: 91 }, { t: "13:00", fc: 58, spo2: 87 },
  { t: "14:00", fc: 52, spo2: 83 },
];

const heatmapData = [
  [2, 1, 0, 0, 1, 3, 5, 8, 6, 4, 3, 2, 5, 7, 9, 11, 8, 6, 4, 3, 2, 1, 1, 0],
  [1, 0, 0, 0, 0, 2, 4, 7, 5, 3, 2, 1, 4, 6, 8, 10, 7, 5, 3, 2, 1, 1, 0, 0],
  [3, 1, 0, 0, 1, 3, 6, 9, 7, 5, 4, 3, 6, 8, 10, 12, 9, 7, 5, 4, 3, 2, 1, 0],
  [0, 0, 0, 0, 0, 1, 3, 5, 4, 2, 1, 1, 3, 5, 7, 9, 6, 4, 2, 1, 1, 0, 0, 0],
  [2, 1, 0, 0, 1, 4, 7, 10, 8, 6, 5, 4, 7, 9, 11, 13, 10, 8, 6, 5, 4, 3, 2, 1],
  [4, 2, 1, 0, 2, 5, 8, 12, 10, 7, 6, 5, 8, 11, 14, 16, 12, 9, 7, 6, 5, 4, 3, 2],
  [1, 0, 0, 0, 0, 2, 4, 6, 5, 3, 2, 2, 4, 6, 8, 10, 7, 5, 4, 3, 2, 1, 0, 0],
];
const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusColor = (s: DriverStatus) => ({
  Normal: "bg-green-100 text-green-700 border border-green-200",
  Prealerta: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Crítico: "bg-red-100 text-red-700 border border-red-200",
}[s]);

const statusDot = (s: DriverStatus) => ({
  Normal: "bg-green-500", Prealerta: "bg-yellow-400", Crítico: "bg-red-500",
}[s]);

const statusIcon = (s: DriverStatus) => ({
  Normal: <CheckCircle size={14} />, Prealerta: <AlertTriangle size={14} />, Crítico: <AlertOctagon size={14} />,
}[s]);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "driver-detail", label: "Conductores", icon: Users },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "history", label: "Historial & Analítica", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
  { id: "mobile", label: "App Móvil", icon: Phone },
  { id: "vehicle-panel", label: "Panel Vehículo", icon: Truck },
];

function Sidebar({ current, onChange }: { current: Screen; onChange: (s: Screen) => void }) {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-border flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">DriverSafe IoT</p>
            <p className="text-xs text-muted-foreground">Monitor de Fatiga</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id as Screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {label}
              {id === "alerts" && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>3</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">JP</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Jorge Pérez</p>
            <p className="text-xs text-muted-foreground">Supervisor</p>
          </div>
          <LogOut size={16} className="text-gray-400" />
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground capitalize">{subtitle || dateStr}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-border rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Buscar conductor..."
          />
        </div>
        <div className="relative">
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-border flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={16} className="text-gray-600" />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">3</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-xl px-3 py-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs text-gray-600 capitalize">{dateStr}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">JP</div>
      </div>
    </header>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, unit, icon: Icon, color, trend, trendLabel }: {
  title: string; value: string | number; unit?: string; icon: any;
  color: string; trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend === "up" ? "bg-green-50 text-green-600" : trend === "down" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
          }`}>
            {trend === "up" ? <TrendingUp size={12} /> : trend === "down" ? <TrendingDown size={12} /> : null}
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {value}<span className="text-lg font-medium text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif", background: "#F8FAFC" }}>
      {/* Left panel */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${Math.sin(i) * 40 + 50}%`, left: `${Math.cos(i) * 40 + 50}%`, transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md">
          {/* SVG illustration */}
          <div className="w-72 h-72 mx-auto mb-8 relative">
            <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
              {/* Car body */}
              <rect x="30" y="140" width="260" height="100" rx="16" fill="#1E3A5F" />
              <rect x="70" y="95" width="180" height="80" rx="12" fill="#1E3A5F" />
              {/* Windshield */}
              <rect x="80" y="100" width="160" height="65" rx="8" fill="#93C5FD" opacity="0.7" />
              {/* Wheels */}
              <circle cx="90" cy="240" r="28" fill="#0F172A" />
              <circle cx="90" cy="240" r="16" fill="#1E3A5F" />
              <circle cx="90" cy="240" r="6" fill="#60A5FA" />
              <circle cx="230" cy="240" r="28" fill="#0F172A" />
              <circle cx="230" cy="240" r="16" fill="#1E3A5F" />
              <circle cx="230" cy="240" r="6" fill="#60A5FA" />
              {/* Driver */}
              <circle cx="160" cy="120" r="24" fill="#FBBF24" />
              <rect x="140" y="140" width="40" height="50" rx="8" fill="#3B82F6" />
              {/* Wearable device on wrist */}
              <rect x="118" y="165" width="22" height="14" rx="4" fill="#10B981" />
              <rect x="124" y="168" width="10" height="8" rx="2" fill="#fff" opacity="0.9" />
              {/* Heart beat line on wearable */}
              <polyline points="125,172 127,172 129,167 131,177 133,169 135,172 136,172" stroke="#10B981" strokeWidth="1.5" fill="none" />
              {/* Dashboard panel */}
              <rect x="120" y="185" width="80" height="30" rx="6" fill="#0F172A" />
              <circle cx="140" cy="200" r="8" fill="#22C55E" />
              <rect x="155" y="196" width="30" height="4" rx="2" fill="#60A5FA" opacity="0.5" />
              <rect x="155" y="203" width="20" height="3" rx="1.5" fill="#60A5FA" opacity="0.3" />
              {/* Signal waves */}
              <path d="M 280 60 Q 295 55 280 50 Q 295 45 280 40" stroke="#60A5FA" strokeWidth="2" fill="none" opacity="0.8" />
              <path d="M 290 65 Q 310 57 290 48 Q 310 40 290 32" stroke="#60A5FA" strokeWidth="2" fill="none" opacity="0.5" />
              {/* Heartbeat line float */}
              <rect x="60" y="50" width="110" height="30" rx="8" fill="white" opacity="0.15" />
              <polyline points="68,65 76,65 82,50 88,80 94,55 100,65 108,65 114,65 120,58 126,72 132,65 140,65 152,65" stroke="#22C55E" strokeWidth="2" fill="none" />
              {/* SpO2 chip */}
              <rect x="185" y="48" width="70" height="24" rx="8" fill="white" opacity="0.15" />
              <text x="220" y="63" fill="white" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="600">SpO₂ 97%</text>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Monitoreo Inteligente</h2>
          <p className="text-blue-200 text-base leading-relaxed">
            Detectamos fatiga y microsueños en conductores mediante wearables IoT en tiempo real.
          </p>
          <div className="flex justify-center gap-6 mt-8">
            {[{ label: "Conductores", val: "240+" }, { label: "Alertas evitadas", val: "1.2K" }, { label: "Uptime", val: "99.9%" }].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-white font-bold text-xl">{val}</p>
                <p className="text-blue-300 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-[480px] flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DriverSafe IoT</h1>
              <p className="text-xs text-muted-foreground">Sistema IoT para monitoreo de fatiga</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h2>
          <p className="text-sm text-muted-foreground mb-7">Inicia sesión en tu cuenta de supervisor</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="supervisor@empresa.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" value={pass} onChange={e => setPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${remember ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                {remember && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>
            <button className="text-sm text-blue-600 font-medium hover:underline">Recuperar contraseña</button>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-blue-200 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Iniciando sesión...</>
            ) : (
              <><Zap size={16} />Iniciar sesión</>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿Problemas para acceder?{" "}
            <button className="text-blue-600 font-medium hover:underline">Contactar soporte</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
function DashboardScreen({ onDriverClick }: { onDriverClick: () => void }) {
  const criticalCount = drivers.filter(d => d.status === "Crítico").length;
  const preAlertCount = drivers.filter(d => d.status === "Prealerta").length;
  const avgFc = Math.round(drivers.reduce((s, d) => s + d.fc, 0) / drivers.length);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const iv = setInterval(() => {}, 3000);
    return () => clearInterval(iv);
  }, [live]);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Dashboard" subtitle="Monitoreo en tiempo real" />
      <div className="flex-1 p-6 space-y-6">
        {/* Live badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              EN VIVO
            </div>
            <span className="text-xs text-muted-foreground">Última actualización: hace 12 segundos</span>
          </div>
          <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={14} />Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="Conductores Activos" value={drivers.length} icon={Users} color="bg-blue-600" trend="up" trendLabel="+2 hoy" />
          <KpiCard title="Alertas Críticas Hoy" value={criticalCount} icon={AlertOctagon} color="bg-red-500" trend="down" trendLabel="-1 vs ayer" />
          <KpiCard title="En Prealerta" value={preAlertCount} icon={AlertTriangle} color="bg-yellow-400" trend="neutral" trendLabel="Sin cambios" />
          <KpiCard title="Promedio FC" value={avgFc} unit="lpm" icon={Heart} color="bg-purple-500" trend="up" trendLabel="+3 lpm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Conductores en ruta</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50">
                <Filter size={14} />Filtrar
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50">
                <Download size={14} />Exportar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  {["Vehículo", "Conductor", "FC (lpm)", "SpO₂ (%)", "Estado", "Última actualización", "Acción"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => (
                  <tr key={d.id} className={`border-b border-border hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{d.vehicle}</p>
                          <p className="text-xs text-muted-foreground">{d.vehicleId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{d.avatar}</div>
                        <span className="font-medium text-gray-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Heart size={13} className={d.fc <= 60 ? "text-red-500" : d.fc <= 65 ? "text-yellow-500" : "text-green-500"} />
                        <span className="font-semibold tabular-nums">{d.fc}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Activity size={13} className={d.spo2 <= 80 ? "text-red-500" : d.spo2 <= 89 ? "text-yellow-500" : "text-green-500"} />
                        <span className="font-semibold tabular-nums">{d.spo2}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(d.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(d.status)}`} />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{d.lastUpdate}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={onDriverClick}
                        className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        <Eye size={12} />Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-1">Evolución FC</h3>
            <p className="text-xs text-muted-foreground mb-4">Frecuencia cardíaca por conductor (lpm)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={fcHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[40, 95]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="Carlos" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line dataKey="Ana" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line dataKey="Luis" stroke="#FACC15" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-1">Evolución SpO₂</h3>
            <p className="text-xs text-muted-foreground mb-4">Saturación de oxígeno por conductor (%)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={spo2History}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[75, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="Carlos" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line dataKey="Ana" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line dataKey="Luis" stroke="#FACC15" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Alertas recientes</h3>
          <div className="space-y-3">
            {[
              { time: "14:32", driver: "Ana Rodríguez", msg: "SpO₂ crítico: 80% — Microsueño detectado", level: "Crítico" as DriverStatus },
              { time: "13:50", driver: "Luis Herrera", msg: "FC en prealerta: 63 lpm por más de 5 minutos", level: "Prealerta" as DriverStatus },
              { time: "13:15", driver: "Pedro Castro", msg: "FC descendió >5 lpm respecto al promedio base", level: "Prealerta" as DriverStatus },
              { time: "12:40", driver: "Ana Rodríguez", msg: "SpO₂ prealerta: 87% — Se recomienda descanso", level: "Prealerta" as DriverStatus },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  a.level === "Crítico" ? "bg-red-100" : "bg-yellow-100"
                }`}>
                  {a.level === "Crítico" ? <AlertOctagon size={15} className="text-red-500" /> : <AlertTriangle size={15} className="text-yellow-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{a.driver}</p>
                  <p className="text-xs text-gray-600">{a.msg}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(a.level)}`}>{a.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Detail Screen ─────────────────────────────────────────────────────
function DriverDetailScreen() {
  const d = drivers[1]; // Ana (critical)
  const [sent, setSent] = useState(false);
  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Detalle del Conductor" subtitle="Monitoreo individual" />
      <div className="flex-1 p-6 space-y-6">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 text-2xl font-bold">{d.avatar}</div>
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${statusDot(d.status)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{d.name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusColor(d.status)}`}>
                {statusIcon(d.status)} {d.status}
              </span>
            </div>
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User size={14} />ID: {d.id}</span>
              <span className="flex items-center gap-1"><Truck size={14} />{d.vehicle} · {d.vehicleId}</span>
              <span className="flex items-center gap-1"><MapPin size={14} />Ruta Norte — km 45</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSent(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                sent ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"
              }`}
            >
              {sent ? <><CheckCircle size={16} />Recomendación enviada</> : <><Coffee size={16} />Enviar recomendación de descanso</>}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-gray-600 hover:bg-gray-50 text-sm font-medium">
              <Phone size={16} />Contactar
            </button>
          </div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 bg-red-50/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frecuencia Cardíaca</p>
              <Heart size={16} className="text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-600 tabular-nums">{d.fc}<span className="text-base font-normal ml-1">lpm</span></p>
            <p className="text-xs text-red-500 mt-1 font-medium">⚠ Por debajo del umbral crítico (60 lpm)</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 bg-red-50/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saturación SpO₂</p>
              <Activity size={16} className="text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-600 tabular-nums">{d.spo2}%<span className="text-base font-normal ml-1"></span></p>
            <p className="text-xs text-red-500 mt-1 font-medium">⚠ Nivel crítico (≤80%)</p>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tiempo al volante</p>
              <Clock size={16} className="text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900 tabular-nums">7h<span className="text-base font-normal ml-1">10m</span></p>
            <p className="text-xs text-yellow-600 mt-1 font-medium">Excede límite recomendado (6h)</p>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nivel de Riesgo</p>
              <Shield size={16} className="text-red-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-red-600 tabular-nums">{d.riskLevel}%</p>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all" style={{ width: `${d.riskLevel}%` }} />
            </div>
            <p className="text-xs text-red-500 mt-1 font-medium">Riesgo muy alto</p>
          </div>
        </div>

        {/* Historical charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-1">Historial FC y SpO₂</h3>
            <p className="text-xs text-muted-foreground mb-4">Jornada de hoy</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={driverFcData}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="fc" name="FC (lpm)" stroke="#EF4444" fill="url(#fcGrad)" strokeWidth={2} dot={false} />
                <Area dataKey="spo2" name="SpO₂ (%)" stroke="#2563EB" fill="url(#spo2Grad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Tabla de alertas del turno</h3>
            <div className="space-y-2">
              {[
                { time: "14:32", type: "Crítico", desc: "SpO₂ 80% — Microsueño detectado" },
                { time: "13:15", type: "Prealerta", desc: "FC 63 lpm — Fatiga temprana" },
                { time: "12:40", type: "Prealerta", desc: "SpO₂ 87% — Vigilar saturación" },
                { time: "11:05", type: "Normal", desc: "Parámetros en rango normal" },
                { time: "09:30", type: "Normal", desc: "Inicio de turno — OK" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-gray-50">
                  <span className="text-xs text-muted-foreground w-12 tabular-nums">{a.time}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-20 text-center ${statusColor(a.type as DriverStatus)}`}>{a.type}</span>
                  <span className="text-xs text-gray-700 flex-1">{a.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alerts Screen ────────────────────────────────────────────────────────────
function AlertsScreen() {
  const [filter, setFilter] = useState<"all" | DriverStatus>("all");
  const alerts = [
    { id: "A001", driver: "Ana Rodríguez", vehicle: "Van V-03", fc: 52, spo2: 80, level: "Crítico" as DriverStatus, date: "03/08/2026", time: "14:32", resolved: false },
    { id: "A002", driver: "Luis Herrera", vehicle: "Bus B-07", fc: 63, spo2: 87, level: "Prealerta" as DriverStatus, date: "03/08/2026", time: "13:50", resolved: false },
    { id: "A003", driver: "Pedro Castro", vehicle: "Van V-08", fc: 61, spo2: 86, level: "Prealerta" as DriverStatus, date: "03/08/2026", time: "13:15", resolved: false },
    { id: "A004", driver: "Ana Rodríguez", vehicle: "Van V-03", fc: 65, spo2: 88, level: "Prealerta" as DriverStatus, date: "03/08/2026", time: "12:40", resolved: true },
    { id: "A005", driver: "Luis Herrera", vehicle: "Bus B-07", fc: 58, spo2: 84, level: "Crítico" as DriverStatus, date: "02/08/2026", time: "18:05", resolved: true },
  ];
  const filtered = filter === "all" ? alerts : alerts.filter(a => a.level === filter);
  const [resolved, setResolved] = useState<string[]>(["A004", "A005"]);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Gestión de Alertas" subtitle="Control y seguimiento" />
      <div className="flex-1 p-6 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {["all", "Normal", "Prealerta", "Crítico"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                filter === f
                  ? f === "all" ? "bg-blue-600 text-white border-blue-600" : f === "Crítico" ? "bg-red-500 text-white border-red-500" : f === "Prealerta" ? "bg-yellow-400 text-gray-900 border-yellow-400" : "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-600 border-border hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "Todas las alertas" : f}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {[
              { icon: Filter, label: "Por fecha" },
              { icon: Users, label: "Por conductor" },
              { icon: Truck, label: "Por vehículo" },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-2 rounded-xl border border-border bg-white hover:bg-gray-50">
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(a => {
            const isResolved = resolved.includes(a.id);
            return (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                isResolved ? "opacity-60 border-border" : a.level === "Crítico" ? "border-red-200 bg-red-50/20" : a.level === "Prealerta" ? "border-yellow-200 bg-yellow-50/20" : "border-green-200 bg-green-50/20"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    a.level === "Crítico" ? "bg-red-100" : a.level === "Prealerta" ? "bg-yellow-100" : "bg-green-100"
                  }`}>
                    {a.level === "Crítico" ? <AlertOctagon size={24} className="text-red-500" /> : <AlertTriangle size={24} className="text-yellow-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">{a.driver}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusColor(a.level)}`}>{a.level}</span>
                      {isResolved && <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle size={10} className="inline mr-1" />Resuelto</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span><Truck size={11} className="inline mr-1" />{a.vehicle}</span>
                      <span><Heart size={11} className="inline mr-1" />FC: {a.fc} lpm</span>
                      <span><Activity size={11} className="inline mr-1" />SpO₂: {a.spo2}%</span>
                      <span><Clock size={11} className="inline mr-1" />{a.date} · {a.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      <Eye size={13} />Ver
                    </button>
                    {!isResolved && (
                      <button
                        onClick={() => setResolved(r => [...r, a.id])}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle size={13} />Resolver
                      </button>
                    )}
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                      <Download size={13} />Exportar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── History & Analytics Screen ───────────────────────────────────────────────
function HistoryScreen() {
  const heatMax = 16;
  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Historial & Analítica" subtitle="Tendencias y estadísticas" />
      <div className="flex-1 p-6 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total alertas (semana)", val: "124", icon: Bell, color: "bg-blue-600" },
            { label: "Alertas críticas", val: "24", icon: AlertOctagon, color: "bg-red-500" },
            { label: "Horas de conducción", val: "412h", icon: Clock, color: "bg-purple-500" },
            { label: "Tasa de detección", val: "98.4%", icon: Shield, color: "bg-green-500" },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Weekly bar chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Distribución de alertas — Semana actual</h3>
          <p className="text-xs text-muted-foreground mb-4">Por día y nivel de alerta</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyAlerts} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="normal" name="Normal" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="prealerta" name="Prealerta" fill="#FACC15" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critico" name="Crítico" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap + Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-1">Mapa de calor de alertas</h3>
            <p className="text-xs text-muted-foreground mb-4">Por día y hora — alertas totales</p>
            <div className="overflow-x-auto">
              <div className="flex gap-1 mb-2">
                <div className="w-8" />
                {[...Array(24)].map((_, h) => (
                  <div key={h} className="w-5 text-center text-[9px] text-muted-foreground font-mono">{h}</div>
                ))}
              </div>
              {heatmapData.map((row, di) => (
                <div key={di} className="flex gap-1 mb-1 items-center">
                  <div className="w-8 text-[10px] text-muted-foreground font-semibold">{days[di]}</div>
                  {row.map((val, hi) => {
                    const intensity = val / heatMax;
                    const bg = val === 0 ? "#F1F5F9" : `rgba(37,99,235,${0.1 + intensity * 0.9})`;
                    return (
                      <div
                        key={hi}
                        title={`${days[di]} ${hi}:00 — ${val} alertas`}
                        className="w-5 h-5 rounded cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: bg }}
                      />
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-muted-foreground">Menos</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                  <div key={v} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(37,99,235,${v})` }} />
                ))}
                <span className="text-[10px] text-muted-foreground">Más</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Tabla histórica</h3>
                <p className="text-xs text-muted-foreground">Últimas 7 jornadas — resumen por conductor</p>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:underline">
                <Download size={14} />Exportar CSV
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Conductor", "Alertas", "Críticas", "FC prom.", "SpO₂ prom."].map(h => (
                      <th key={h} className="pb-2 text-left font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {drivers.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">{d.avatar}</div>
                          <span className="font-medium text-gray-800">{d.name.split(" ")[0]}</span>
                        </div>
                      </td>
                      <td className="py-2.5 font-semibold">{Math.floor(Math.random() * 20 + 5)}</td>
                      <td className="py-2.5 text-red-600 font-bold">{Math.floor(Math.random() * 5)}</td>
                      <td className="py-2.5 tabular-nums">{d.fc} lpm</td>
                      <td className="py-2.5 tabular-nums">{d.spo2}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen() {
  const [fcNormal, setFcNormal] = useState([60, 100]);
  const [spo2Normal, setSpo2Normal] = useState(90);
  const [spo2PreAlert, setSpo2PreAlert] = useState([85, 89]);
  const [spo2Critical, setSpo2Critical] = useState(80);
  const [fcDrop, setFcDrop] = useState(5);
  const [fcCritical, setFcCritical] = useState(60);
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Configuración de Umbrales" subtitle="Parámetros de detección" />
      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        {/* FC thresholds */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Heart size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Frecuencia Cardíaca (FC)</h3>
              <p className="text-xs text-muted-foreground">Umbrales en latidos por minuto (lpm)</p>
            </div>
          </div>
          <div className="space-y-6">
            {[
              { label: "FC Normal", sublabel: "Rango saludable durante conducción", val: `${fcNormal[0]}–${fcNormal[1]} lpm`, color: "text-green-600", badge: "bg-green-100 text-green-700" },
              { label: "FC Prealerta", sublabel: "Descenso mayor a X lpm respecto al promedio", val: `Descenso > ${fcDrop} lpm`, color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
              { label: "FC Crítica", sublabel: "Umbral de alerta crítica de microsueño", val: `≤${fcCritical} lpm`, color: "text-red-600", badge: "bg-red-100 text-red-700" },
            ].map(({ label, sublabel, val, color, badge }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>{val}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sublabel}</p>
                </div>
                <div className="w-48">
                  <input
                    type="range" min="40" max="120"
                    value={label === "FC Crítica" ? fcCritical : label === "FC Prealerta" ? fcDrop : fcNormal[0]}
                    onChange={e => {
                      if (label === "FC Crítica") setFcCritical(+e.target.value);
                      else if (label === "FC Prealerta") setFcDrop(+e.target.value);
                    }}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>40</span><span>80</span><span>120</span>
                  </div>
                </div>
                <input
                  type="number"
                  className="w-20 px-3 py-2 border border-border rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={label === "FC Crítica" ? fcCritical : label === "FC Prealerta" ? fcDrop : fcNormal[1]}
                  onChange={e => {
                    if (label === "FC Crítica") setFcCritical(+e.target.value);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* SpO2 thresholds */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Activity size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Saturación de Oxígeno (SpO₂)</h3>
              <p className="text-xs text-muted-foreground">Umbrales en porcentaje (%)</p>
            </div>
          </div>
          <div className="space-y-6">
            {[
              { label: "SpO₂ Normal", val: `>${spo2Normal}%`, color: "green", sub: "Saturación saludable" },
              { label: "SpO₂ Prealerta", val: `${spo2PreAlert[0]}–${spo2PreAlert[1]}%`, color: "yellow", sub: "Zona de vigilancia" },
              { label: "SpO₂ Crítica", val: `≤${spo2Critical}%`, color: "red", sub: "Riesgo de microsueño" },
            ].map(({ label, val, color, sub }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color === "green" ? "bg-green-100 text-green-700" : color === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{val}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className="w-48">
                  <input type="range" min="70" max="100"
                    value={color === "green" ? spo2Normal : color === "red" ? spo2Critical : spo2PreAlert[0]}
                    onChange={e => {
                      if (color === "green") setSpo2Normal(+e.target.value);
                      else if (color === "red") setSpo2Critical(+e.target.value);
                    }}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>70%</span><span>85%</span><span>100%</span>
                  </div>
                </div>
                <input
                  type="number"
                  className="w-20 px-3 py-2 border border-border rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={color === "green" ? spo2Normal : color === "red" ? spo2Critical : spo2PreAlert[0]}
                  onChange={e => {
                    if (color === "green") setSpo2Normal(+e.target.value);
                    else if (color === "red") setSpo2Critical(+e.target.value);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${saved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"}`}
          >
            {saved ? <><CheckCircle size={16} />Guardado</> : <><Save size={16} />Guardar cambios</>}
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-gray-600 hover:bg-gray-50 font-semibold text-sm">
            <RotateCcw size={16} />Restablecer valores
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile App Screen ────────────────────────────────────────────────────────
function MobileScreen() {
  const [mobileTab, setMobileTab] = useState<"home" | "history" | "notifications" | "profile">("home");
  const [driverStatus, setDriverStatus] = useState<DriverStatus>("Crítico");

  const statusConfig = {
    Normal: { bg: "from-green-400 to-green-600", ring: "rgba(34,197,94,0.3)", label: "Conducción segura", icon: "✓", sub: "Parámetros vitales en rango normal" },
    Prealerta: { bg: "from-yellow-400 to-orange-500", ring: "rgba(250,204,21,0.3)", label: "Fatiga detectada", icon: "⚠", sub: "Considera tomar un descanso pronto" },
    Crítico: { bg: "from-red-500 to-red-700", ring: "rgba(239,68,68,0.3)", label: "¡Deténgase ya!", icon: "✕", sub: "Riesgo alto de microsueño detectado" },
  };
  const cfg = statusConfig[driverStatus];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="App Móvil del Conductor" subtitle="Vista previa del dispositivo" />
      <div className="flex-1 p-6 flex gap-8 justify-center">
        {/* Phone mockup */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pantalla principal</p>
          <div className="relative" style={{ width: 320, height: 640 }}>
            {/* Phone frame */}
            <div className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-2xl" />
            <div className="absolute inset-[3px] bg-gray-800 rounded-[38px] overflow-hidden flex flex-col">
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-gray-900">
                <span className="text-white text-[11px] font-semibold">9:41</span>
                <div className="flex gap-1.5 items-center">
                  <Wifi size={12} className="text-white" />
                  <Battery size={12} className="text-white" />
                  <span className="text-white text-[10px]">87%</span>
                </div>
              </div>
              {/* App content */}
              <div className={`flex-1 bg-gradient-to-br ${cfg.bg} flex flex-col items-center justify-between px-6 pb-4 pt-6`}>
                {/* Header */}
                <div className="text-center">
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">DriverSafe</p>
                  <p className="text-white text-sm font-bold mt-0.5">Ana Rodríguez</p>
                </div>

                {/* Big indicator */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-48 h-48 rounded-full" style={{ boxShadow: `0 0 0 24px ${cfg.ring}, 0 0 0 48px ${cfg.ring.replace("0.3", "0.1")}` }} />
                  <div className="w-44 h-44 rounded-full bg-white/20 backdrop-blur flex flex-col items-center justify-center border-4 border-white/40">
                    <span className="text-5xl font-bold text-white">{cfg.icon}</span>
                    <p className="text-white text-xs font-bold mt-1 text-center px-2">{cfg.label}</p>
                  </div>
                </div>

                {/* Vitals */}
                <div className="w-full space-y-3">
                  <p className="text-white/80 text-xs text-center">{cfg.sub}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                      <Heart size={16} className="text-white mx-auto mb-1" />
                      <p className="text-white text-xl font-bold">52</p>
                      <p className="text-white/70 text-[10px]">lpm · FC</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                      <Activity size={16} className="text-white mx-auto mb-1" />
                      <p className="text-white text-xl font-bold">80%</p>
                      <p className="text-white/70 text-[10px]">SpO₂</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/20 backdrop-blur rounded-2xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-xs font-medium">Wearable conectado</span>
                    </div>
                    <Clock size={12} className="text-white/70" />
                    <span className="text-white/70 text-xs">7h 10m</span>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="w-full bg-white/10 backdrop-blur rounded-2xl flex overflow-hidden">
                  {[
                    { id: "home", icon: Home, label: "Inicio" },
                    { id: "history", icon: History, label: "Historial" },
                    { id: "notifications", icon: Bell, label: "Alertas" },
                    { id: "profile", icon: User, label: "Perfil" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setMobileTab(id as any)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all ${mobileTab === id ? "bg-white/30" : "hover:bg-white/10"}`}
                    >
                      <Icon size={16} className="text-white" />
                      <span className="text-[9px] text-white/80 font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications mockup */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pantalla de notificaciones</p>
          <div className="relative" style={{ width: 320, height: 640 }}>
            <div className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-2xl" />
            <div className="absolute inset-[3px] bg-gray-800 rounded-[38px] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-gray-900">
                <span className="text-white text-[11px] font-semibold">9:41</span>
                <div className="flex gap-1.5 items-center"><Wifi size={12} className="text-white" /><Battery size={12} className="text-white" /></div>
              </div>
              <div className="flex-1 bg-gray-900 flex flex-col">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="text-white font-bold text-base">Notificaciones</h3>
                  <p className="text-white/50 text-xs">3 alertas sin leer</p>
                </div>
                <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
                  {[
                    { level: "Crítico", msg: "SpO₂ crítico: 80%. Deténgase inmediatamente.", time: "14:32", rec: "Busque un lugar seguro para detenerse." },
                    { level: "Prealerta", msg: "Fatiga detectada: FC 63 lpm.", time: "13:50", rec: "Considere tomar un descanso de 20 minutos." },
                    { level: "Prealerta", msg: "Tiempo de conducción: 7 horas.", time: "13:00", rec: "Excede el límite recomendado. Descanse." },
                    { level: "Normal", msg: "Parámetros normalizados.", time: "12:10", rec: "Puede continuar con precaución." },
                  ].map((n, i) => (
                    <div key={i} className={`rounded-2xl p-3.5 ${n.level === "Crítico" ? "bg-red-900/40 border border-red-500/30" : n.level === "Prealerta" ? "bg-yellow-900/30 border border-yellow-500/30" : "bg-green-900/30 border border-green-500/30"}`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${n.level === "Crítico" ? "bg-red-500" : n.level === "Prealerta" ? "bg-yellow-400" : "bg-green-500"}`}>
                          {n.level === "Crítico" ? <AlertOctagon size={13} className="text-white" /> : n.level === "Prealerta" ? <AlertTriangle size={13} className="text-white" /> : <CheckCircle size={13} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{n.msg}</p>
                          <p className="text-white/50 text-[10px] mt-0.5">{n.rec}</p>
                          <p className="text-white/40 text-[10px] mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status switcher */}
        <div className="flex flex-col gap-4 justify-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Simular estado</p>
          {(["Normal", "Prealerta", "Crítico"] as DriverStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setDriverStatus(s)}
              className={`px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                driverStatus === s
                  ? s === "Normal" ? "bg-green-500 text-white border-green-500" : s === "Prealerta" ? "bg-yellow-400 text-gray-900 border-yellow-400" : "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-border hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Panel Screen ─────────────────────────────────────────────────────
function VehiclePanelScreen() {
  const [activeState, setActiveState] = useState<DriverStatus>("Normal");
  const ledColors = { Normal: "#22C55E", Prealerta: "#FACC15", Crítico: "#EF4444" };
  const led = ledColors[activeState];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <Topbar title="Panel Físico del Vehículo" subtitle="Dispositivo IoT instalado en tablero" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Device mockup */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 flex flex-col items-center gap-6">
            <h3 className="font-bold text-gray-900 self-start">Mockup del dispositivo</h3>
            {/* Device SVG */}
            <svg viewBox="0 0 320 200" className="w-full max-w-xs drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
              {/* Device body */}
              <rect x="20" y="30" width="280" height="140" rx="20" fill="#1E293B" />
              <rect x="28" y="38" width="264" height="124" rx="16" fill="#0F172A" />
              {/* Screen area */}
              <rect x="40" y="50" width="160" height="100" rx="10" fill="#1E40AF" opacity="0.3" />
              <rect x="40" y="50" width="160" height="100" rx="10" fill="none" stroke="#2563EB" strokeWidth="1" />
              {/* Screen content */}
              <text x="120" y="85" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace" opacity="0.9">DriverSafe IoT</text>
              <text x="120" y="98" fill="#60A5FA" fontSize="18" textAnchor="middle" fontFamily="monospace" fontWeight="bold">52 lpm</text>
              <text x="100" y="112" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">FC</text>
              <text x="120" y="125" fill="#60A5FA" fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold">80%</text>
              <text x="120" y="137" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">SpO₂</text>
              {/* Heartbeat line */}
              <polyline points="48,115 56,115 62,97 68,133 74,105 80,115 88,115 94,110 100,120 104,115 110,115" stroke="#22C55E" strokeWidth="1.5" fill="none" />
              {/* LED indicators */}
              <circle cx="235" cy="75" r="12" fill={activeState === "Normal" ? led : "#1E293B"} style={{ filter: activeState === "Normal" ? `drop-shadow(0 0 8px ${led})` : undefined }} />
              <circle cx="235" cy="100" r="12" fill={activeState === "Prealerta" ? led : "#1E293B"} style={{ filter: activeState === "Prealerta" ? `drop-shadow(0 0 8px ${led})` : undefined }} />
              <circle cx="235" cy="125" r="12" fill={activeState === "Crítico" ? led : "#1E293B"} style={{ filter: activeState === "Crítico" ? `drop-shadow(0 0 8px ${led})` : undefined }} />
              {/* LED labels */}
              <text x="255" y="79" fill="#94A3B8" fontSize="7" fontFamily="monospace">NORMAL</text>
              <text x="255" y="104" fill="#94A3B8" fontSize="7" fontFamily="monospace">ALERTA</text>
              <text x="255" y="129" fill="#94A3B8" fontSize="7" fontFamily="monospace">CRÍTICO</text>
              {/* Buzzer */}
              <rect x="215" y="148" width="50" height="14" rx="7" fill="#374151" />
              <text x="240" y="158" fill="#9CA3AF" fontSize="7" textAnchor="middle" fontFamily="monospace">BUZZER</text>
              {/* Connector */}
              <rect x="35" y="165" width="40" height="6" rx="3" fill="#374151" />
              <text x="55" y="158" fill="#6B7280" fontSize="6" textAnchor="middle" fontFamily="monospace">USB-C</text>
              {/* Antenna */}
              <line x1="280" y1="30" x2="295" y2="10" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="295" cy="9" r="3" fill="#60A5FA" opacity="0.8" />
              <text x="270" y="8" fill="#94A3B8" fontSize="7" fontFamily="monospace">IoT</text>
            </svg>
            {/* State buttons */}
            <div className="flex gap-3">
              {(["Normal", "Prealerta", "Crítico"] as DriverStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveState(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    activeState === s
                      ? s === "Normal" ? "bg-green-500 text-white border-green-500" : s === "Prealerta" ? "bg-yellow-400 text-gray-900 border-yellow-400" : "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-500 border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* State meanings */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-900">Significado de estados</h3>
            {[
              {
                status: "Normal" as DriverStatus,
                led: "🟢",
                desc: "El conductor presenta parámetros vitales dentro del rango saludable.",
                fc: "FC: 60–100 lpm",
                spo2: "SpO₂: >90%",
                action: "Sin acción requerida. Continúa monitoreo.",
                buzzer: "Silencio",
              },
              {
                status: "Prealerta" as DriverStatus,
                led: "🟡",
                desc: "Se detectan señales tempranas de fatiga o somnolencia.",
                fc: "FC: descenso >5 lpm del promedio",
                spo2: "SpO₂: 85–89%",
                action: "Alerta sonora intermitente. Se notifica al supervisor.",
                buzzer: "Beep intermitente (1 Hz)",
              },
              {
                status: "Crítico" as DriverStatus,
                led: "🔴",
                desc: "Riesgo alto de microsueño. Intervención inmediata necesaria.",
                fc: "FC: ≤60 lpm",
                spo2: "SpO₂: ≤80%",
                action: "Alarma continua. Notificación urgente al supervisor.",
                buzzer: "Alarma continua (3 Hz)",
              },
            ].map(({ status, led, desc, fc, spo2, action, buzzer }) => (
              <div key={status} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                activeState === status
                  ? status === "Crítico" ? "border-red-300 ring-2 ring-red-100" : status === "Prealerta" ? "border-yellow-300 ring-2 ring-yellow-100" : "border-green-300 ring-2 ring-green-100"
                  : "border-border opacity-60"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{led}</span>
                  <div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusColor(status)}`}>{status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{desc}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">FC:</span> <span className="text-gray-700">{fc.replace("FC: ", "")}</span></div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-semibold text-gray-600">SpO₂:</span> <span className="text-gray-700">{spo2.replace("SpO₂: ", "")}</span></div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2"><span className="font-semibold text-gray-600">Acción:</span> <span className="text-gray-700"> {action}</span></div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2"><span className="font-semibold text-gray-600">Zumbador:</span> <span className="text-gray-700"> {buzzer}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Especificaciones del dispositivo</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Conectividad", val: "WiFi 802.11 b/g/n + BLE 5.0" },
              { label: "Sensores", val: "FC óptico + SpO₂ + Acelerómetro" },
              { label: "Batería", val: "3000 mAh / 24h autonomía" },
              { label: "Protocolo", val: "MQTT sobre TLS 1.3" },
              { label: "Latencia", val: "<500ms extremo a extremo" },
              { label: "Precisión FC", val: "±2 lpm (validado clínicamente)" },
              { label: "Precisión SpO₂", val: "±2% (70–100%)" },
              { label: "IP Rating", val: "IP67 — resistente al polvo y agua" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function AppLayout({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar current={screen} onChange={setScreen} />
      {screen === "dashboard" && <DashboardScreen onDriverClick={() => setScreen("driver-detail")} />}
      {screen === "driver-detail" && <DriverDetailScreen />}
      {screen === "alerts" && <AlertsScreen />}
      {screen === "history" && <HistoryScreen />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "mobile" && <MobileScreen />}
      {screen === "vehicle-panel" && <VehiclePanelScreen />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  return screen === "login"
    ? <LoginScreen onLogin={() => setScreen("dashboard")} />
    : <AppLayout screen={screen} setScreen={setScreen} />;
}
