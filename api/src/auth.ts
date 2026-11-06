import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const USUARIO = "supervisor";
const CLAVE = process.env.DASHBOARD_PASSWORD || "admin";
const SECRETO = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const DURACION_MS = 12 * 60 * 60 * 1000;

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET no definido: las sesiones se pierden al reiniciar el servidor.");
}

const firmar = (datos: string) => crypto.createHmac("sha256", SECRETO).update(datos).digest("base64url");

const iguales = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const fallos = new Map<string, { n: number; hasta: number }>();
export function bloqueado(ip: string) {
  const f = fallos.get(ip);
  return Boolean(f && f.n >= 5 && Date.now() < f.hasta);
}
function registrarFallo(ip: string) {
  const f = fallos.get(ip);
  const n = f && Date.now() < f.hasta ? f.n + 1 : 1;
  fallos.set(ip, { n, hasta: Date.now() + 60_000 });
}

export function login(usuario: unknown, clave: unknown, ip: string): string | null {
  const ok = typeof usuario === "string" && typeof clave === "string" && iguales(usuario.trim(), USUARIO) && iguales(clave, CLAVE);
  if (!ok) {
    registrarFallo(ip);
    return null;
  }
  fallos.delete(ip);
  const cuerpo = Buffer.from(JSON.stringify({ u: USUARIO, exp: Date.now() + DURACION_MS })).toString("base64url");
  return `${cuerpo}.${firmar(cuerpo)}`;
}

export function verificar(token: string | undefined): string | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma || !iguales(firma, firmar(cuerpo))) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
    return u === USUARIO && Date.now() < exp ? u : null;
  } catch {
    return null;
  }
}

export function protegerApi(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (verificar(token)) return next();
  res.status(401).json({ error: "Sesión inválida o vencida" });
}
