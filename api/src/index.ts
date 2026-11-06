import { RAIZ } from "./env.js";
import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { bloqueado, login, protegerApi, verificar } from "./auth.js";
import { crearIndices, crearRutas } from "./rutas.js";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "driversafe_iot";
const PORT = Number(process.env.PORT ?? 3001);
const PRODUCCION = process.env.NODE_ENV === "production";

if (!URI) {
  console.error("Falta la variable MONGODB_URI");
  process.exit(1);
}

const client = new MongoClient(URI);
await client.connect();
const db = client.db(DB_NAME);
await crearIndices(db).catch((e) => console.warn("No se pudieron crear los índices:", e.message));

const app = express();
app.set("trust proxy", 1);
if (!PRODUCCION) app.use(cors());
app.use(express.json({ limit: "50kb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.get("/api/auth", (req, res) => {
  const usuario = verificar(req.headers.authorization?.replace(/^Bearer /, ""));
  res.json({ requerida: true, usuario });
});

app.post("/api/auth/login", (req, res) => {
  const ip = req.ip ?? "";
  if (bloqueado(ip)) return res.status(429).json({ error: "Demasiados intentos. Espera un minuto." });
  const token = login(req.body?.usuario, req.body?.clave, ip);
  if (!token) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  res.json({ token, usuario: "supervisor" });
});

app.use("/api", protegerApi, crearRutas(db));
app.use("/api", (_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

const WEB_DIST = path.join(RAIZ, "web/dist");
if (fs.existsSync(path.join(WEB_DIST, "index.html"))) {
  app.use(express.static(WEB_DIST, { index: false, maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(path.join(WEB_DIST, "index.html")));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => console.log(`DriverSafe API escuchando en http://localhost:${PORT}`));

const cerrar = async () => {
  await client.close();
  process.exit(0);
};
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
