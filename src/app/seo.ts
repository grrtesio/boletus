import SEO from "./seo-rutas.json";

/**
 * SEO por página. Al navegar dentro de la SPA se actualizan título, descripción, canonical y
 * Open Graph, para que cada sección tenga su identidad. El HTML inicial de cada ruta lo genera
 * scripts/prerender-seo.mjs en el build (así Google ve la versión correcta sin ejecutar JS).
 */
type Pagina = keyof typeof SEO.rutas;

function setMeta(selector: string, attr: "content" | "href", valor: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, valor);
}

export function aplicarSeo(pagina: string) {
  const m = SEO.rutas[pagina as Pagina] ?? SEO.rutas.home;
  const url = SEO.sitio + (m.ruta === "/" ? "/" : m.ruta);
  document.title = m.titulo;
  setMeta('meta[name="description"]', "content", m.descripcion);
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:title"]', "content", m.titulo);
  setMeta('meta[property="og:description"]', "content", m.descripcion);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[name="twitter:title"]', "content", m.titulo);
  setMeta('meta[name="twitter:description"]', "content", m.descripcion);
}
