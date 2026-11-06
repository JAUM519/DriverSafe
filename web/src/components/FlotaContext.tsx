import { createContext, useContext, type ReactNode } from "react";
import { useApi } from "../api/cliente";
import type { Flota } from "../api/tipos";

type Valor = ReturnType<typeof useApi<Flota>>;
const Ctx = createContext<Valor | null>(null);

export function FlotaProvider({ children }: { children: ReactNode }) {
  const flota = useApi<Flota>("/flota", 3000);
  return <Ctx.Provider value={flota}>{children}</Ctx.Provider>;
}

export function useFlota() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFlota fuera de FlotaProvider");
  return v;
}
