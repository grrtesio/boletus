/**
 * Función serverless (Vercel): recibe el formulario de contacto de boletus.cl y
 * envía la consulta por correo a contacto@boletus.cl vía Resend. El remitente es
 * Mondo Tesio (dominio ya verificado en Resend); el destino y remitente se pueden
 * override por env. No toca ninguna base de datos.
 *
 * POST /api/contacto  { nombre, telefono, servicio, mensaje }
 *
 * Env requerida: RESEND_API_KEY (la API key re_... de Resend).
 * Env opcional:  CONTACTO_TO (default contacto@boletus.cl),
 *                CONTACTO_FROM (default "Boletus (Mondo Tesio) <no-reply@mondotesio.com>").
 */
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.CONTACTO_TO || 'contacto@boletus.cl';
const FROM = process.env.CONTACTO_FROM || 'Boletus (Mondo Tesio) <no-reply@mondotesio.com>';

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'metodo_no_permitido' });
    return;
  }
  if (!RESEND_KEY) {
    res.status(503).json({ ok: false, error: 'email_no_configurado' });
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
      res.status(502).json({ ok: false, error: 'resend_fallo', detalle });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'error' });
  }
}
