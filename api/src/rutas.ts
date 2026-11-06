import { Router, type Request, type Response, type NextFunction } from "express";
import { ObjectId, type Db, type Document } from "mongodb";

const MQTT_USER = process.env.MQTT_USER ?? "<usuario>";

export const SISTEMA = {
  broker: `${process.env.MQTT_BROKER ?? "maqiatto.com"}:${process.env.MQTT_PORT ?? 1883}`,
  topico_datos: `${MQTT_USER}/tp01/datos`,
  topico_comando: `${MQTT_USER}/tp01/command/<id_conductor>`,
  intervalo_muestreo_s: 1,
  ventana_movimiento_s: 10,
  ventana_movimiento_fatiga_s: 5,
  zona_horaria: "America/Bogota",
};

const UMBRALES_POR_DEFECTO = {
  fc_min_normal: 60,
  fc_max_normal: 100,
  spo2_min_normal: 90,
  spo2_prealerta_min: 85,
  spo2_prealerta_max: 89,
  fc_caida_prealerta: 5,
  fc_critica: 60,
  spo2_critica: 80,
  lecturas_criticas: 3,
};
type Umbrales = typeof UMBRALES_POR_DEFECTO;
const CAMPOS_UMBRAL = Object.keys(UMBRALES_POR_DEFECTO) as (keyof Umbrales)[];

const EN_LINEA_MS = 60_000;
const PAUSA_SESION_MS = 30 * 60_000;
const OFFSET_BOGOTA_MS = -5 * 3600_000;

type Handler = (req: Request, res: Response) => Promise<unknown>;
const ruta = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const entero = (v: unknown, def: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : def;
};

const medianocheBogota = (ms: number) => {
  const DIA = 86_400_000;
  return Math.floor((ms + OFFSET_BOGOTA_MS) / DIA) * DIA - OFFSET_BOGOTA_MS;
};

const vehiculoDe = (id: string) => (id.includes("-") ? id.split("-")[0] : id);

export async function crearIndices(db: Db) {
  await Promise.all([
    db.collection("mediciones").createIndex({ id_conductor: 1, timestamp_servidor: -1 }),
    db.collection("mediciones").createIndex({ timestamp_servidor: -1 }),
    db.collection("estados").createIndex({ id_conductor: 1, timestamp: -1 }),
    db.collection("alertas").createIndex({ timestamp_inicio: -1 }),
    db.collection("eventos_movimiento").createIndex({ id_conductor: 1, timestamp_servidor: -1 }),
  ]);
}

export function crearRutas(db: Db) {
  const r = Router();

  const cacheSesion = new Map<string, { calculado: number; inicio: number | null }>();

  async function inicioSesion(id: string, ultimo: number): Promise<number | null> {
    const c = cacheSesion.get(id);
    if (c && Date.now() - c.calculado < 30_000) return c.inicio;
    // la sesión empieza después del último hueco de más de 30 min sin lecturas
    const minutos = await db.collection("mediciones").aggregate<{ _id: Date }>([
      { $match: { id_conductor: id, timestamp_servidor: { $gte: new Date(ultimo - 16 * 3600_000) } } },
      { $group: { _id: { $dateTrunc: { date: "$timestamp_servidor", unit: "minute" } } } },
      { $sort: { _id: -1 } },
    ]).toArray();
    let inicio: number | null = minutos.length ? minutos[0]._id.getTime() : null;
    for (let i = 1; i < minutos.length; i++) {
      if (minutos[i - 1]._id.getTime() - minutos[i]._id.getTime() > PAUSA_SESION_MS) break;
      inicio = minutos[i]._id.getTime();
    }
    cacheSesion.set(id, { calculado: Date.now(), inicio });
    return inicio;
  }

  async function nombres() {
    const lista = await db.collection("conductores").find().toArray();
    return new Map(lista.map((c) => [String(c.id_conductor), c]));
  }

  r.get("/flota", ruta(async (_req, res) => {
    const ahora = Date.now();
    const registro = await nombres();
    const configs = new Map((await db.collection("configuracion_conductor").find().toArray()).map((c) => [String(c.id_conductor), c]));
    const umbralesDe = (id: string): Umbrales => {
      const c = configs.get(id);
      return Object.fromEntries(CAMPOS_UMBRAL.map((k) => {
        const v = Number(c?.[k]);
        return [k, Number.isFinite(v) ? v : UMBRALES_POR_DEFECTO[k]];
      })) as Umbrales;
    };
    const conLecturas = await db.collection("mediciones").distinct("id_conductor", {
      timestamp_servidor: { $gte: new Date(ahora - 7 * 86_400_000) },
    });
    const ids = [...new Set([...registro.keys(), ...conLecturas.map(String)])].sort();

    const conductores = await Promise.all(ids.map(async (id) => {
      const [medicion, estado, movimiento] = await Promise.all([
        db.collection("mediciones").findOne({ id_conductor: id }, { sort: { timestamp_servidor: -1 } }),
        db.collection("estados").findOne({ id_conductor: id }, { sort: { timestamp: -1 } }),
        db.collection("eventos_movimiento").findOne({ id_conductor: id }, { sort: { timestamp_servidor: -1 } }),
      ]);
      const tMedicion = medicion?.timestamp_servidor ? new Date(medicion.timestamp_servidor).getTime() : null;
      const enLinea = tMedicion !== null && ahora - tMedicion <= EN_LINEA_MS;
      const tMov = movimiento?.timestamp_servidor ? new Date(movimiento.timestamp_servidor).getTime() : null;
      const inicio = enLinea && tMedicion ? await inicioSesion(id, tMedicion) : null;
      const reg = registro.get(id);
      return {
        id,
        nombre: reg?.nombre ?? null,
        vehiculo: reg?.vehiculo ?? vehiculoDe(id),
        registrado: Boolean(reg),
        activo_registro: reg?.activo ?? null,
        en_linea: enLinea,
        ultima_lectura: tMedicion ? new Date(tMedicion) : null,
        fc: medicion ? Number(medicion.frecuencia_cardiaca) : null,
        spo2: medicion ? Number(medicion.spo2) : null,
        spo2_valida: !(tMov && tMedicion && tMedicion - tMov <= SISTEMA.ventana_movimiento_s * 1000 && tMedicion >= tMov),
        ultimo_movimiento: tMov ? new Date(tMov) : null,
        estado: estado?.estado ?? null,
        accion: estado?.accion ?? null,
        promedio_fc: estado?.promedio_fc ?? null,
        criticas_consecutivas: estado?.criticas_consecutivas ?? null,
        estado_desde: estado?.timestamp ?? null,
        inicio_sesion: inicio ? new Date(inicio) : null,
        umbrales: umbralesDe(id),
      };
    }));

    const hoy = medianocheBogota(ahora);
    const ayer = hoy - 86_400_000;
    const contar = (filtro: Document) => db.collection("alertas").countDocuments(filtro);
    const enLinea = new Set(conductores.filter((c) => c.en_linea).map((c) => c.id));
    const activas = await db.collection("alertas").find({ activa: true }).project({ id_conductor: 1 }).toArray();

    const [criticasHoy, criticasAyer, alertasHoy] = await Promise.all([
      contar({ tipo_alerta: "ALERTA_CRITICA", timestamp_inicio: { $gte: new Date(hoy) } }),
      contar({ tipo_alerta: "ALERTA_CRITICA", timestamp_inicio: { $gte: new Date(ayer), $lt: new Date(hoy) } }),
      contar({ timestamp_inicio: { $gte: new Date(hoy) } }),
    ]);

    res.json({
      generado: new Date(ahora),
      conductores,
      resumen: {
        criticas_hoy: criticasHoy,
        criticas_ayer: criticasAyer,
        alertas_hoy: alertasHoy,
        alertas_vigentes: activas.filter((a) => enLinea.has(String(a.id_conductor))).length,
      },
    });
  }));

  r.get("/series", ruta(async (req, res) => {
    const minutos = entero(req.query.minutos, 30, 24 * 60);
    const paso = minutos <= 15 ? { unit: "second", binSize: 15 } : { unit: "minute", binSize: Math.max(1, Math.round(minutos / 60)) };
    const filtro: Document = { timestamp_servidor: { $gte: new Date(Date.now() - minutos * 60_000) } };
    if (typeof req.query.conductor === "string") filtro.id_conductor = req.query.conductor;
    const filas = await db.collection("mediciones").aggregate([
      { $match: filtro },
      { $group: {
        _id: { id: "$id_conductor", t: { $dateTrunc: { date: "$timestamp_servidor", ...paso } } },
        fc: { $avg: "$frecuencia_cardiaca" },
        spo2: { $avg: "$spo2" },
        n: { $sum: 1 },
      } },
      { $sort: { "_id.t": 1 } },
      { $project: { _id: 0, id: "$_id.id", t: "$_id.t", fc: { $round: ["$fc", 1] }, spo2: { $round: ["$spo2", 1] }, n: 1 } },
    ]).toArray();
    res.json({ minutos, paso, filas });
  }));

  r.get("/alertas", ruta(async (req, res) => {
    const filtro: Document = {};
    if (req.query.activa === "true") filtro.activa = true;
    if (req.query.activa === "false") filtro.activa = false;
    if (req.query.tipo === "ALERTA_CRITICA" || req.query.tipo === "PRE_ALERTA") filtro.tipo_alerta = req.query.tipo;
    if (typeof req.query.conductor === "string" && req.query.conductor) filtro.id_conductor = req.query.conductor;
    const desde = Date.parse(String(req.query.desde ?? ""));
    const hasta = Date.parse(String(req.query.hasta ?? ""));
    if (Number.isFinite(desde) || Number.isFinite(hasta)) {
      filtro.timestamp_inicio = {
        ...(Number.isFinite(desde) && { $gte: new Date(desde) }),
        ...(Number.isFinite(hasta) && { $lt: new Date(hasta) }),
      };
    }
    const limit = entero(req.query.limit, 100, 1000);
    res.json(await db.collection("alertas").find(filtro).sort({ timestamp_inicio: -1 }).limit(limit).toArray());
  }));

  r.patch("/alertas/:id/revisar", ruta(async (req, res) => {
    const id = req.params.id;
    const filtro = ObjectId.isValid(id) && id.length === 24 ? { $or: [{ _id: id as never }, { _id: new ObjectId(id) }] } : { _id: id as never };
    const nota = typeof req.body?.nota === "string" ? req.body.nota.slice(0, 500) : null;
    const r2 = await db.collection("alertas").findOneAndUpdate(
      filtro,
      { $set: { revisada: true, revisada_en: new Date(), nota_supervisor: nota } },
      { returnDocument: "after" },
    );
    if (!r2) return res.status(404).json({ error: "Alerta no encontrada" });
    res.json(r2);
  }));

  r.get("/analitica", ruta(async (_req, res) => {
    const [semana, conductores, diaHora, registro] = await Promise.all([
      db.collection("analisis_semana").findOne({ _id: "semana" as never }),
      db.collection("analisis_conductor").find().sort({ conductor: 1 }).toArray(),
      db.collection("analisis_dia_hora").find().sort({ dia: 1, hora: 1 }).toArray(),
      nombres(),
    ]);
    res.json({
      semana,
      conductores: conductores.map((c) => ({ ...c, nombre: registro.get(String(c.conductor))?.nombre ?? null })),
      dia_hora: diaHora,
    });
  }));

  r.get("/configuracion", ruta(async (_req, res) => {
    const [configs, registro] = await Promise.all([
      db.collection("configuracion_conductor").find().toArray(),
      nombres(),
    ]);
    const porId = new Map(configs.map((c) => [String(c.id_conductor), c]));
    const ids = [...new Set([...registro.keys(), ...porId.keys()])].sort();
    res.json({
      sistema: SISTEMA,
      por_defecto: UMBRALES_POR_DEFECTO,
      conductores: ids.map((id) => {
        const c = porId.get(id);
        const umbrales = Object.fromEntries(CAMPOS_UMBRAL.map((k) => [k, Number(c?.[k] ?? UMBRALES_POR_DEFECTO[k])]));
        return { id_conductor: id, nombre: registro.get(id)?.nombre ?? null, umbrales, fecha_actualizacion: c?.fecha_actualizacion ?? null, personalizado: Boolean(c) };
      }),
    });
  }));

  r.put("/configuracion/:id", ruta(async (req, res) => {
    const cuerpo = req.body ?? {};
    const u: Partial<Umbrales> = {};
    for (const k of CAMPOS_UMBRAL) {
      const v = Number(cuerpo[k]);
      if (!Number.isFinite(v)) return res.status(400).json({ error: `Valor inválido para ${k}` });
      u[k] = v;
    }
    const x = u as Umbrales;
    const errores: string[] = [];
    if (x.fc_min_normal < 30 || x.fc_max_normal > 220 || x.fc_min_normal >= x.fc_max_normal) errores.push("Rango de FC normal inválido");
    if (x.fc_critica < 30 || x.fc_critica > x.fc_max_normal) errores.push("FC crítica fuera de rango");
    if (x.fc_caida_prealerta < 1 || x.fc_caida_prealerta > 40) errores.push("Caída de FC para pre-alerta debe estar entre 1 y 40");
    if (!(x.spo2_critica < x.spo2_prealerta_min && x.spo2_prealerta_min <= x.spo2_prealerta_max && x.spo2_prealerta_max < x.spo2_min_normal && x.spo2_min_normal <= 100))
      errores.push("Los umbrales de SpO₂ deben cumplir: crítica < pre-alerta mín ≤ pre-alerta máx < normal ≤ 100");
    if (x.spo2_critica < 50) errores.push("SpO₂ crítica debe ser ≥ 50");
    if (!Number.isInteger(x.lecturas_criticas) || x.lecturas_criticas < 1 || x.lecturas_criticas > 20) errores.push("Lecturas críticas consecutivas debe ser un entero entre 1 y 20");
    if (errores.length) return res.status(400).json({ error: errores.join(". ") });

    await db.collection("configuracion_conductor").updateOne(
      { id_conductor: req.params.id },
      { $set: { ...x, fecha_actualizacion: new Date() } },
      { upsert: true },
    );
    res.json({ ok: true });
  }));

  return r;
}
