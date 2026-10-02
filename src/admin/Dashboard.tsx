import { useEffect, useState } from "react";
import { supabase, fechaCorta, pesos, type Cotizacion } from "./supabase";
import { EstadoChip } from "./Cotizaciones";
import type { Seccion } from "./AdminApp";

/*
 * RESUMEN. Etapa 1: lo que hay que atender en cotizaciones. Trabajos en curso,
 * pagos pendientes y mantenciones de la semana se suman cuando existan esos
 * módulos (etapas 2 y 3): se muestran vacíos y rotulados en vez de inventar.
 */
export function Dashboard({ ir }: { ir: (s: Seccion) => void }) {
  const [cots, setCots] = useState<Cotizacion[] | null>(null);

  useEffect(() => {
    supabase.from("cotizaciones").select("*").order("creada", { ascending: false }).then(({ data }) => setCots((data ?? []) as Cotizacion[]));
  }, []);

  const nuevas = (cots ?? []).filter((c) => c.estado === "nueva");
  const cotizadas = (cots ?? []).filter((c) => c.estado === "cotizada");
  const hace30 = Date.now() - 30 * 86400000;
  const aceptadasMes = (cots ?? []).filter((c) => c.estado === "aceptada" && new Date(c.actualizada).getTime() > hace30);
  const montoEnJuego = cotizadas.reduce((t, c) => t + (c.monto_cotizado || 0), 0);

  const Tarjeta = ({ titulo, valor, detalle, alerta, onClick }: { titulo: string; valor: string; detalle?: string; alerta?: boolean; onClick?: () => void }) => (
    <button onClick={onClick} disabled={!onClick} className={`text-left rounded-xl border bg-white p-4 ${alerta ? "border-amber-300" : "border-stone-200"} ${onClick ? "hover:shadow-sm" : "cursor-default"}`}>
      <div className="text-xs uppercase tracking-wide text-stone-500">{titulo}</div>
      <div className={`text-2xl font-semibold mt-1 ${alerta ? "text-amber-700" : ""}`}>{valor}</div>
      {detalle && <div className="text-xs text-stone-500 mt-0.5">{detalle}</div>}
    </button>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Resumen</h1>
      <p className="text-sm text-stone-500 mb-5">Lo que hay que atender hoy.</p>

      {cots === null ? <p className="text-sm text-stone-500">Cargando…</p> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Tarjeta titulo="Sin responder" valor={String(nuevas.length)} detalle="cotizaciones nuevas" alerta={nuevas.length > 0} onClick={() => ir("cotizaciones")} />
            <Tarjeta titulo="Esperando respuesta" valor={String(cotizadas.length)} detalle={montoEnJuego ? `${pesos(montoEnJuego)} cotizados` : "cotizadas"} onClick={() => ir("cotizaciones")} />
            <Tarjeta titulo="Aceptadas" valor={String(aceptadasMes.length)} detalle="últimos 30 días" />
            <Tarjeta titulo="Trabajos, pagos y visitas" valor="—" detalle="llegan con Clientes y Mantenciones" />
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-2">Nuevas sin responder</h2>
          {nuevas.length === 0 ? <p className="text-sm text-stone-500">Ninguna pendiente. 🌱</p> : (
            <div className="space-y-2">
              {nuevas.slice(0, 8).map((c) => (
                <button key={c.id} onClick={() => ir("cotizaciones")} className="w-full text-left rounded-xl border border-stone-200 bg-white p-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.nombre}</span>
                  <EstadoChip estado={c.estado} />
                  <span className="text-sm text-stone-600">{c.servicio || "Sin servicio indicado"}</span>
                  <span className="text-xs text-stone-500 ml-auto">{fechaCorta(c.fecha_contacto)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
