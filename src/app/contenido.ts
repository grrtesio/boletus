import { useEffect, useState } from "react";

/*
 * CONTENIDO EDITABLE DEL SITIO (2-oct-2026): portafolio, equipo y la foto de
 * cabecera de «Quiénes somos». Lo editan Benjamín y Mauricio en /admin y se lee
 * acá de la base, con `fetch` a la API REST (sin la librería de Supabase, para
 * no engordar el sitio público).
 *
 * Si la base no contesta, se muestra lo que había en el código (`respaldo`): el
 * sitio nunca queda en blanco por esto.
 */

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const CLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

async function leer<T>(ruta: string): Promise<T> {
  if (!URL_BASE || !CLAVE) throw new Error("sin base");
  const r = await fetch(`${URL_BASE}/rest/v1/${ruta}`, { headers: { apikey: CLAVE, Accept: "application/json" } });
  if (!r.ok) throw new Error(`base ${r.status}`);
  return (await r.json()) as T;
}

/** Forma que usa la tarjeta del portafolio (la misma que tenía en el código). */
export interface ItemPortafolio {
  id: string | number;
  categoria: "pasto" | "paisajismo" | "huertas" | "poda";
  titulo: string;
  desc: string;
  before?: string;
  after?: string;
  fotos?: string[];
  enInicio?: boolean;
}

interface FilaPortafolio {
  id: string; titulo: string; descripcion: string | null; comuna: string | null;
  categoria: ItemPortafolio["categoria"]; tipo: "antes_despues" | "galeria";
  antes: string | null; despues: string | null; galeria: string[]; en_inicio: boolean;
}

const aItem = (f: FilaPortafolio): ItemPortafolio => ({
  id: f.id,
  categoria: f.categoria,
  titulo: f.comuna && !f.titulo.includes(f.comuna) ? `${f.titulo} — ${f.comuna}` : f.titulo,
  desc: f.descripcion || "",
  ...(f.tipo === "galeria" ? { fotos: f.galeria } : { before: f.antes || "", after: f.despues || "" }),
  enInicio: f.en_inicio,
});

/** Proyectos publicados, en orden. `null` mientras carga. */
export function usePortafolio(respaldo: ItemPortafolio[]): ItemPortafolio[] | null {
  const [items, setItems] = useState<ItemPortafolio[] | null>(null);
  useEffect(() => {
    let vivo = true;
    leer<FilaPortafolio[]>("portafolio?select=*&publicado=eq.true&order=orden.asc,creado.asc")
      .then((filas) => { if (vivo) setItems(filas.map(aItem).filter((i) => (i.fotos ? i.fotos.length > 0 : i.before || i.after))); })
      .catch(() => { if (vivo) setItems(respaldo); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return items;
}

export interface Persona { id: string; nombre: string; cargo: string | null; bio: string | null; foto: string | null }

export function useEquipo(respaldo: Persona[]): Persona[] | null {
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  useEffect(() => {
    let vivo = true;
    leer<Persona[]>("equipo?select=id,nombre,cargo,bio,foto&visible=eq.true&order=orden.asc")
      .then((p) => { if (vivo) setPersonas(p); })
      .catch(() => { if (vivo) setPersonas(respaldo); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return personas;
}

export function useAjuste(clave: string, respaldo: string): string | null {
  const [valor, setValor] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    leer<{ valor: string | null }[]>(`ajustes?select=valor&clave=eq.${encodeURIComponent(clave)}`)
      .then((f) => { if (vivo) setValor(f[0]?.valor || respaldo); })
      .catch(() => { if (vivo) setValor(respaldo); });
    return () => { vivo = false; };
  }, [clave, respaldo]);
  return valor;
}
