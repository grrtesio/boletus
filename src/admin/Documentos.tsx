import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Download, Pencil, Trash2, FilePlus2 } from "lucide-react";
import { fechaCorta, type Cotizacion, type EstadoCotizacion } from "./supabase";
import { EstadoChip } from "./Cotizaciones";
import { GeneradorDocumento } from "./GeneradorDocumento";
import {
  borrarDocumento, listarDocumentos, listarDocumentosDelCliente, subirExterno, urlDescarga,
  type Documento, type DocumentoDeCliente,
} from "./documentos-api";

/*
 * DOCUMENTOS DE UNA COTIZACIÓN, dentro de su ficha: el PDF generado por el panel
 * (uno, editable), los PDF subidos a mano, y más abajo el historial de
 * documentos de otras cotizaciones del mismo cliente (mismo teléfono o nombre),
 * que hace de «ficha de cliente» mientras no exista el módulo Clientes.
 */
export function Documentos({ cotizacion, onEstado }: { cotizacion: Cotizacion; onEstado: (e: EstadoCotizacion) => void }) {
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const [delCliente, setDelCliente] = useState<DocumentoDeCliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    try { setDocs(await listarDocumentos(cotizacion.id)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); setDocs([]); }
    listarDocumentosDelCliente(cotizacion).then(setDelCliente).catch(() => setDelCliente([]));
  };
  useEffect(() => { void cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cotizacion.id]);

  const generado = docs?.find((d) => d.tipo === "generado") ?? null;

  const abrir = async (d: Documento) => {
    try { window.open(await urlDescarga(d), "_blank", "noopener"); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo abrir."); }
  };
  const borrar = async (d: Documento) => {
    if (!window.confirm(`¿Borrar «${d.nombre_archivo}»? No se puede deshacer.`)) return;
    try { await borrarDocumento(d); await cargar(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo borrar."); }
  };
  const subir = async (f: File | undefined) => {
    if (!f) return;
    setSubiendo(true); setError(null);
    try { await subirExterno(cotizacion, f); await cargar(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo subir."); }
    finally { setSubiendo(false); if (input.current) input.current.value = ""; }
  };

  const Fila = ({ d, extra }: { d: Documento; extra?: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
      <FileText className={`w-4 h-4 ${d.tipo === "generado" ? "text-[#1a5a4a]" : "text-stone-500"}`} />
      <button type="button" onClick={() => abrir(d)} className="text-sm font-medium text-left hover:underline flex-1 min-w-[160px] truncate">{d.nombre_archivo}</button>
      <span className="text-xs text-stone-500">{d.tipo === "generado" ? "Generado" : "Subido"} · {fechaCorta(d.actualizada)}</span>
      {d.estado_al_emitir && <EstadoChip estado={d.estado_al_emitir} />}
      {extra}
      <button type="button" title="Descargar" onClick={() => abrir(d)} className="p-1.5 text-stone-600 hover:text-[#1a5a4a]"><Download className="w-4 h-4" /></button>
      {d.tipo === "generado" && <button type="button" title="Editar y regenerar" onClick={() => setGenerando(true)} className="p-1.5 text-stone-600 hover:text-[#1a5a4a]"><Pencil className="w-4 h-4" /></button>}
      <button type="button" title="Borrar" onClick={() => borrar(d)} className="p-1.5 text-rose-700"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  return (
    <div className="mt-5 border-t border-stone-200 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold">Documentos</h3>
        <div className="flex gap-2">
          <button type="button" onClick={() => setGenerando(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5a4a] px-3 py-1.5 text-xs font-semibold text-white">
            <FilePlus2 className="w-3.5 h-3.5" /> {generado ? "Editar documento de cotización" : "Generar documento de cotización"}
          </button>
          <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 disabled:opacity-60">
            <Upload className="w-3.5 h-3.5" /> {subiendo ? "Subiendo…" : "Subir PDF"}
          </button>
          <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p className="mb-2 text-xs text-rose-700">{error}</p>}
      {docs === null ? <p className="text-xs text-stone-500">Cargando…</p> : docs.length === 0 ? (
        <p className="text-xs text-stone-500">Todavía no hay documentos. Genera la cotización en PDF o sube uno externo.</p>
      ) : (
        <div className="space-y-1.5">{docs.map((d) => <Fila key={d.id} d={d} />)}</div>
      )}

      {delCliente.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-stone-600 mb-1.5">Otros documentos de este cliente</h4>
          <div className="space-y-1.5">
            {delCliente.map((d) => (
              <Fila key={d.id} d={d} extra={d.cotizaciones && (
                <span className="text-xs text-stone-500">{[d.cotizaciones.servicio, fechaCorta(d.cotizaciones.fecha_contacto)].filter(Boolean).join(" · ")}</span>
              )} />
            ))}
          </div>
        </div>
      )}

      {generando && (
        <GeneradorDocumento cotizacion={cotizacion} existente={generado}
          onCerrar={() => setGenerando(false)}
          onGuardado={(_d, estado) => { setGenerando(false); onEstado(estado); void cargar(); }} />
      )}
    </div>
  );
}
