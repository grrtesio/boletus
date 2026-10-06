import { supabase, type Cotizacion, type EstadoCotizacion } from "./supabase";

/*
 * DOCUMENTOS DE COTIZACIÓN (6-oct-2026).
 *
 * Dos clases de archivo, ambos PDF en el bucket privado `documentos`:
 *  · GENERADO: el panel arma el PDF con el diseño de Boletus a partir de un
 *    formulario (ver GeneradorDocumento.tsx y PdfCotizacion.tsx). Hay uno solo
 *    por cotización: editar y volver a generar reemplaza el archivo y actualiza
 *    la misma fila, nunca duplica.
 *  · SUBIDO: un PDF externo (una cotización hecha a mano, un presupuesto de un
 *    proveedor) que se asocia a la cotización.
 *
 * El bucket es privado: se descarga por URL firmada de corta duración, y solo
 * los administradores pueden pedirla (reglas RLS de storage.objects).
 */

export interface Condicion { etiqueta: string; texto: string }

/** Todo lo que se escribe en el PDF. Se guarda en `documentos.datos` para poder editarlo después. */
export interface DatosDocumento {
  cliente: string;
  ubicacion: string;
  superficie: string;          // texto libre: «Aprox. 430 m²». Opcional.
  titulo: string;              // «Mantención y limpieza de terreno»
  fecha_emision: string;       // YYYY-MM-DD
  alcance: string[];
  valor: number | null;        // CLP
  valor_descripcion: string;   // «Servicio completo según el alcance detallado anteriormente.»
  condiciones: Condicion[];
}

export interface Documento {
  id: string;
  creada: string;
  actualizada: string;
  cotizacion_id: string;
  tipo: "generado" | "subido";
  ruta: string;
  nombre_archivo: string;
  titulo: string | null;
  estado_al_emitir: EstadoCotizacion | null;
  datos: DatosDocumento | null;
  notas: string | null;
}

/** Documento de otra cotización del mismo cliente (para el historial). */
export interface DocumentoDeCliente extends Documento {
  cotizaciones: { nombre: string; telefono: string | null; servicio: string | null; estado: EstadoCotizacion; fecha_contacto: string } | null;
}

// ─── Plantillas ──────────────────────────────────────────────────────────────

/** Viñetas típicas de «Alcance del servicio» por tipo de trabajo. Se precargan y quedan 100 % editables. */
export const ALCANCE_POR_SERVICIO: Record<string, string[]> = {
  "Paisajismo y Diseño": [
    "Visita a terreno y levantamiento de información del espacio.",
    "Diseño del proyecto según la superficie y condiciones del lugar.",
    "Selección de especies nativas adecuadas al microclima.",
    "Preparación del suelo en los sectores a intervenir.",
    "Instalación y trasplante de las especies seleccionadas.",
    "Retiro de residuos vegetales generados durante el trabajo.",
  ],
  "Instalaciones Agroecológicas": [
    "Diseño de la huerta según el espacio disponible.",
    "Preparación del terreno y armado de bancales o cajones.",
    "Incorporación de compost inicial al sustrato.",
    "Plantación de plantines de temporada.",
    "Instalación de sistema de riego eficiente.",
    "Capacitación básica de uso y mantención de la huerta.",
  ],
  "Poda Especializada": [
    "Diagnóstico fitosanitario previo del árbol o arbusto.",
    "Poda técnica según el objetivo (formativa, sanitaria o de fructificación).",
    "Retiro y limpieza del material cortado.",
    "Recomendaciones de seguimiento para el cuidado posterior.",
  ],
  "Instalación de Pasto": [
    "Análisis y preparación del suelo del sector a intervenir.",
    "Nivelación del terreno.",
    "Siembra o instalación de panes de césped, según variedad acordada.",
    "Instalación de sistema de riego básico.",
    "Retiro de residuos generados durante el trabajo.",
  ],
  "Mantención Recurrente": [
    "Corte y bordes de pasto.",
    "Control de malezas en los sectores acordados.",
    "Revisión y ajuste del sistema de riego.",
    "Revisión general del estado de salud del jardín.",
    "Retiro de residuos vegetales generados durante la visita.",
  ],
  "Asesoría Técnica": [
    "Diagnóstico en terreno de la situación actual del espacio o problema planteado.",
    "Elaboración de informe técnico escrito con hallazgos.",
    "Propuesta de plan de acción.",
    "Sesión de seguimiento según lo acordado con el cliente.",
  ],
};

/** Condiciones con las que parte todo documento nuevo (editables). */
export const CONDICIONES_BASE: Condicion[] = [
  { etiqueta: "Duración estimada", texto: "una jornada de trabajo, sujeta a las condiciones efectivas encontradas durante la ejecución." },
  { etiqueta: "Pago", texto: "al término del servicio, salvo acuerdo distinto entre las partes." },
];

export const VALOR_DESCRIPCION_BASE = "Servicio completo según el alcance detallado anteriormente.";

/** Lo que dice el PDF en «ESTADO:», según el estado real de la cotización en el panel. */
export const ESTADO_EN_PDF: Record<EstadoCotizacion, string> = {
  nueva: "EN PREPARACIÓN",
  cotizada: "ENVIADA AL CLIENTE",
  aceptada: "ACEPTADA POR EL CLIENTE",
  rechazada: "NO ACEPTADA POR EL CLIENTE",
  sin_respuesta: "SIN RESPUESTA DEL CLIENTE",
};

/** Párrafo «Registro del acuerdo» del pie, también según el estado. */
export const REGISTRO_POR_ESTADO: Record<EstadoCotizacion, string> = {
  nueva: "Esta cotización se emite en formato digital y tiene una validez de 30 días desde su fecha de emisión.",
  cotizada: "Esta cotización se emite en formato digital y tiene una validez de 30 días desde su fecha de emisión.",
  aceptada: "Esta cotización corresponde al servicio ya aceptado por el cliente y se emite en formato digital para su respaldo y registro.",
  rechazada: "Esta cotización fue emitida en formato digital y no fue aceptada por el cliente. Se conserva solo como registro.",
  sin_respuesta: "Esta cotización fue emitida en formato digital y se conserva como registro. No hubo respuesta del cliente.",
};

export const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

/** Formulario inicial a partir de la cotización (o del documento ya generado, si existe). */
export function datosIniciales(c: Cotizacion, previo: DatosDocumento | null): DatosDocumento {
  if (previo) return { ...previo, condiciones: previo.condiciones.map((x) => ({ ...x })), alcance: [...previo.alcance] };
  const servicio = c.servicio && ALCANCE_POR_SERVICIO[c.servicio] ? c.servicio : "";
  return {
    cliente: c.nombre,
    ubicacion: c.comuna || "",
    superficie: "",
    titulo: servicio,
    fecha_emision: hoyISO(),
    alcance: servicio ? [...ALCANCE_POR_SERVICIO[servicio]] : [],
    valor: c.monto_cotizado,
    valor_descripcion: VALOR_DESCRIPCION_BASE,
    condiciones: CONDICIONES_BASE.map((x) => ({ ...x })),
  };
}

// ─── Formato ─────────────────────────────────────────────────────────────────

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** «16 de septiembre de 2026» a partir de YYYY-MM-DD. */
export function fechaLarga(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`;
}

export const pesosPdf = (n: number | null | undefined) => (n == null ? "—" : `$${Math.round(n).toLocaleString("es-CL")}`);

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
/** «Cotizacion_Boletus_Desmalezado.pdf»: el mismo patrón del documento de muestra. */
export function nombreArchivoPara(titulo: string): string {
  const base = sinTildes(titulo).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "Servicio";
  return `Cotizacion_Boletus_${base}.pdf`;
}

// ─── Base y archivos ─────────────────────────────────────────────────────────

const BUCKET = "documentos";

export async function listarDocumentos(cotizacionId: string): Promise<Documento[]> {
  const { data, error } = await supabase.from("documentos").select("*").eq("cotizacion_id", cotizacionId).order("creada", { ascending: false });
  if (error) throw new Error("No se pudieron leer los documentos.");
  return (data ?? []) as Documento[];
}

/** Documentos de OTRAS cotizaciones del mismo cliente (mismo teléfono o mismo nombre). */
export async function listarDocumentosDelCliente(c: Cotizacion): Promise<DocumentoDeCliente[]> {
  const tel = String(c.telefono || "").replace(/[^0-9]/g, "").slice(-8);
  const nombre = c.nombre.trim();
  let q = supabase.from("cotizaciones").select("id").neq("id", c.id);
  if (tel && nombre) q = q.or(`telefono.ilike.%${tel},nombre.ilike.${nombre.replace(/[%,()]/g, "")}`);
  else if (tel) q = q.ilike("telefono", `%${tel}`);
  else q = q.ilike("nombre", nombre.replace(/[%,()]/g, ""));
  const { data: cots, error: e1 } = await q;
  if (e1 || !cots?.length) return [];
  const { data, error } = await supabase.from("documentos")
    .select("*, cotizaciones(nombre, telefono, servicio, estado, fecha_contacto)")
    .in("cotizacion_id", cots.map((x) => x.id)).order("creada", { ascending: false });
  if (error) return [];
  return (data ?? []) as DocumentoDeCliente[];
}

/** URL firmada (2 minutos) para abrir o descargar un documento. */
export async function urlDescarga(d: Documento): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.ruta, 120, { download: d.nombre_archivo });
  if (error || !data) throw new Error("No se pudo preparar la descarga.");
  return data.signedUrl;
}

/** Guarda (o reemplaza) el documento GENERADO de una cotización. */
export async function guardarGenerado(c: Cotizacion, datos: DatosDocumento, pdf: Blob, estado: EstadoCotizacion, existente: Documento | null): Promise<Documento> {
  const ruta = existente?.ruta || `${c.id}/cotizacion-${crypto.randomUUID()}.pdf`;
  const { error: e1 } = await supabase.storage.from(BUCKET).upload(ruta, pdf, { contentType: "application/pdf", upsert: true, cacheControl: "0" });
  if (e1) throw new Error("No se pudo guardar el PDF.");
  const fila = { cotizacion_id: c.id, tipo: "generado", ruta, nombre_archivo: nombreArchivoPara(datos.titulo), titulo: datos.titulo || null, estado_al_emitir: estado, datos };
  const { data, error } = existente
    ? await supabase.from("documentos").update(fila).eq("id", existente.id).select().single()
    : await supabase.from("documentos").insert(fila).select().single();
  if (error || !data) throw new Error("El PDF se guardó pero no se pudo registrar.");
  return data as Documento;
}

/** Sube un PDF externo y lo asocia a la cotización. */
export async function subirExterno(c: Cotizacion, archivo: File, notas?: string): Promise<Documento> {
  if (archivo.type !== "application/pdf" && !/\.pdf$/i.test(archivo.name)) throw new Error("Solo se pueden subir archivos PDF.");
  if (archivo.size > 20 * 1024 * 1024) throw new Error("El archivo pesa más de 20 MB.");
  const ruta = `${c.id}/subido-${crypto.randomUUID()}.pdf`;
  const { error: e1 } = await supabase.storage.from(BUCKET).upload(ruta, archivo, { contentType: "application/pdf", cacheControl: "0" });
  if (e1) throw new Error("No se pudo subir el archivo.");
  const nombre = archivo.name.replace(/[^\w.\-() áéíóúñÁÉÍÓÚÑ]/g, "").trim() || "documento.pdf";
  const { data, error } = await supabase.from("documentos")
    .insert({ cotizacion_id: c.id, tipo: "subido", ruta, nombre_archivo: nombre, titulo: nombre.replace(/\.pdf$/i, ""), estado_al_emitir: c.estado, datos: null, notas: notas || null })
    .select().single();
  if (error || !data) throw new Error("El archivo se subió pero no se pudo registrar.");
  return data as Documento;
}

export async function borrarDocumento(d: Documento): Promise<void> {
  await supabase.storage.from(BUCKET).remove([d.ruta]);
  const { error } = await supabase.from("documentos").delete().eq("id", d.id);
  if (error) throw new Error("No se pudo borrar el documento.");
}
