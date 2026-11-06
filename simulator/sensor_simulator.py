import json
import os
import random
import threading
from datetime import datetime, timezone
from pathlib import Path
import tkinter as tk
from tkinter import ttk

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

ID_CONDUCTOR = os.getenv("DRIVER_ID", "BUS04-COND04")

MQTT_BROKER = os.getenv("MQTT_BROKER", "maqiatto.com")
MQTT_PUERTO = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USUARIO = os.getenv("MQTT_USER", "")
MQTT_CONTRASENA = os.getenv("MQTT_PASSWORD", "")

MQTT_TOPICO_PUBLICAR = f"{MQTT_USUARIO}/tp01/datos"
MQTT_TOPICO_SUSCRIBIRSE = f"{MQTT_USUARIO}/tp01/command/{ID_CONDUCTOR}"

FC_MIN, FC_MAX = 60.0, 100.0
SPO2_MIN, SPO2_MAX = 90.0, 100.0

PROB_MOVIMIENTO = 0.03

INTERVALO_NORMAL = 1
INTERVALO_FATIGA = 1
INTERVALO_ACELEROMETRO = 1

lock_print = threading.Lock()

detener = None

simulacion_activa = False


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        with lock_print:
            print(f"[MQTT] Conectado a {MQTT_BROKER}:{MQTT_PUERTO}")

        topico_comando = userdata["topico_comando"]
        client.subscribe(topico_comando)
        with lock_print:
            print(f"[MQTT] Suscrito a: {topico_comando}")
    else:
        with lock_print:
            print(f"[MQTT] Error de conexión, código: {reason_code}")


def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8", errors="replace")
    with lock_print:
        print(f"\n>>> COMANDO recibido en '{msg.topic}': {payload}\n")
    ventana.after(0, actualizar_accion, payload)


cliente_mqtt = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    userdata={"topico_comando": MQTT_TOPICO_SUSCRIBIRSE},
)
cliente_mqtt.username_pw_set(MQTT_USUARIO, MQTT_CONTRASENA)
cliente_mqtt.on_connect = on_connect
cliente_mqtt.on_message = on_message


def conectar_mqtt():
    if not MQTT_BROKER:
        with lock_print:
            print("[MQTT] MQTT_BROKER no está configurado; no se conectará al bróker.")
        return

    try:
        cliente_mqtt.connect(MQTT_BROKER, MQTT_PUERTO, keepalive=60)
        cliente_mqtt.loop_start()
    except Exception as error:
        with lock_print:
            print(f"[MQTT] No se pudo conectar al bróker: {error}")


def generar_lectura(id_conductor: str, marca_tiempo: str) -> dict:
    return {
        "id_conductor": id_conductor,
        "marca_tiempo": marca_tiempo,
        "frecuencia_cardiaca": round(random.uniform(FC_MIN, FC_MAX), 1),
        "spo2": round(random.uniform(SPO2_MIN, SPO2_MAX), 1),
    }


def generar_evento_movimiento(id_conductor: str) -> dict:
    return {
        "id_conductor": id_conductor,
        "marca_tiempo": datetime.now(timezone.utc).isoformat(),
        "movimiento": 1,
    }


def hilo_fc_spo2(id_conductor: str, detener_evento: threading.Event):
    fc_anterior = None

    while not detener_evento.is_set():

        marca_tiempo = datetime.now(timezone.utc).isoformat()

        lectura = generar_lectura(
            id_conductor,
            marca_tiempo
        )

        mensaje = json.dumps(lectura, ensure_ascii=False)

        with lock_print:
            print(mensaje)

        if MQTT_TOPICO_PUBLICAR:
            cliente_mqtt.publish(MQTT_TOPICO_PUBLICAR, mensaje)

        fc_actual = lectura["frecuencia_cardiaca"]
        spo2_actual = lectura["spo2"]

        ventana.after(
            0,
            actualizar_signos,
            fc_actual,
            spo2_actual
        )

        if fc_anterior is not None and (fc_anterior - fc_actual) >= 5:
            intervalo = INTERVALO_FATIGA
        else:
            intervalo = INTERVALO_NORMAL

        fc_anterior = fc_actual

        detener_evento.wait(intervalo)


def hilo_acelerometro(id_conductor: str, detener_evento: threading.Event):
    while not detener_evento.is_set():

        movimiento = 1 if random.random() < PROB_MOVIMIENTO else 0

        if movimiento == 1:

            evento_movimiento = generar_evento_movimiento(
                id_conductor
            )

            mensaje_movimiento = json.dumps(
                evento_movimiento,
                ensure_ascii=False
            )

            with lock_print:
                print(mensaje_movimiento)

            if MQTT_TOPICO_PUBLICAR:
                cliente_mqtt.publish(MQTT_TOPICO_PUBLICAR, mensaje_movimiento)

            ventana.after(
                0,
                actualizar_movimiento,
                True
            )

            ventana.after(
                2000,
                actualizar_movimiento,
                False
            )

        detener_evento.wait(INTERVALO_ACELEROMETRO)


def actualizar_signos(fc, spo2):
    label_fc_valor.config(
        text=f"{fc:.1f} bpm"
    )

    label_spo2_valor.config(
        text=f"{spo2:.1f} %"
    )


def actualizar_movimiento(detectado):
    if detectado:
        label_movimiento_valor.config(
            text="Movimiento detectado"
        )
    else:
        label_movimiento_valor.config(
            text="Sin movimiento"
        )


def actualizar_accion(accion):
    accion_limpia = accion.strip()
    accion_minuscula = accion_limpia.lower()

    label_accion_valor.config(
        text=accion_limpia
    )

    canvas_leds.itemconfig(led_verde, fill="#bdbdbd")
    canvas_leds.itemconfig(led_amarillo, fill="#bdbdbd")
    canvas_leds.itemconfig(led_rojo, fill="#bdbdbd")

    if accion_minuscula in ("prender led verde", "n"):
        label_estado_node_red_valor.config(
            text="NORMAL"
        )
        canvas_leds.itemconfig(
            led_verde,
            fill="#20c55a"
        )

    elif accion_minuscula in ("prender led amarillo", "y"):
        label_estado_node_red_valor.config(
            text="PRE-ALERTA"
        )
        canvas_leds.itemconfig(
            led_amarillo,
            fill="#ffd43b"
        )

    elif accion_minuscula in ("prender led rojo", "r"):
        label_estado_node_red_valor.config(
            text="ALERTA CRÍTICA"
        )
        canvas_leds.itemconfig(
            led_rojo,
            fill="#ff3b30"
        )

    else:
        label_estado_node_red_valor.config(
            text="COMANDO DESCONOCIDO"
        )


def configurar_tipo():
    global FC_MIN, FC_MAX
    global SPO2_MIN, SPO2_MAX

    tipo = tipo_var.get()

    if tipo == "normal":

        FC_MIN, FC_MAX = 60.0, 100.0
        SPO2_MIN, SPO2_MAX = 90.0, 100.0

    elif tipo == "pre-alerta":

        FC_MIN, FC_MAX = 60.0, 100.0
        SPO2_MIN, SPO2_MAX = 85.0, 89.0

    elif tipo == "alerta":

        FC_MIN, FC_MAX = 40.0, 60.0
        SPO2_MIN, SPO2_MAX = 60.0, 80.0


def iniciar_simulacion():
    global detener
    global simulacion_activa

    if simulacion_activa:
        return

    id_conductor = ID_CONDUCTOR

    configurar_tipo()

    tipo = tipo_var.get()

    detener = threading.Event()

    simulacion_activa = True

    label_estado_valor.config(
        text="Simulación activa"
    )

    label_tipo_actual.config(
        text=f"Modo actual: {tipo.upper()}"
    )

    boton_iniciar.config(
        state="disabled"
    )

    boton_detener.config(
        state="normal"
    )

    hilo1 = threading.Thread(
        target=hilo_fc_spo2,
        args=(id_conductor, detener),
        daemon=True
    )

    hilo2 = threading.Thread(
        target=hilo_acelerometro,
        args=(id_conductor, detener),
        daemon=True
    )

    hilo1.start()
    hilo2.start()

    print()
    print("===================================")
    print("SIMULACIÓN INICIADA")
    print(f"Conductor: {id_conductor}")
    print(f"Modo: {tipo}")
    print("===================================")
    print()


def detener_simulacion():
    global simulacion_activa

    if not simulacion_activa:
        return

    if detener is not None:
        detener.set()

    simulacion_activa = False

    label_estado_valor.config(
        text="Simulación detenida"
    )

    label_tipo_actual.config(
        text="Modo actual: ---"
    )

    boton_iniciar.config(
        state="normal"
    )

    boton_detener.config(
        state="disabled"
    )

    label_movimiento_valor.config(
        text="Sin movimiento"
    )

    label_accion_valor.config(
        text="Sin comando"
    )

    label_estado_node_red_valor.config(
        text="SIN ESTADO"
    )

    canvas_leds.itemconfig(
        led_verde,
        fill="#bdbdbd"
    )

    canvas_leds.itemconfig(
        led_amarillo,
        fill="#bdbdbd"
    )

    canvas_leds.itemconfig(
        led_rojo,
        fill="#bdbdbd"
    )

    print()
    print("Simulación detenida.")
    print()


def cerrar_programa():
    global simulacion_activa

    if simulacion_activa and detener is not None:
        detener.set()

    cliente_mqtt.loop_stop()
    cliente_mqtt.disconnect()

    ventana.destroy()


ventana = tk.Tk()

ventana.title("Simulador de sensores")

ventana.geometry("520x850")

ventana.resizable(
    True,
    True
)

contenedor_principal = ttk.Frame(
    ventana
)

contenedor_principal.pack(
    fill="both",
    expand=True
)

canvas_principal = tk.Canvas(
    contenedor_principal,
    highlightthickness=0
)

scroll_vertical = ttk.Scrollbar(
    contenedor_principal,
    orient="vertical",
    command=canvas_principal.yview
)

frame_scroll = ttk.Frame(
    canvas_principal
)

frame_scroll.bind(
    "<Configure>",
    lambda evento: canvas_principal.configure(
        scrollregion=canvas_principal.bbox("all")
    )
)

ventana_canvas = canvas_principal.create_window(
    (0, 0),
    window=frame_scroll,
    anchor="nw"
)

def ajustar_ancho_scroll(evento):
    canvas_principal.itemconfig(
        ventana_canvas,
        width=evento.width
    )

canvas_principal.bind(
    "<Configure>",
    ajustar_ancho_scroll
)

canvas_principal.configure(
    yscrollcommand=scroll_vertical.set
)

canvas_principal.pack(
    side="left",
    fill="both",
    expand=True
)

scroll_vertical.pack(
    side="right",
    fill="y"
)

def desplazar_rueda(evento):
    canvas_principal.yview_scroll(
        int(-1 * (evento.delta / 120)),
        "units"
    )

canvas_principal.bind_all(
    "<MouseWheel>",
    desplazar_rueda
)

ventana.protocol(
    "WM_DELETE_WINDOW",
    cerrar_programa
)

titulo = ttk.Label(
    frame_scroll,
    text="SIMULADOR DE SENSORES",
    font=("Arial", 18, "bold")
)

titulo.pack(
    pady=(20, 5)
)

subtitulo = ttk.Label(
    frame_scroll,
    text="Monitoreo de conductor"
)

subtitulo.pack(
    pady=(0, 20)
)

frame_id = ttk.Frame(
    ventana
)

frame_id.pack(
    pady=10
)

label_id = ttk.Label(
    frame_id,
    text="ID del conductor:"
)

label_id.grid(
    row=0,
    column=0,
    padx=10
)

entrada_id = ttk.Entry(
    frame_id,
    width=25,
    state="readonly"
)

entrada_id.config(
    state="normal"
)

entrada_id.insert(
    0,
    ID_CONDUCTOR
)

entrada_id.config(
    state="readonly"
)

entrada_id.grid(
    row=0,
    column=1,
    padx=10
)

frame_tipo = ttk.LabelFrame(
    frame_scroll,
    text="Tipo de simulación",
    padding=15
)

frame_tipo.pack(
    padx=30,
    pady=15,
    fill="x"
)

tipo_var = tk.StringVar(
    value="normal"
)

radio_normal = ttk.Radiobutton(
    frame_tipo,
    text="Normal",
    variable=tipo_var,
    value="normal"
)

radio_normal.pack(
    anchor="w",
    pady=4
)

radio_prealerta = ttk.Radiobutton(
    frame_tipo,
    text="Pre-alerta",
    variable=tipo_var,
    value="pre-alerta"
)

radio_prealerta.pack(
    anchor="w",
    pady=4
)

radio_alerta = ttk.Radiobutton(
    frame_tipo,
    text="Alerta",
    variable=tipo_var,
    value="alerta"
)

radio_alerta.pack(
    anchor="w",
    pady=4
)

frame_botones = ttk.Frame(
    ventana
)

frame_botones.pack(
    pady=15
)

boton_iniciar = ttk.Button(
    frame_botones,
    text="Iniciar simulación",
    command=iniciar_simulacion
)

boton_iniciar.grid(
    row=0,
    column=0,
    padx=10
)

boton_detener = ttk.Button(
    frame_botones,
    text="Detener simulación",
    command=detener_simulacion,
    state="disabled"
)

boton_detener.grid(
    row=0,
    column=1,
    padx=10
)

frame_datos = ttk.LabelFrame(
    frame_scroll,
    text="Datos actuales",
    padding=15
)

frame_datos.pack(
    padx=30,
    pady=10,
    fill="x"
)

label_fc = ttk.Label(
    frame_datos,
    text="Frecuencia cardiaca:"
)

label_fc.grid(
    row=0,
    column=0,
    sticky="w",
    pady=5
)

label_fc_valor = ttk.Label(
    frame_datos,
    text="--- bpm",
    font=("Arial", 11, "bold")
)

label_fc_valor.grid(
    row=0,
    column=1,
    padx=20
)

label_spo2 = ttk.Label(
    frame_datos,
    text="SpO₂:"
)

label_spo2.grid(
    row=1,
    column=0,
    sticky="w",
    pady=5
)

label_spo2_valor = ttk.Label(
    frame_datos,
    text="--- %",
    font=("Arial", 11, "bold")
)

label_spo2_valor.grid(
    row=1,
    column=1,
    padx=20
)

label_movimiento = ttk.Label(
    frame_datos,
    text="Acelerómetro:"
)

label_movimiento.grid(
    row=2,
    column=0,
    sticky="w",
    pady=5
)

label_movimiento_valor = ttk.Label(
    frame_datos,
    text="Sin movimiento",
    font=("Arial", 11, "bold")
)

label_movimiento_valor.grid(
    row=2,
    column=1,
    padx=20
)

label_accion = ttk.Label(
    frame_datos,
    text="Acción Node-RED:"
)

label_accion.grid(
    row=3,
    column=0,
    sticky="w",
    pady=5
)

label_accion_valor = ttk.Label(
    frame_datos,
    text="Sin comando",
    font=("Arial", 11, "bold")
)

label_accion_valor.grid(
    row=3,
    column=1,
    padx=20
)

frame_estado_node_red = ttk.LabelFrame(
    frame_scroll,
    text="Estado recibido desde Node-RED",
    padding=15
)

frame_estado_node_red.pack(
    padx=30,
    pady=10,
    fill="x"
)

label_estado_node_red_valor = ttk.Label(
    frame_estado_node_red,
    text="SIN ESTADO",
    font=("Arial", 14, "bold")
)

label_estado_node_red_valor.pack(
    pady=(0, 10)
)

canvas_leds = tk.Canvas(
    frame_estado_node_red,
    width=330,
    height=110,
    highlightthickness=0
)

canvas_leds.pack()

led_verde = canvas_leds.create_oval(
    25,
    10,
    95,
    80,
    fill="#bdbdbd",
    outline="#555555",
    width=2
)

led_amarillo = canvas_leds.create_oval(
    130,
    10,
    200,
    80,
    fill="#bdbdbd",
    outline="#555555",
    width=2
)

led_rojo = canvas_leds.create_oval(
    235,
    10,
    305,
    80,
    fill="#bdbdbd",
    outline="#555555",
    width=2
)

canvas_leds.create_text(
    60,
    98,
    text="Verde"
)

canvas_leds.create_text(
    165,
    98,
    text="Amarillo"
)

canvas_leds.create_text(
    270,
    98,
    text="Rojo"
)

label_tipo_actual = ttk.Label(
    frame_scroll,
    text="Modo actual: ---",
    font=("Arial", 10, "bold")
)

label_tipo_actual.pack(
    pady=(10, 3)
)

label_estado_valor = ttk.Label(
    frame_scroll,
    text="Listo para iniciar"
)

label_estado_valor.pack(
    pady=3
)

conectar_mqtt()

ventana.mainloop()