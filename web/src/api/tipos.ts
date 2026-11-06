export type EstadoNodeRed = "NORMAL" | "PRE-ALERTA" | "ALERTA CRITICA";

export interface ConductorVivo {
  id: string;
  nombre: string | null;
  vehiculo: string;
  registrado: boolean;
  activo_registro: boolean | null;
  en_linea: boolean;
  ultima_lectura: string | null;
  fc: number | null;
  spo2: number | null;
  spo2_valida: boolean;
  ultimo_movimiento: string | null;
  estado: EstadoNodeRed | null;
  accion: string | null;
  promedio_fc: number | null;
  criticas_consecutivas: number | null;
  estado_desde: string | null;
  inicio_sesion: string | null;
  umbrales: Umbrales;
}

export interface Flota {
  generado: string;
  conductores: ConductorVivo[];
  resumen: { criticas_hoy: number; criticas_ayer: number; alertas_hoy: number; alertas_vigentes: number };
}

export interface FilaSerie { id: string; t: string; fc: number; spo2: number; n: number }
export interface Series { minutos: number; filas: FilaSerie[] }

export interface Alerta {
  _id: string;
  id_conductor: string;
  tipo_alerta: "ALERTA_CRITICA" | "PRE_ALERTA";
  descripcion: string;
  nivel: string;
  timestamp_inicio: string;
  timestamp_fin: string | null;
  activa: boolean;
  revisada?: boolean;
  revisada_en?: string;
  nota_supervisor?: string | null;
}

export interface AnalisisConductor {
  conductor: string;
  nombre: string | null;
  vehiculo: string;
  alertas: number;
  alertas_criticas: number;
  fc_prom: number | null;
  spo2_prom: number | null;
  horas_conduccion: number;
  sesion_activa: boolean;
  tiempo_al_volante_h: number;
  excede_limite: boolean;
  actualizado: string;
}

export interface CeldaDiaHora {
  dia: string;
  dsem: number;
  dia_semana: string;
  hora: number;
  normal: number;
  prealerta: number;
  critica: number;
  alertas: number;
  alertas_criticas: number;
  actualizado: string;
}

export interface Analitica {
  semana: {
    alertas_total: number;
    alertas_criticas: number;
    horas_conduccion: number;
    conductores: number;
    desde: string;
    hasta: string;
    actualizado: string;
  } | null;
  conductores: AnalisisConductor[];
  dia_hora: CeldaDiaHora[];
}

export interface Umbrales {
  fc_min_normal: number;
  fc_max_normal: number;
  spo2_min_normal: number;
  spo2_prealerta_min: number;
  spo2_prealerta_max: number;
  fc_caida_prealerta: number;
  fc_critica: number;
  spo2_critica: number;
  lecturas_criticas: number;
}

export interface Configuracion {
  sistema: {
    broker: string;
    topico_datos: string;
    topico_comando: string;
    intervalo_muestreo_s: number;
    ventana_movimiento_s: number;
    ventana_movimiento_fatiga_s: number;
    zona_horaria: string;
  };
  por_defecto: Umbrales;
  conductores: {
    id_conductor: string;
    nombre: string | null;
    umbrales: Umbrales;
    fecha_actualizacion: string | null;
    personalizado: boolean;
  }[];
}
