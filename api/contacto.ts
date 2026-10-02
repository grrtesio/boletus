/**
 * Función serverless (Vercel): recibe el formulario de contacto de boletus.cl y
 * envía la consulta por correo a contacto@boletus.cl vía Resend. El remitente es
 * Mondo Tesio (dominio ya verificado en Resend); el destino y remitente se pueden
 * override por env.
 *
 * Además (2-oct-2026) la guarda como cotización NUEVA en la base del panel
 * (/admin → Cotizaciones). Las dos cosas son independientes: si la base no
 * contesta, el correo sale igual, y si el correo falla, la consulta ya quedó
 * guardada. Nunca se pierde una consulta por culpa de la otra.
 *
 * POST /api/contacto  { nombre, telefono, servicio, mensaje }
 *
 * Env requerida: RESEND_API_KEY (la API key re_... de Resend).
 * Env del panel: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (sin ellas solo se manda el correo).
 * Env opcional:  CONTACTO_TO (default contacto@boletus.cl),
 *                CONTACTO_FROM (default "Boletus (Mondo Tesio) <no-reply@mondotesio.com>").
 */
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.CONTACTO_TO || 'contacto@boletus.cl';
const FROM = process.env.CONTACTO_FROM || 'Boletus (Mondo Tesio) <no-reply@mondotesio.com>';

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Guarda la consulta como cotización nueva. No lanza: devuelve si quedó guardada. */
async function guardarCotizacion(c: { nombre: string; telefono: string; servicio: string; mensaje: string }): Promise<boolean> {
  if (!SUPA_URL || !SUPA_KEY) return false;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/cotizaciones`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ origen: 'web', estado: 'nueva', nombre: c.nombre, telefono: c.telefono, servicio: c.servicio || null, mensaje: c.mensaje || null }),
    });
    if (!r.ok) console.error('[contacto] no se guardó la cotización:', r.status, (await r.text().catch(() => '')).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error('[contacto] no se guardó la cotización:', e instanceof Error ? e.message : e);
    return false;
  }
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'metodo_no_permitido' });
    return;
  }
  const b = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })() : (req.body || {});
  const nombre = String(b.nombre || '').trim();
  const telefono = String(b.telefono || '').trim();
  const servicio = String(b.servicio || '').trim();
  const mensaje = String(b.mensaje || '').trim();

  if (!nombre || !telefono) {
    res.status(400).json({ ok: false, error: 'faltan_datos' });
    return;
  }

  // Primero se guarda: es lo que alimenta el panel, y no depende de que salga el correo.
  const guardada = await guardarCotizacion({ nombre, telefono, servicio, mensaje });
  if (!RESEND_KEY) {
    res.status(guardada ? 200 : 503).json({ ok: guardada, guardada, error: 'email_no_configurado' });
    return;
  }

  const wa = telefono.replace(/[^0-9]/g, '');
  const subject = `Nueva consulta web · ${nombre}${servicio ? ` · ${servicio}` : ''}`.slice(0, 120);
  const text = `Nueva consulta desde boletus.cl\n\nNombre: ${nombre}\nTeléfono: ${telefono}\nServicio: ${servicio || '-'}\nMensaje: ${mensaje || '-'}`;
  const html = `<div style="font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#1b1712;max-width:560px">
    <h2 style="margin:0 0 14px;font-family:Georgia,serif">Nueva consulta desde boletus.cl</h2>
    <p style="margin:6px 0"><b>Nombre:</b> ${esc(nombre)}</p>
    <p style="margin:6px 0"><b>Teléfono:</b> <a href="tel:${esc(telefono)}">${esc(telefono)}</a>${wa ? ` &nbsp;·&nbsp; <a href="https://wa.me/${wa}">WhatsApp</a>` : ''}</p>
    <p style="margin:6px 0"><b>Servicio:</b> ${esc(servicio) || '-'}</p>
    <p style="margin:6px 0"><b>Mensaje:</b><br>${esc(mensaje).replace(/\n/g, '<br>') || '-'}</p>
  </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], subject, text, html }),
    });
    if (!r.ok) {
      const detalle = (await r.text().catch(() => '')).slice(0, 200);
      // Si quedó guardada, la consulta no se perdió: se ve en el panel.
      res.status(guardada ? 200 : 502).json({ ok: guardada, guardada, error: 'resend_fallo', detalle });
      return;
    }
    res.status(200).json({ ok: true, guardada });
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'error' });
  }
}
