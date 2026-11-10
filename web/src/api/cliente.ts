import { useCallback, useEffect, useRef, useState } from "react";

const CLAVE_TOKEN = "driversafe.token";
const API_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/driversafe`;

export const sesion = {
  token(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_TOKEN) ?? localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(token: string, recordar: boolean) {
    try {
      (recordar ? localStorage : sessionStorage).setItem(CLAVE_TOKEN, token);
    } catch {
      // sin almacenamiento disponible (modo privado)
    }
  },
  cerrar() {
    try {
      sessionStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      // ignorado
    }
  },
};

export class ErrorApi extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
  }
}

let alNoAutorizado: (() => void) | null = null;
export const onNoAutorizado = (fn: () => void) => {
  alNoAutorizado = fn;
};

export async function api<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const token = sesion.token();
  const res = await fetch(`${API_URL}${ruta}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && ruta !== "/login") alNoAutorizado?.();
  const cuerpo = await res.json().catch(() => null);
  if (!res.ok) throw new ErrorApi(res.status, cuerpo?.error ?? `Error ${res.status}`);
  return cuerpo as T;
}

export function useApi<T>(ruta: string | null, intervaloMs = 0) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const rutaActual = useRef(ruta);
  rutaActual.current = ruta;

  const cargar = useCallback(async () => {
    if (!ruta) return;
    try {
      const d = await api<T>(ruta);
      if (rutaActual.current !== ruta) return;
      setDatos(d);
      setError(null);
      setActualizado(new Date());
    } catch (e) {
      if (rutaActual.current === ruta) setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      if (rutaActual.current === ruta) setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    setCargando(true);
    cargar();
    if (!intervaloMs) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, intervaloMs);
    return () => clearInterval(iv);
  }, [cargar, intervaloMs]);

  return { datos, error, cargando, actualizado, recargar: cargar };
}
