import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Plus, Search, X } from "lucide-react";
import {
  ESTADOS, ORIGENES, SERVICIOS, supabase, fechaCorta, pesos, waLink,
  type Cotizacion, type EstadoCotizacion, type OrigenCotizacion,
} from "./supabase";

/*
 * COTIZACIONES. Entran solas desde el formulario de /contacto (origen «web») y
 * se cargan a mano las que llegan por WhatsApp o llamada. Cada una tiene un
 * estado: Nueva → Cotizada → Aceptada / Rechazada / Sin respuesta.
 */

export function EstadoChip({ estado }: { estado: EstadoCotizacion }) {
  const e = ESTADOS.find((x) => x.id === estado) ?? ESTADOS[0];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${e.color}`}>{e.label}</span>;
}

type Borrador = Omit<Cotizacion, "id" | "creada" | "actualizada"> & { id?: string };

const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
const vacia = (): Borrador => ({
  origen: "whatsapp", nombre: "", telefono: "", email: "", comuna: "", servicio: "", mensaje: "",
  fecha_contacto: hoy(), estado: "nueva", monto_cotizado: null, notas: "",
});

export function Cotizaciones() {
  const [lista, setLista] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoCotizacion | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Borrador | null>(null);

  const cargar = async () => {
    setCargando(true);
    const { data, error: err } = await supabase.from("cotizaciones").select("*").order("fecha_contacto", { ascending: false }).order("creada", { ascending: false });
    setCargando(false);
    if (err) { setError("No se pudieron leer las cotizaciones."); return; }
    setError(null); setLista((data ?? []) as Cotizacion[]);
  };
  useEffect(() => { void cargar(); }, []);

  const cambiarEstado = async (c: Cotizacion, estado: EstadoCotizacion) => {
    setLista((l) => l.map((x) => (x.id === c.id ? { ...x, estado } : x)));
    const { error: err } = await supabase.from("cotizaciones").update({ estado }).eq("id", c.id);
    if (err) { setError("No se pudo cambiar el estado."); void cargar(); }
  };

  const q = busca.trim().toLowerCase();
  const visibles = useMemo(() => lista
    .filter((c) => filtro === "todas" || c.estado === filtro)
    .filter((c) => !q || [c.nombre, c.telefono, c.servicio, c.comuna, c.mensaje].some((v) => (v || "").toLowerCase().includes(q))), [lista, filtro, q]);

  const cuenta = (e: EstadoCotizacion) => lista.filter((c) => c.estado === e).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Cotizaciones</h1>
          <p className="text-sm text-stone-500">Las del formulario web entran solas. Las de WhatsApp o llamada, agrégalas acá.</p>
        </div>
        <button onClick={() => setEditando(vacia())} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5a4a] px-4 py-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" /> Nueva cotización
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[{ id: "todas" as const, label: "Todas", n: lista.length }, ...ESTADOS.map((e) => ({ id: e.id, label: e.label, n: cuenta(e.id) }))].map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`rounded-full border px-3 py-1 text-sm ${filtro === f.id ? "bg-[#1a5a4a] text-white border-[#1a5a4a]" : "bg-white border-stone-300 text-stone-700"}`}>
            {f.label} <span className="opacity-70">({f.n})</span>
          </button>
        ))}
      </div>
      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nombre, teléfono, servicio, comuna…"
          className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-sm" />
      </div>

      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {cargando ? <p className="text-sm text-stone-500">Cargando…</p> : visibles.length === 0 ? (
        <p className="text-sm text-stone-500">{lista.length ? "Ninguna calza con el filtro." : "Todavía no hay cotizaciones."}</p>
      ) : (
        <div className="space-y-2">
          {visibles.map((c) => {
            const wa = waLink(c.telefono);
            return (
              <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-4 flex flex-wrap gap-3 items-start">
                <button onClick={() => setEditando({ ...c })} className="flex-1 min-w-[220px] text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.nombre}</span>
                    <EstadoChip estado={c.estado} />
                    <span className="text-xs text-stone-500">{ORIGENES.find((o) => o.id === c.origen)?.label ?? "Manual"} · {fechaCorta(c.fecha_contacto)}</span>
                  </div>
                  <div className="text-sm text-stone-600 mt-0.5">{[c.servicio, c.comuna, c.monto_cotizado != null ? pesos(c.monto_cotizado) : null].filter(Boolean).join(" · ") || "Sin servicio indicado"}</div>
                  {c.mensaje && <div className="text-sm text-stone-500 mt-1 line-clamp-2">{c.mensaje}</div>}
                </button>
                <div className="flex items-center gap-2">
                  {c.telefono && <a href={`tel:${c.telefono}`} title="Llamar" className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-50"><Phone className="w-4 h-4" /></a>}
                  {wa && <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" className="rounded-lg border border-stone-300 p-2 text-[#1ebe5d] hover:bg-stone-50"><MessageCircle className="w-4 h-4" /></a>}
                  <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value as EstadoCotizacion)}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm">
                    {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editando && <FichaCotizacion inicial={editando} onCerrar={() => setEditando(null)} onGuardada={() => { setEditando(null); void cargar(); }} />}
    </div>
  );
}

function FichaCotizacion({ inicial, onCerrar, onGuardada }: { inicial: Borrador; onCerrar: () => void; onGuardada: () => void }) {
  const [f, setF] = useState<Borrador>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setF((x) => ({ ...x, [k]: v }));
  const nueva = !f.id;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nombre.trim()) { setError("Falta el nombre."); return; }
    setGuardando(true); setError(null);
    const fila = {
      origen: f.origen, nombre: f.nombre.trim(), telefono: f.telefono?.trim() || null, email: f.email?.trim() || null,
      comuna: f.comuna?.trim() || null, servicio: f.servicio || null, mensaje: f.mensaje?.trim() || null,
      fecha_contacto: f.fecha_contacto, estado: f.estado, monto_cotizado: f.monto_cotizado, notas: f.notas?.trim() || null,
    };
    const { error: err } = nueva
      ? await supabase.from("cotizaciones").insert(fila)
      : await supabase.from("cotizaciones").update(fila).eq("id", f.id!);
    setGuardando(false);
    if (err) setError("No se pudo guardar."); else onGuardada();
  };

  const borrar = async () => {
    if (!f.id || !window.confirm(`¿Borrar la cotización de ${f.nombre}? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from("cotizaciones").delete().eq("id", f.id);
    if (err) setError("No se pudo borrar."); else onGuardada();
  };

  const campo = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
  const rotulo = "block text-xs font-medium text-stone-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <form onSubmit={guardar} className="w-full md:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-[#f7f4ee] p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{nueva ? "Nueva cotización" : "Cotización"}</h2>
          <button type="button" onClick={onCerrar} className="p-1 text-stone-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className={rotulo}>Nombre</label><input className={campo} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus={nueva} /></div>
          <div><label className={rotulo}>Teléfono</label><input className={campo} value={f.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} inputMode="tel" /></div>
          <div><label className={rotulo}>Correo</label><input className={campo} value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} type="email" /></div>
          <div><label className={rotulo}>Comuna</label><input className={campo} value={f.comuna ?? ""} onChange={(e) => set("comuna", e.target.value)} /></div>
          <div><label className={rotulo}>Servicio de interés</label>
            <select className={campo} value={f.servicio ?? ""} onChange={(e) => set("servicio", e.target.value)}>
              <option value="">—</option>
              {[...SERVICIOS, ...(f.servicio && !SERVICIOS.includes(f.servicio) ? [f.servicio] : [])].map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className={rotulo}>Fecha de contacto</label><input className={campo} type="date" value={f.fecha_contacto} onChange={(e) => set("fecha_contacto", e.target.value)} /></div>
          <div><label className={rotulo}>Cómo llegó</label>
            <select className={campo} value={f.origen} onChange={(e) => set("origen", e.target.value as OrigenCotizacion)}>
              {ORIGENES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select></div>
          <div><label className={rotulo}>Estado</label>
            <select className={campo} value={f.estado} onChange={(e) => set("estado", e.target.value as EstadoCotizacion)}>
              {ESTADOS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select></div>
          <div><label className={rotulo}>Monto cotizado ($)</label>
            <input className={campo} inputMode="numeric" value={f.monto_cotizado ?? ""} onChange={(e) => { const n = e.target.value.replace(/\D/g, ""); set("monto_cotizado", n ? Number(n) : null); }} /></div>
          <div className="md:col-span-2"><label className={rotulo}>Mensaje del cliente</label><textarea className={campo} rows={3} value={f.mensaje ?? ""} onChange={(e) => set("mensaje", e.target.value)} /></div>
          <div className="md:col-span-2"><label className={rotulo}>Notas internas</label><textarea className={campo} rows={2} value={f.notas ?? ""} onChange={(e) => set("notas", e.target.value)} /></div>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex items-center gap-2">
          <button disabled={guardando} className="rounded-lg bg-[#1a5a4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{guardando ? "Guardando…" : "Guardar"}</button>
          <button type="button" onClick={onCerrar} className="rounded-lg px-4 py-2 text-sm text-stone-600">Cancelar</button>
          {!nueva && <button type="button" onClick={borrar} className="ml-auto text-sm text-rose-700">Borrar</button>}
        </div>
      </form>
    </div>
  );
}
