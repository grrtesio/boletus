import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { CampoFoto } from "./CampoFoto";
import { borrarFoto } from "./fotos";

/*
 * «QUIÉNES SOMOS» (boletus.cl/nosotros): la foto de cabecera y la ficha de cada
 * uno —foto, nombre, cargo y descripción—. Se guarda por persona.
 */

interface Persona { id: string; nombre: string; cargo: string | null; bio: string | null; foto: string | null; orden: number; visible: boolean }

export function Equipo() {
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [cabecera, setCabecera] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = async () => {
    const [eq, aj] = await Promise.all([
      supabase.from("equipo").select("*").order("orden"),
      supabase.from("ajustes").select("valor").eq("clave", "nosotros_cabecera").maybeSingle(),
    ]);
    if (eq.error) { setError("No se pudo leer el equipo."); return; }
    setPersonas((eq.data ?? []) as Persona[]);
    setCabecera((aj.data?.valor as string | null) ?? null);
  };
  useEffect(() => { void cargar(); }, []);

  const guardarCabecera = async (url: string | null) => {
    const antes = cabecera;
    setCabecera(url);
    const { error: err } = await supabase.from("ajustes").upsert({ clave: "nosotros_cabecera", valor: url });
    if (err) { setError("No se pudo guardar la foto de cabecera."); setCabecera(antes); return; }
    if (antes && antes !== url) await borrarFoto(antes);
    setAviso("Foto de cabecera guardada.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Quiénes somos</h1>
      <p className="text-sm text-stone-500 mb-5">Lo que se ve en boletus.cl/nosotros. Cada cambio se publica al guardar.</p>
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {aviso && <p className="mb-3 text-sm text-emerald-700">{aviso}</p>}

      <div className="rounded-xl border border-stone-200 bg-white p-4 mb-6">
        <div className="text-sm font-semibold mb-2">Foto de cabecera</div>
        <CampoFoto url={cabecera} carpeta="sitio" alto="h-40" quitar={false} onCambio={(u) => u && guardarCabecera(u)} />
      </div>

      {!personas ? <p className="text-sm text-stone-500">Cargando…</p> : (
        <div className="grid md:grid-cols-2 gap-4">
          {personas.map((p) => <FichaPersona key={p.id} inicial={p} onGuardada={(t) => { setAviso(t); void cargar(); }} />)}
        </div>
      )}
    </div>
  );
}

function FichaPersona({ inicial, onGuardada }: { inicial: Persona; onGuardada: (aviso: string) => void }) {
  const [f, setF] = useState<Persona>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cambiado = JSON.stringify(f) !== JSON.stringify(inicial);
  const set = <K extends keyof Persona>(k: K, v: Persona[K]) => setF((x) => ({ ...x, [k]: v }));

  const guardar = async () => {
    if (!f.nombre.trim()) { setError("Falta el nombre."); return; }
    setGuardando(true); setError(null);
    const { error: err } = await supabase.from("equipo").update({
      nombre: f.nombre.trim(), cargo: f.cargo?.trim() || null, bio: f.bio?.trim() || null, foto: f.foto, visible: f.visible,
    }).eq("id", f.id);
    setGuardando(false);
    if (err) { setError("No se pudo guardar."); return; }
    if (inicial.foto && inicial.foto !== f.foto) await borrarFoto(inicial.foto);
    onGuardada(`Ficha de ${f.nombre.trim()} guardada.`);
  };

  const campo = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <CampoFoto url={f.foto} carpeta="equipo" alto="h-48" quitar={false} onCambio={(u) => u && set("foto", u)} />
      <div className="mt-3 space-y-2">
        <input className={`${campo} font-semibold`} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre" />
        <input className={campo} value={f.cargo ?? ""} onChange={(e) => set("cargo", e.target.value)} placeholder="Cargo / especialidad" />
        <textarea className={campo} rows={4} value={f.bio ?? ""} onChange={(e) => set("bio", e.target.value)} placeholder="Descripción" />
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.visible} onChange={(e) => set("visible", e.target.checked)} /> Se muestra en el sitio</label>
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={guardar} disabled={!cambiado || guardando} className="rounded-lg bg-[#1a5a4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{guardando ? "Guardando…" : "Guardar"}</button>
        {cambiado && <button onClick={() => setF(inicial)} className="rounded-lg px-3 py-2 text-sm text-stone-600">Deshacer</button>}
      </div>
    </div>
  );
}
