import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Pagina, Topbar } from "../components/Layout";
import { Boton, Card } from "../components/ui";

const DASHBOARD_URL = `${import.meta.env.VITE_NODE_RED_URL ?? "http://localhost:1880"}/dashboard/page1`;

export function TiempoRealNodeRed() {
  const [version, setVersion] = useState(0);

  return (
    <>
      <Topbar titulo="Tiempo real (Node-RED)" subtitulo="Dashboard de Node-RED embebido" />
      <Pagina>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            Medidores y gráficas que Node-RED actualiza con cada lectura MQTT · <code className="text-xs">{DASHBOARD_URL}</code>
          </p>
          <div className="flex gap-2">
            <Boton icono={RefreshCw} onClick={() => setVersion((v) => v + 1)}>Recargar</Boton>
            <a href={DASHBOARD_URL} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg text-gray-600 border border-border bg-white hover:bg-gray-50 px-3 py-1.5">
              <ExternalLink size={14} />Abrir aparte
            </a>
          </div>
        </div>
        <Card className="overflow-hidden">
          <iframe
            key={version}
            id="dashboardFrame"
            src={DASHBOARD_URL}
            title="Dashboard de Node-RED"
            width="100%"
            height="900"
            className="block w-full border-0"
          />
        </Card>
      </Pagina>
    </>
  );
}
