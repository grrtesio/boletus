import { useState } from "react";
import { supabase } from "./supabase";

/*
 * INGRESO AL PANEL: código de 6 dígitos al correo.
 *
 * `shouldCreateUser: false`: solo reciben código los usuarios que ya existen en
 * la base (hoy contacto@boletus.cl). Un correo cualquiera no crea cuenta ni
 * recibe nada; para no dar pistas, la pantalla responde igual en los dos casos.
 */
export function Ingreso({ sinPermiso }: { sinPermiso: boolean }) {
  const [correo, setCorreo] = useState("contacto@boletus.cl");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(sinPermiso ? "Ese correo no tiene acceso al panel." : null);

  const pedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: correo.trim().toLowerCase(), options: { shouldCreateUser: false } });
    setEnviando(false);
    // Un correo sin cuenta da error; se avanza igual para no confirmar qué correos existen.
    if (err && /rate|too many|429/i.test(err.message)) { setError("Se pidieron demasiados códigos. Espera un minuto y vuelve a intentar."); return; }
    setPaso("codigo");
  };

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email: correo.trim().toLowerCase(), token: codigo.trim(), type: "email" });
    setEnviando(false);
    if (err) setError("El código no es válido o ya venció. Pide uno nuevo.");
  };

  const campo = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5a4a]/40";

  return (
    <div className="min-h-screen bg-[#f7f4ee] flex items-center justify-center p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm border border-stone-200">
        <img src="/logo-boletus.svg" alt="Boletus" className="h-9 mb-5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <h1 className="text-xl font-semibold text-[#1a2818]" style={{ fontFamily: "'Playfair Display', serif" }}>Panel de administración</h1>

        {paso === "correo" ? (
          <form onSubmit={pedirCodigo} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-stone-600">Correo</label>
            <input className={campo} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="email" />
            <button disabled={enviando} className="w-full rounded-lg bg-[#1a5a4a] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {enviando ? "Enviando…" : "Enviarme un código"}
            </button>
          </form>
        ) : (
          <form onSubmit={verificar} className="mt-5 space-y-3">
            <p className="text-sm text-stone-600">Si <b>{correo}</b> tiene acceso, le llegó un código de 6 dígitos. Revisa también Spam.</p>
            <input className={`${campo} tracking-[0.4em] text-center text-lg`} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} placeholder="••••••" required />
            <button disabled={enviando || codigo.length !== 6} className="w-full rounded-lg bg-[#1a5a4a] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {enviando ? "Verificando…" : "Entrar"}
            </button>
            <button type="button" onClick={() => { setPaso("correo"); setCodigo(""); }} className="w-full text-xs text-stone-500 underline">Usar otro correo o pedir otro código</button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
