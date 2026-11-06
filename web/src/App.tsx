import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { api, onNoAutorizado, sesion } from "./api/cliente";
import { FlotaProvider } from "./components/FlotaContext";
import { Layout } from "./components/Layout";
import { Aviso } from "./components/ui";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Conductor } from "./pages/Conductor";
import { Alertas } from "./pages/Alertas";
import { Historial } from "./pages/Historial";
import { Configuracion } from "./pages/Configuracion";
import { PanelVehiculo } from "./pages/PanelVehiculo";

type Auth = { estado: "cargando" } | { estado: "error"; mensaje: string } | { estado: "ok"; usuario: string | null };

export default function App() {
  const [auth, setAuth] = useState<Auth>({ estado: "cargando" });

  const comprobar = () =>
    api<{ usuario: string | null }>("/auth")
      .then((r) => setAuth({ estado: "ok", usuario: r.usuario }))
      .catch((e) => setAuth({ estado: "error", mensaje: e.message }));

  useEffect(() => {
    comprobar();
    onNoAutorizado(() => {
      sesion.cerrar();
      setAuth((a) => (a.estado === "ok" ? { ...a, usuario: null } : a));
    });
  }, []);

  if (auth.estado === "cargando") return null;
  if (auth.estado === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-3">
          <Aviso tono="error">No se pudo contactar la API de DriverSafe ({auth.mensaje}). ¿Está corriendo el servidor (<code>npm run dev</code>)?</Aviso>
          <button className="text-sm text-blue-600 font-medium" onClick={comprobar}>Reintentar</button>
        </div>
      </div>
    );
  }
  if (!auth.usuario) return <Login onLogin={(usuario) => setAuth({ estado: "ok", usuario })} />;

  const salir = () => {
    sesion.cerrar();
    setAuth({ estado: "ok", usuario: null });
  };

  return (
    <BrowserRouter>
      <FlotaProvider>
        <Layout usuario={auth.usuario} onSalir={salir}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/conductores/:id?" element={<Conductor />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/panel/:id?" element={<PanelVehiculo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FlotaProvider>
    </BrowserRouter>
  );
}
