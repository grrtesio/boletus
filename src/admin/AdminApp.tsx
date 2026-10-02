import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, ClipboardList, Users, CalendarDays, Images, LogOut } from "lucide-react";
import { configurado, supabase } from "./supabase";
import { Ingreso } from "./Ingreso";
import { Dashboard } from "./Dashboard";
import { Cotizaciones } from "./Cotizaciones";

/*
 * PANEL DE ADMINISTRACIÓN DE BOLETUS (/admin).
 *
 * Etapa 1 (2-oct-2026): acceso, cotizaciones y dashboard. Clientes, mantenciones
 * y portafolio vienen en las etapas siguientes; se muestran en el menú como
 * «pronto» para que se vea hacia dónde va.
 *
 * Acceso: código por correo, y la sesión además tiene que ser de un correo de la
 * tabla `admins` (es_admin()). Si no lo es, se cierra y se avisa.
 */

export type Seccion = "dashboard" | "cotizaciones" | "clientes" | "mantenciones" | "portafolio";

const MENU: { id: Seccion; label: string; icono: React.ElementType; pronto?: boolean }[] = [
  { id: "dashboard", label: "Resumen", icono: BarChart3 },
  { id: "cotizaciones", label: "Cotizaciones", icono: ClipboardList },
  { id: "clientes", label: "Clientes", icono: Users, pronto: true },
  { id: "mantenciones", label: "Mantenciones", icono: CalendarDays, pronto: true },
  { id: "portafolio", label: "Portafolio", icono: Images, pronto: true },
];

export function AdminApp() {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [seccion, setSeccion] = useState<Seccion>("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Con sesión, se confirma en la base que el correo es de un administrador.
  useEffect(() => {
    if (!sesion) { setEsAdmin(null); return; }
    let vivo = true;
    supabase.rpc("es_admin").then(({ data, error }) => {
      if (!vivo) return;
      if (error || data !== true) { setEsAdmin(false); void supabase.auth.signOut(); }
      else setEsAdmin(true);
    });
    return () => { vivo = false; };
  }, [sesion]);

  const marco = "min-h-screen bg-[#f7f4ee] text-[#1a2818]";
  const fuente = { fontFamily: "'DM Sans', sans-serif" };

  if (!configurado) {
    return <div className={`${marco} flex items-center justify-center p-6`} style={fuente}>
      <p className="max-w-md text-center text-sm text-stone-600">El panel todavía no está conectado a su base de datos (faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</p>
    </div>;
  }
  if (sesion === undefined || (sesion && esAdmin === null)) {
    return <div className={`${marco} flex items-center justify-center`} style={fuente}><p className="text-sm text-stone-500">Cargando…</p></div>;
  }
  if (!sesion || !esAdmin) return <Ingreso sinPermiso={esAdmin === false} />;

  return (
    <div className={`${marco} md:flex`} style={fuente}>
      <aside className="md:w-56 md:min-h-screen bg-[#1a5a4a] text-[#f7f4ee] flex md:flex-col">
        <div className="hidden md:flex items-center gap-2 px-5 py-5">
          <img src="/logo-boletus-dark.svg" alt="Boletus" className="h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible px-2 md:px-3 py-2 gap-1">
          {MENU.map((m) => {
            const activo = seccion === m.id;
            const Icono = m.icono;
            return (
              <button key={m.id} disabled={m.pronto} onClick={() => setSeccion(m.id)}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  activo ? "bg-[#f7f4ee] text-[#1a5a4a] font-semibold" : m.pronto ? "opacity-45 cursor-not-allowed" : "hover:bg-white/10"}`}>
                <Icono className="w-4 h-4" />
                {m.label}
                {m.pronto && <span className="text-[10px] uppercase tracking-wide opacity-80">pronto</span>}
              </button>
            );
          })}
        </nav>
        <div className="hidden md:block px-4 py-4 border-t border-white/15 text-xs">
          <div className="opacity-80 truncate">{sesion.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} className="mt-2 inline-flex items-center gap-1.5 opacity-90 hover:opacity-100">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        {seccion === "dashboard" && <Dashboard ir={setSeccion} />}
        {seccion === "cotizaciones" && <Cotizaciones />}
        <button onClick={() => supabase.auth.signOut()} className="md:hidden mt-8 text-sm text-stone-500 underline">Salir</button>
      </main>
    </div>
  );
}
