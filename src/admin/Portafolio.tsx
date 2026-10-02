import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Home, Plus, X } from "lucide-react";
import { supabase } from "./supabase";
import { CampoFoto } from "./CampoFoto";
import { borrarFoto, esDeBanco } from "./fotos";

/*
 * PORTAFOLIO (lo que se ve en boletus.cl/portafolio y los dos de la portada).
 * Cada proyecto es un ANTES/DESPUÉS (una transformación) o una GALERÍA (un
 * trabajo terminado, como una huerta). Lo publicado sale en el sitio al tiro.
 */

type Categoria = "pasto" | "paisajismo" | "huertas" | "poda";
interface Proyecto {
  id: string; titulo: string; descripcion: string | null; comuna: string | null; categoria: Categoria;
  tipo: "antes_despues" | "galeria"; antes: string | null; despues: string | null; galeria: string[];
  orden: number; publicado: boolean; en_inicio: boolean;
}
type Borrador = Omit<Proyecto, "id" | "orden"> & { id?: string; orden?: number };

const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: "pasto", label: "Pasto" }, { id: "paisajismo", label: "Paisajismo" }, { id: "huertas", label: "Huertas" }, { id: "poda", label: "Poda" },
];

const nuevo = (): Borrador => ({ titulo: "", descripcion: "", comuna: "", categoria: "pasto", tipo: "antes_despues", antes: null, despues: null, galeria: [], publicado: true, en_inicio: false });
const portada = (p: Proyecto) => (p.tipo === "galeria" ? p.galeria[0] : p.despues || p.antes) || null;
const fotosDe = (p: Borrador) => (p.tipo === "galeria" ? p.galeria : [p.antes, p.despues]).filter(Boolean) as string[];

export function Portafolio() {
  const [lista, setLista] = useState<Proyecto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Borrador | null>(null);

  const cargar = async () => {
    const { data, error: err } = await supabase.from("portafolio").select("*").order("orden").order("creado");
    if (err) setError("No se pudo leer el portafolio."); else { setError(null); setLista((data ?? []) as Proyecto[]); }
  };
  useEffect(() => { void cargar(); }, []);

  const actualizar = async (p: Proyecto, cambios: Partial<Proyecto>) => {
    setLista((l) => (l ?? []).map((x) => (x.id === p.id ? { ...x, ...cambios } : x)));
    const { error: err } = await supabase.from("portafolio").update(cambios).eq("id", p.id);
    if (err) { setError("No se pudo guardar el cambio."); void cargar(); }
  };

  /* Subir o bajar: se reescribe el orden de todos (1, 2, 3…) para que no queden empates. */
  const mover = async (idx: number, delta: number) => {
    if (!lista) return;
    const j = idx + delta;
    if (j < 0 || j >= lista.length) return;
    const nueva = [...lista];
    [nueva[idx], nueva[j]] = [nueva[j], nueva[idx]];
    setLista(nueva.map((p, n) => ({ ...p, orden: n + 1 })));
    const res = await Promise.all(nueva.map((p, n) => supabase.from("portafolio").update({ orden: n + 1 }).eq("id", p.id)));
    if (res.some((r) => r.error)) { setError("No se pudo cambiar el orden."); void cargar(); }
  };

  const conBanco = (lista ?? []).filter((p) => fotosDe(p).some(esDeBanco)).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Portafolio</h1>
          <p className="text-sm text-stone-500">Lo publicado aparece en boletus.cl/portafolio. Los marcados con la casita salen en la portada.</p>
        </div>
        <button onClick={() => setEditando(nuevo())} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5a4a] px-4 py-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" /> Nuevo proyecto
        </button>
      </div>

      {conBanco > 0 && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {conBanco} {conBanco === 1 ? "proyecto tiene" : "proyectos tienen"} fotos de banco de imágenes (las que venían en el sitio original). Cámbialas por fotos de sus trabajos, o despublica esos proyectos.
        </div>
      )}
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {!lista ? <p className="text-sm text-stone-500">Cargando…</p> : lista.length === 0 ? <p className="text-sm text-stone-500">Todavía no hay proyectos.</p> : (
        <div className="space-y-2">
          {lista.map((p, idx) => (
            <div key={p.id} className={`rounded-xl border bg-white p-3 flex items-center gap-3 ${p.publicado ? "border-stone-200" : "border-dashed border-stone-300 opacity-70"}`}>
              <div className="flex flex-col">
                <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="p-1 text-stone-500 disabled:opacity-30" title="Subir"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => mover(idx, 1)} disabled={idx === lista.length - 1} className="p-1 text-stone-500 disabled:opacity-30" title="Bajar"><ArrowDown className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setEditando({ ...p })} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-20 h-14 rounded-md overflow-hidden bg-stone-100 flex-shrink-0">
                  {portada(p) && <img src={portada(p)!} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.titulo}{p.comuna ? ` — ${p.comuna}` : ""}</div>
                  <div className="text-xs text-stone-500">
                    {CATEGORIAS.find((c) => c.id === p.categoria)?.label} · {p.tipo === "galeria" ? `galería (${p.galeria.length})` : "antes / después"}
                    {fotosDe(p).some(esDeBanco) && <span className="ml-2 text-amber-700 font-medium">fotos de banco</span>}
                  </div>
                </div>
              </button>
              <button onClick={() => actualizar(p, { en_inicio: !p.en_inicio })} title={p.en_inicio ? "Sale en la portada" : "No sale en la portada"}
                className={`rounded-lg border p-2 ${p.en_inicio ? "border-[#1a5a4a] text-[#1a5a4a] bg-[#1a5a4a]/10" : "border-stone-300 text-stone-400"}`}><Home className="w-4 h-4" /></button>
              <button onClick={() => actualizar(p, { publicado: !p.publicado })} title={p.publicado ? "Publicado (clic para ocultar)" : "Oculto (clic para publicar)"}
                className={`rounded-lg border px-2.5 py-2 text-xs font-medium inline-flex items-center gap-1 ${p.publicado ? "border-emerald-300 text-emerald-800 bg-emerald-50" : "border-stone-300 text-stone-500"}`}>
                {p.publicado ? <><Eye className="w-3.5 h-3.5" /> Publicado</> : <><EyeOff className="w-3.5 h-3.5" /> Oculto</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {editando && <FichaProyecto inicial={editando} siguienteOrden={(lista?.length ?? 0) + 1}
        onCerrar={() => setEditando(null)} onListo={() => { setEditando(null); void cargar(); }} />}
    </div>
  );
}

function FichaProyecto({ inicial, siguienteOrden, onCerrar, onListo }: { inicial: Borrador; siguienteOrden: number; onCerrar: () => void; onListo: () => void }) {
  const [f, setF] = useState<Borrador>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setF((x) => ({ ...x, [k]: v }));
  const esNuevo = !f.id;

  /* Al reemplazar o quitar una foto se borra el archivo viejo, pero solo al GUARDAR:
     si se cancela, el proyecto sigue mostrando la de antes. */
  const fotosOriginales = fotosDe(inicial);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titulo.trim()) { setError("Falta el título."); return; }
    if (f.tipo === "antes_despues" && !f.antes && !f.despues) { setError("Sube al menos la foto del después."); return; }
    if (f.tipo === "galeria" && f.galeria.length === 0) { setError("Sube al menos una foto."); return; }
    setGuardando(true); setError(null);
    const fila = {
      titulo: f.titulo.trim(), descripcion: f.descripcion?.trim() || null, comuna: f.comuna?.trim() || null,
      categoria: f.categoria, tipo: f.tipo, publicado: f.publicado, en_inicio: f.en_inicio,
      antes: f.tipo === "antes_despues" ? f.antes : null, despues: f.tipo === "antes_despues" ? f.despues : null,
      galeria: f.tipo === "galeria" ? f.galeria : [],
    };
    const { error: err } = esNuevo
      ? await supabase.from("portafolio").insert({ ...fila, orden: siguienteOrden })
      : await supabase.from("portafolio").update(fila).eq("id", f.id!);
    if (err) { setGuardando(false); setError("No se pudo guardar."); return; }
    const quedan = new Set(fotosDe({ ...f, ...fila } as Borrador));
    await Promise.all(fotosOriginales.filter((u) => !quedan.has(u)).map(borrarFoto));
    setGuardando(false); onListo();
  };

  const borrar = async () => {
    if (!f.id || !window.confirm(`¿Borrar «${f.titulo}» del portafolio? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from("portafolio").delete().eq("id", f.id);
    if (err) { setError("No se pudo borrar."); return; }
    await Promise.all(fotosOriginales.map(borrarFoto));
    onListo();
  };

  const campo = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
  const rotulo = "block text-xs font-medium text-stone-600 mb-1";
  const chip = (activo: boolean) => `rounded-full border px-3 py-1 text-sm ${activo ? "bg-[#1a5a4a] text-white border-[#1a5a4a]" : "bg-white border-stone-300 text-stone-700"}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center md:p-6" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <form onSubmit={guardar} className="w-full md:max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-[#f7f4ee] p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{esNuevo ? "Nuevo proyecto" : "Editar proyecto"}</h2>
          <button type="button" onClick={onCerrar} className="p-1 text-stone-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className={rotulo}>Título</label>
            <input className={campo} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej. Jardín de casa particular" autoFocus={esNuevo} /></div>
          <div><label className={rotulo}>Comuna</label><input className={campo} value={f.comuna ?? ""} onChange={(e) => set("comuna", e.target.value)} placeholder="Ej. Villa Alemana" /></div>
          <div><label className={rotulo}>Categoría</label>
            <div className="flex flex-wrap gap-1.5">{CATEGORIAS.map((c) => <button type="button" key={c.id} onClick={() => set("categoria", c.id)} className={chip(f.categoria === c.id)}>{c.label}</button>)}</div></div>
          <div className="md:col-span-2"><label className={rotulo}>Descripción</label>
            <textarea className={campo} rows={3} value={f.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} placeholder="Qué se hizo: metros, especies, riego…" /></div>
          <div className="md:col-span-2"><label className={rotulo}>Tipo de fotos</label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => set("tipo", "antes_despues")} className={chip(f.tipo === "antes_despues")}>Antes / después</button>
              <button type="button" onClick={() => set("tipo", "galeria")} className={chip(f.tipo === "galeria")}>Galería</button>
            </div></div>
        </div>

        <div className="mt-4">
          {f.tipo === "antes_despues" ? (
            <div className="grid grid-cols-2 gap-3">
              <CampoFoto etiqueta="Antes" url={f.antes} carpeta="portafolio" onCambio={(u) => set("antes", u)} />
              <CampoFoto etiqueta="Después" url={f.despues} carpeta="portafolio" onCambio={(u) => set("despues", u)} />
            </div>
          ) : (
            <div>
              <div className="text-xs font-medium text-stone-600 mb-1">Fotos (la primera es la portada)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {f.galeria.map((u, n) => (
                  <CampoFoto key={u + n} url={u} carpeta="portafolio"
                    onCambio={(nueva) => set("galeria", nueva ? f.galeria.map((x, k) => (k === n ? nueva : x)) : f.galeria.filter((_, k) => k !== n))} />
                ))}
                <CampoFoto url={null} carpeta="portafolio" onCambio={(nueva) => nueva && set("galeria", [...f.galeria, nueva])} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.publicado} onChange={(e) => set("publicado", e.target.checked)} /> Publicado en el sitio</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.en_inicio} onChange={(e) => set("en_inicio", e.target.checked)} /> Mostrar en la portada</label>
        </div>

        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex items-center gap-2">
          <button disabled={guardando} className="rounded-lg bg-[#1a5a4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{guardando ? "Guardando…" : "Guardar"}</button>
          <button type="button" onClick={onCerrar} className="rounded-lg px-4 py-2 text-sm text-stone-600">Cancelar</button>
          {!esNuevo && <button type="button" onClick={borrar} className="ml-auto text-sm text-rose-700">Borrar proyecto</button>}
        </div>
      </form>
    </div>
  );
}
