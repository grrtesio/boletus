import { useState } from "react";
import { createPortal } from "react-dom";
import { pdf } from "@react-pdf/renderer";
import { Plus, Trash2, X, Eye, FileDown } from "lucide-react";
import { ESTADOS, supabase, type Cotizacion, type EstadoCotizacion } from "./supabase";
import {
  ALCANCE_POR_SERVICIO, CONDICIONES_BASE, ESTADO_EN_PDF, datosIniciales, guardarGenerado,
  type DatosDocumento, type Documento,
} from "./documentos-api";
import { PdfCotizacion } from "./PdfCotizacion";

/*
 * GENERADOR DEL DOCUMENTO DE COTIZACIÓN. Se abre desde la ficha de una
 * cotización. El formulario trae lo que ya se sabe (cliente, comuna, servicio,
 * monto) y, al elegir el servicio, precarga las viñetas típicas del alcance;
 * todo queda editable. «Vista previa» abre el PDF en otra pestaña sin guardar;
 * «Generar y guardar» lo sube al bucket y registra (o actualiza) la fila.
 *
 * El estado que imprime el PDF es el estado real de la cotización: si acá se
 * cambia, se cambia también en la cotización.
 */

const LOGO = "/logo-boletus.png";

export function GeneradorDocumento({ cotizacion, existente, onCerrar, onGuardado }: {
  cotizacion: Cotizacion; existente: Documento | null; onCerrar: () => void; onGuardado: (d: Documento, estado: EstadoCotizacion) => void;
}) {
  const [d, setD] = useState<DatosDocumento>(() => datosIniciales(cotizacion, existente?.datos ?? null));
  const [estado, setEstado] = useState<EstadoCotizacion>(cotizacion.estado);
  const [ocupado, setOcupado] = useState<"previa" | "guardar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof DatosDocumento>(k: K, v: DatosDocumento[K]) => setD((x) => ({ ...x, [k]: v }));

  const elegirPlantilla = (servicio: string) => {
    if (!servicio) return;
    const sinAlcance = d.alcance.every((t) => !t.trim());
    const reemplazar = sinAlcance || window.confirm("¿Reemplazar las líneas del alcance por las típicas de este servicio?");
    setD((x) => ({ ...x, titulo: x.titulo.trim() ? x.titulo : servicio, alcance: reemplazar ? [...ALCANCE_POR_SERVICIO[servicio]] : x.alcance }));
  };

  const armarPdf = async () => {
    const logo = await cargarLogo();
    return pdf(<PdfCotizacion datos={d} estado={estado} logo={logo} />).toBlob();
  };

  const validar = () => {
    if (!d.cliente.trim()) return "Falta el nombre del cliente.";
    if (!d.titulo.trim()) return "Falta el título del servicio.";
    if (!d.alcance.some((t) => t.trim())) return "El alcance necesita al menos una línea.";
    if (d.valor == null) return "Falta el valor total.";
    return null;
  };

  const previa = async () => {
    const v = validar(); if (v) { setError(v); return; }
    setOcupado("previa"); setError(null);
    try {
      const blob = await armarPdf();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setError("No se pudo armar la vista previa."); }
    finally { setOcupado(null); }
  };

  const guardar = async () => {
    const v = validar(); if (v) { setError(v); return; }
    setOcupado("guardar"); setError(null);
    try {
      const blob = await armarPdf();
      if (estado !== cotizacion.estado) {
        const { error: e } = await supabase.from("cotizaciones").update({ estado, monto_cotizado: d.valor }).eq("id", cotizacion.id);
        if (e) throw new Error("No se pudo actualizar el estado de la cotización.");
      } else if (d.valor != null && d.valor !== cotizacion.monto_cotizado) {
        await supabase.from("cotizaciones").update({ monto_cotizado: d.valor }).eq("id", cotizacion.id);
      }
      const doc = await guardarGenerado(cotizacion, d, blob, estado, existente);
      onGuardado(doc, estado);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setOcupado(null); }
  };

  const campo = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
  const rotulo = "block text-xs font-medium text-stone-600 mb-1";
  const chico = "rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm";

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="w-full md:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-[#f7f4ee] p-5 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{existente ? "Editar documento de cotización" : "Generar documento de cotización"}</h2>
            <p className="text-xs text-stone-500">Se arma el PDF con el diseño de Boletus. {existente ? "Al guardar se reemplaza el anterior." : ""}</p>
          </div>
          <button type="button" onClick={onCerrar} className="p-1 text-stone-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={rotulo}>Cliente</label><input className={campo} value={d.cliente} onChange={(e) => set("cliente", e.target.value)} /></div>
          <div><label className={rotulo}>Fecha de emisión</label><input className={campo} type="date" value={d.fecha_emision} onChange={(e) => set("fecha_emision", e.target.value)} /></div>
          <div><label className={rotulo}>Ubicación</label><input className={campo} value={d.ubicacion} onChange={(e) => set("ubicacion", e.target.value)} placeholder="Av. Valparaíso 1270, Villa Alemana" /></div>
          <div><label className={rotulo}>Superficie referencial (opcional)</label><input className={campo} value={d.superficie} onChange={(e) => set("superficie", e.target.value)} placeholder="Aprox. 430 m²" /></div>
          <div><label className={rotulo}>Plantilla de servicio</label>
            <select className={campo} defaultValue="" onChange={(e) => { elegirPlantilla(e.target.value); e.target.value = ""; }}>
              <option value="">Precargar alcance de…</option>
              {Object.keys(ALCANCE_POR_SERVICIO).map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className={rotulo}>Título del servicio (va bajo «Cotización de servicios»)</label><input className={campo} value={d.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Mantención y limpieza de terreno" /></div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className={rotulo}>Alcance del servicio</label>
            <button type="button" onClick={() => set("alcance", [...d.alcance, ""])} className="inline-flex items-center gap-1 text-xs text-[#1a5a4a] font-medium"><Plus className="w-3.5 h-3.5" /> Agregar línea</button>
          </div>
          <div className="space-y-1.5">
            {d.alcance.map((t, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <span className="mt-2 text-[#6f8a5c]">•</span>
                <textarea rows={1} className={`${chico} flex-1 resize-y`} value={t} onChange={(e) => set("alcance", d.alcance.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" title="Quitar" onClick={() => set("alcance", d.alcance.filter((_, j) => j !== i))} className="mt-1 p-1.5 text-rose-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {d.alcance.length === 0 && <p className="text-xs text-stone-500">Elige una plantilla de servicio o agrega líneas a mano.</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={rotulo}>Valor total ($ CLP)</label>
            <input className={campo} inputMode="numeric" value={d.valor == null ? "" : d.valor.toLocaleString("es-CL")} onChange={(e) => { const n = e.target.value.replace(/\D/g, ""); set("valor", n ? Number(n) : null); }} /></div>
          <div><label className={rotulo}>Descripción del valor</label><input className={campo} value={d.valor_descripcion} onChange={(e) => set("valor_descripcion", e.target.value)} /></div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className={rotulo}>Condiciones del servicio</label>
            <div className="flex gap-3">
              {d.condiciones.length === 0 && <button type="button" onClick={() => set("condiciones", CONDICIONES_BASE.map((x) => ({ ...x })))} className="text-xs text-stone-600 underline">Las de siempre</button>}
              <button type="button" onClick={() => set("condiciones", [...d.condiciones, { etiqueta: "", texto: "" }])} className="inline-flex items-center gap-1 text-xs text-[#1a5a4a] font-medium"><Plus className="w-3.5 h-3.5" /> Agregar condición</button>
            </div>
          </div>
          <div className="space-y-1.5">
            {d.condiciones.map((c, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <input className={`${chico} w-36 md:w-44`} placeholder="Etiqueta" value={c.etiqueta} onChange={(e) => set("condiciones", d.condiciones.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)))} />
                <textarea rows={1} className={`${chico} flex-1 resize-y`} placeholder="Texto" value={c.texto} onChange={(e) => set("condiciones", d.condiciones.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))} />
                <button type="button" title="Quitar" onClick={() => set("condiciones", d.condiciones.filter((_, j) => j !== i))} className="mt-1 p-1.5 text-rose-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div><label className={rotulo}>Estado de la cotización (se imprime en el PDF)</label>
            <select className={campo} value={estado} onChange={(e) => setEstado(e.target.value as EstadoCotizacion)}>
              {ESTADOS.map((x) => <option key={x.id} value={x.id}>{x.label} — «{ESTADO_EN_PDF[x.id]}»</option>)}
            </select></div>
          <p className="text-xs text-stone-500">Si lo cambias acá, cambia también en la cotización.</p>
        </div>

        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={ocupado !== null} onClick={guardar} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5a4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <FileDown className="w-4 h-4" /> {ocupado === "guardar" ? "Generando…" : existente ? "Regenerar y guardar" : "Generar y guardar"}
          </button>
          <button type="button" disabled={ocupado !== null} onClick={previa} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 disabled:opacity-60">
            <Eye className="w-4 h-4" /> {ocupado === "previa" ? "Armando…" : "Vista previa"}
          </button>
          <button type="button" onClick={onCerrar} className="rounded-lg px-4 py-2 text-sm text-stone-600">Cancelar</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** El logo como data URL: así el PDF no depende de la red al dibujarse. */
let logoCache: string | null = null;
async function cargarLogo(): Promise<string> {
  if (logoCache) return logoCache;
  const r = await fetch(LOGO);
  if (!r.ok) throw new Error("No se pudo leer el logo.");
  const blob = await r.blob();
  logoCache = await new Promise<string>((ok, mal) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = () => mal(new Error("logo")); fr.readAsDataURL(blob); });
  return logoCache;
}
