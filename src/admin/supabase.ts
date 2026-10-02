import { createClient } from "@supabase/supabase-js";

/*
 * Cliente de Supabase del panel. La URL y la clave pública (anon) van en el
 * build (VITE_*): son públicas por diseño. Lo que protege los datos son las
 * reglas de la base (RLS): solo una sesión de un correo de `admins` puede leer
 * o escribir.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configurado = Boolean(url && anon);
export const supabase = createClient(url || "http://localhost", anon || "falta", {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "boletus-admin" },
});

export type EstadoCotizacion = "nueva" | "cotizada" | "aceptada" | "rechazada" | "sin_respuesta";
export type OrigenCotizacion = "web" | "whatsapp" | "llamada" | "otro" | "manual";

export interface Cotizacion {
  id: string;
  creada: string;
  actualizada: string;
  origen: OrigenCotizacion;
  nombre: string;
  telefono: string | null;
  email: string | null;
  comuna: string | null;
  servicio: string | null;
  mensaje: string | null;
  fecha_contacto: string;
  estado: EstadoCotizacion;
  monto_cotizado: number | null;
  notas: string | null;
}

export const ESTADOS: { id: EstadoCotizacion; label: string; color: string }[] = [
  { id: "nueva", label: "Nueva", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "cotizada", label: "Cotizada", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { id: "aceptada", label: "Aceptada", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "rechazada", label: "Rechazada", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "sin_respuesta", label: "Sin respuesta", color: "bg-stone-200 text-stone-700 border-stone-300" },
];

export const ORIGENES: { id: OrigenCotizacion; label: string }[] = [
  { id: "web", label: "Formulario web" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "llamada", label: "Llamada" },
  { id: "otro", label: "Otro" },
];

/* Los mismos nombres que usa el formulario de /contacto. */
export const SERVICIOS = ["Paisajismo y Diseño", "Instalaciones Agroecológicas", "Poda Especializada", "Instalación de Pasto", "Mantención Recurrente", "Asesoría Técnica"];

export const pesos = (n: number | null | undefined) => (n == null ? "—" : `$${Math.round(n).toLocaleString("es-CL")}`);
export const fechaCorta = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const waLink = (tel: string | null | undefined) => {
  const n = String(tel || "").replace(/[^0-9]/g, "");
  return n ? `https://wa.me/${n.startsWith("56") ? n : `56${n.replace(/^0+/, "")}`}` : null;
};
