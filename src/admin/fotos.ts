import { supabase } from "./supabase";

/*
 * SUBIDA DE FOTOS AL SITIO (bucket público `publico`).
 *
 * Las fotos del celular pesan 4-8 MB y tardarían en cargar en el sitio: antes de
 * subir se achican en el navegador (lado mayor 1600 px, JPEG ~82 %), lo que deja
 * cada una en unos cientos de KB sin que se note en pantalla.
 */

const LADO_MAX = 1600;

async function achicar(archivo: File): Promise<Blob> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error("No se pudo leer la imagen")); i.src = url;
    });
    const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * escala), h = Math.round(img.naturalHeight * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo comprimir"))), "image/jpeg", 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sube una foto y devuelve su URL pública. `carpeta`: portafolio | equipo | sitio. */
export async function subirFoto(archivo: File, carpeta: string): Promise<string> {
  if (!/^image\//.test(archivo.type)) throw new Error("El archivo no es una imagen.");
  const blob = await achicar(archivo);
  const ruta = `${carpeta}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("publico").upload(ruta, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("No se pudo subir la foto.");
  return supabase.storage.from("publico").getPublicUrl(ruta).data.publicUrl;
}

/** Borra una foto NUESTRA (del bucket) cuando se reemplaza o se quita; las externas no se tocan. */
export async function borrarFoto(url: string | null | undefined): Promise<void> {
  const m = String(url || "").match(/\/storage\/v1\/object\/public\/publico\/(.+)$/);
  if (m) await supabase.storage.from("publico").remove([decodeURIComponent(m[1])]);
}

/** ¿Es una foto de banco de imágenes (de las que venían en el sitio original)? */
export const esDeBanco = (url: string | null | undefined) => /images\.unsplash\.com/.test(String(url || ""));
