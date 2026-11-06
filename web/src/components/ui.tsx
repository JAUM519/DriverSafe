import type { ComponentType, ReactNode } from "react";
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle, Inbox, TrendingDown, TrendingUp, WifiOff, type LucideIcon } from "lucide-react";
import { estiloNivel, type Nivel } from "../lib/estado";

type Icono = LucideIcon | ComponentType<{ size?: number; className?: string }>;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-border shadow-sm ${className}`}>{children}</div>;
}

export function CardTitulo({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="font-bold text-gray-900 text-base">{titulo}</h3>
        {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

export function KpiCard({ titulo, valor, unidad, icono: Icon, color, tendencia, etiquetaTendencia, nota }: {
  titulo: string; valor: ReactNode; unidad?: string; icono: Icono; color: string;
  tendencia?: "buena" | "mala" | "neutral"; etiquetaTendencia?: string; nota?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {etiquetaTendencia && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            tendencia === "buena" ? "bg-green-50 text-green-600" : tendencia === "mala" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
          }`}>
            {tendencia === "buena" ? <TrendingDown size={12} /> : tendencia === "mala" ? <TrendingUp size={12} /> : null}
            {etiquetaTendencia}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
          {valor}{unidad && <span className="text-lg font-medium text-muted-foreground ml-1">{unidad}</span>}
        </p>
        {nota && <p className="text-xs text-muted-foreground mt-1">{nota}</p>}
      </div>
    </Card>
  );
}

const iconoNivel: Record<Nivel, Icono> = {
  Normal: CheckCircle, Prealerta: AlertTriangle, Crítico: AlertOctagon, "Sin señal": WifiOff, "Sin estado": AlertCircle,
};

export function EstadoBadge({ nivel, icono = false, grande = false }: { nivel: Nivel; icono?: boolean; grande?: boolean }) {
  const Icon = iconoNivel[nivel];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${grande ? "px-3 py-1 text-xs font-bold" : "px-2.5 py-1 text-xs"} ${estiloNivel[nivel].badge}`}>
      {icono ? <Icon size={14} /> : <span className={`w-1.5 h-1.5 rounded-full ${estiloNivel[nivel].dot}`} />}
      {nivel}
    </span>
  );
}

export function IconoNivel({ nivel, size = 15 }: { nivel: Nivel; size?: number }) {
  const Icon = iconoNivel[nivel];
  return <Icon size={size} className={estiloNivel[nivel].texto} />;
}

export function Vacio({ titulo, detalle, icono: Icon = Inbox }: { titulo: string; detalle?: ReactNode; icono?: Icono }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Icon size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{titulo}</p>
      {detalle && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{detalle}</p>}
    </div>
  );
}

export function Cargando({ alto = 160 }: { alto?: number }) {
  return <div className="rounded-xl bg-muted animate-pulse" style={{ height: alto }} />;
}

export function Aviso({ tono = "info", children }: { tono?: "info" | "error" | "warn"; children: ReactNode }) {
  const c = tono === "error" ? "bg-red-50 border-red-200 text-red-700" : tono === "warn" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-sm ${c}`}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Boton({ children, onClick, variante = "borde", icono: Icon, disabled, type = "button", className = "" }: {
  children: ReactNode; onClick?: () => void; variante?: "primario" | "borde" | "texto"; icono?: Icono;
  disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  const v = variante === "primario"
    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 px-4 py-2"
    : variante === "texto"
      ? "text-blue-600 hover:bg-blue-50 px-3 py-1.5"
      : "text-gray-600 border border-border bg-white hover:bg-gray-50 px-3 py-1.5";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none ${v} ${className}`}>
      {Icon && <Icon size={14} />}{children}
    </button>
  );
}

export const estiloTooltip = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 };
export const ejeTick = { fontSize: 11, fill: "#64748B" };
