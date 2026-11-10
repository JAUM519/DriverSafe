# DriverSafe IoT

Sistema IoT para detectar fatiga en conductores de transporte a partir de frecuencia cardíaca, SpO₂ y movimiento.
Un wearable publica las lecturas por MQTT, Node-RED las clasifica en **Normal / Prealerta / Alerta crítica**,
enciende el LED correspondiente en el tablero del vehículo y guarda todo en MongoDB Atlas.

La visualización se hace con dos estrategias complementarias:

1. **Dashboard en Node-RED** (`@flowfuse/node-red-dashboard`) con medidores y gráficas en tiempo real.
2. **API REST en Node-RED** consumida por una **aplicación web** (React + Vite + TypeScript + Chart.js), que además
   embebe el dashboard de Node-RED en un `iframe`.

```
 Wearable / simulador ──MQTT──▶ Node-RED ──▶ MongoDB Atlas
          ▲                     │   │  ▲
          └── comando LED ◀─────┘   │  └── API REST (http in → mongodb → http response)
                                    │                      ▲
                       Dashboard ◀──┘                      │ fetch
                    /dashboard/page1 ──── iframe ──▶ Aplicación web (React + Chart.js)
```

## Estructura

```
├── node-red/
│   ├── flows.json                          Flujo completo de Node-RED
│   └── DriverSafe.postman_collection.json  Pruebas de la API en Postman
├── web/                                    Aplicación web (React, Vite, TypeScript, Chart.js, Tailwind)
├── simulator/                              Simulador de sensores con interfaz gráfica (Python, Tkinter)
├── design/ui-prototype/                    Prototipo UI exportado de Figma Make
└── .env.example                            Variables de entorno
```

### Pestañas del flujo de Node-RED

| Pestaña | Contenido |
|---|---|
| **Flujo proyecto** | Recepción MQTT, validación de movimiento, clasificación (*Estado*), comando al LED, almacenamiento, alertas, limpieza y análisis de 7 días |
| **API REST** | Endpoints `http in → function → mongodb → json → change (headers) → http response` |
| **Dashboard** | `link in` → *switch* por conductor → funciones que extraen FC, SpO₂ y estado → `ui-gauge`, `ui-text` y `ui-chart` |

## Requisitos

- Node-RED 3 o superior con los paquetes `node-red-node-mongodb` y `@flowfuse/node-red-dashboard`
- Node.js 20 o superior (aplicación web)
- Python 3.10 o superior (simulador)
- Una base de datos en MongoDB Atlas y una cuenta en [Maqiatto](https://www.maqiatto.com) (bróker MQTT)
- [Postman](https://www.postman.com/downloads/) para probar la API

## Puesta en marcha

### 1. Variables de entorno

```bash
cp .env.example .env
```

Completa `.env` con la URI de MongoDB y las credenciales de MQTT. El archivo está en `.gitignore`.

### 2. Node-RED

1. **Manage palette → Install**: instala `node-red-node-mongodb` y `@flowfuse/node-red-dashboard`.
2. Menú → **Import** → `node-red/flows.json`.
3. En los nodos de configuración **Maqiatto** (MQTT) y **DriverSafe MongoDB** ingresa usuario y contraseña
   (Node-RED no exporta credenciales).
4. **Deploy**.

- Dashboard: http://localhost:1880/dashboard/page1
- API: http://localhost:1880/api/driversafe/…

Los tópicos MQTT del flujo usan el prefijo `<MQTT_USER>/tp01/`. Si usas otra cuenta de Maqiatto, actualízalos en
los nodos *Maqiatto* (entrada), *Estado* y *Validación de movimiento*.

### 3. Simulador

```bash
cd simulator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python sensor_simulator.py
```

### 4. Aplicación web

```bash
cd web
npm install
npm run dev
```

Abre http://localhost:5173 e inicia sesión con **supervisor / admin**.
En desarrollo, Vite redirige las peticiones `/api` a Node-RED (`VITE_NODE_RED_URL`), así que no hace falta configurar CORS.

## API REST (Node-RED)

Base: `http://localhost:1880/api/driversafe`. Todas las rutas, salvo `/login` y `/sesion`, requieren
`Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | `{ usuario, clave }` → `{ token }` |
| GET | `/sesion` | Usuario de la sesión actual |
| DELETE | `/sesion` | Cierra la sesión |
| GET | `/flota` | Estado en vivo de cada conductor y resumen de alertas |
| GET | `/series?minutos=&conductor=` | FC y SpO₂ promediados por intervalo |
| GET | `/alertas?activa=&tipo=&conductor=&desde=&hasta=&limit=` | Alertas |
| PUT | `/alertas/:id/revisar` | Marca una alerta como revisada |
| GET | `/analitica` | Resultados del análisis de 7 días |
| GET | `/configuracion` | Umbrales por conductor y parámetros del sistema |
| PUT | `/configuracion/:id` | Actualiza los umbrales de un conductor |
| POST | `/conductores` | Registra un conductor `{ id_conductor, nombre, vehiculo }` |

**Postman:** importa `node-red/DriverSafe.postman_collection.json` y ejecuta primero *Iniciar sesión*; el token
queda guardado en la variable de la colección y lo usan las demás peticiones.

## Funcionamiento

**Clasificación (nodo *Estado*):** con los umbrales por defecto, una lectura es crítica si FC ≤ 60 lpm o SpO₂ ≤ 80 %.
Tres lecturas críticas seguidas generan una alerta crítica (LED rojo); una lectura crítica aislada, SpO₂ entre 85 y 89 %
o una caída de FC de más de 5 lpm respecto al promedio reciente generan prealerta (LED amarillo).
Si el acelerómetro detecta movimiento en los últimos 10 s, la SpO₂ se descarta.

**Umbrales por conductor:** se guardan en `configuracion_conductor` y se editan desde la pantalla *Configuración*.
Node-RED los recarga cada 15 s; si un conductor no tiene configuración válida se usan los valores por defecto.

**Análisis:** los inject *Ejecutar limpieza* y *Ejecutar análisis* generan `datos_limpios` y los resúmenes de los
últimos 7 días que muestra *Historial & Analítica*.

### Colecciones de MongoDB

| Colección | Contenido |
|---|---|
| `conductores` | Registro de conductores (nombre, vehículo) |
| `configuracion_conductor` | Umbrales por conductor |
| `mediciones` | Lecturas de FC y SpO₂ |
| `eventos_movimiento` | Eventos del acelerómetro |
| `estados` | Estado calculado por lectura y comando enviado al LED |
| `alertas` | Prealertas y alertas críticas, con inicio y fin |
| `datos_limpios` | Lecturas validadas y sin duplicados |
| `analisis_*` | Resúmenes de los últimos 7 días |
