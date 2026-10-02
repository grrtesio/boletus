import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { esDeBanco, subirFoto } from "./fotos";

/*
 * Un recuadro de foto: muestra la actual y deja cambiarla o quitarla. Si la foto
 * es de banco de imágenes (las que traía el sitio), lo dice: hay que reemplazarla
 * por una propia.
 */
export function CampoFoto({ url, carpeta, onCambio, alto = "h-36", etiqueta, quitar = true }: {
  url: string | null; carpeta: string; onCambio: (url: string | null) => void; alto?: string; etiqueta?: string; quitar?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegir = async (f: File | undefined) => {
    if (!f) return;
    setSubiendo(true); setError(null);
    try { onCambio(await subirFoto(f, carpeta)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo subir."); }
    finally { setSubiendo(false); if (input.current) input.current.value = ""; }
  };

  return (
    <div>
      {etiqueta && <div className="text-xs font-medium text-stone-600 mb-1">{etiqueta}</div>}
      <div className={`relative ${alto} rounded-lg overflow-hidden border border-stone-300 bg-stone-100`}>
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : (
          <button type="button" onClick={() => input.current?.click()} className="w-full h-full flex flex-col items-center justify-center text-stone-500 text-xs gap-1">
            <ImagePlus className="w-6 h-6" /> Subir foto
          </button>
        )}
        {subiendo && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs text-stone-700">Subiendo…</div>}
        {url && esDeBanco(url) && (
          <span className="absolute left-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Foto de banco · reemplázala</span>
        )}
        {url && (
          <div className="absolute right-1.5 bottom-1.5 flex gap-1">
            <button type="button" onClick={() => input.current?.click()} className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-stone-700">Cambiar</button>
            {quitar && <button type="button" onClick={() => onCambio(null)} title="Quitar" className="rounded bg-white/90 p-1 text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
      {error && <div className="text-xs text-rose-700 mt-1">{error}</div>}
    </div>
  );
}
