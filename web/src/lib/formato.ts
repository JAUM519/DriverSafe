export const ZONA = "America/Bogota";

export const fechaLarga = (d = new Date()) => {
  const s = d.toLocaleDateString("es-CO", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const hora = (iso: string | Date | null | undefined, conSegundos = false) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        timeZone: ZONA, hour: "2-digit", minute: "2-digit", ...(conSegundos && { second: "2-digit" }), hour12: false,
      })
    : "—";

export const fechaHora = (iso: string | Date | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("es-CO", {
        timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : "—";

export function hace(iso: string | Date | null | undefined, ahora = Date.now()) {
  if (!iso) return "Sin datos";
  const s = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function duracion(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const h = Math.floor(min / 60);
  return h ? `${h}h ${String(min % 60).padStart(2, "0")}m` : `${min} min`;
}

export const num = (v: number | null | undefined, dec = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toFixed(dec);

export function iniciales(nombre: string | null, id: string) {
  if (nombre) {
    const p = nombre.trim().split(/\s+/);
    return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
  }
  const m = id.match(/(\d+)$/);
  return m ? `C${m[1]}` : id.slice(0, 2).toUpperCase();
}

export function nombreCorto(nombre: string | null, id: string) {
  if (!nombre) return id;
  const p = nombre.trim().split(/\s+/);
  if (p.length <= 2) return nombre;
  return p.length >= 4 ? `${p[0]} ${p[2]}` : `${p[0]} ${p[1]}`;
}

export function vitalesDeDescripcion(desc: string) {
  const fc = desc.match(/FC=([\d.]+)/);
  const spo2 = desc.match(/SpO2=([\d.]+)/);
  return { fc: fc ? Number(fc[1]) : null, spo2: spo2 ? Number(spo2[1]) : null };
}

export function diaLocal(d: Date) {
  return new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}
