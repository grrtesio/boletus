// Después de `vite build`: genera el HTML inicial de cada sección con su propio título,
// descripción, canonical y Open Graph (dist/<seccion>.html, servido en /<seccion> por cleanUrls),
// el sitemap completo y una página 404 real. Así Google indexa cada sección por separado.
import { readFileSync, writeFileSync } from "node:fs";

const SEO = JSON.parse(readFileSync(new URL("../src/app/seo-rutas.json", import.meta.url), "utf8"));
const base = readFileSync("dist/index.html", "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function conSeo(html, m, url) {
  const reemplazos = [
    [/<title>[^<]*<\/title>/, `<title>${esc(m.titulo)}</title>`],
    [/(<meta name="description" content=")[^"]*(")/, `$1${esc(m.descripcion)}$2`],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(m.titulo)}$2`],
    [/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(m.descripcion)}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(m.titulo)}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(m.descripcion)}$2`],
  ];
  let out = html;
  for (const [re, val] of reemplazos) {
    if (!re.test(out)) throw new Error(`prerender-seo: no encontré ${re} en index.html`);
    out = out.replace(re, val);
  }
  return out;
}

const hoy = new Date().toISOString().slice(0, 10);
const urls = [];
for (const [clave, m] of Object.entries(SEO.rutas)) {
  const url = SEO.sitio + (m.ruta === "/" ? "/" : m.ruta);
  urls.push({ url, prioridad: m.prioridad });
  const html = conSeo(base, m, url);
  if (clave === "home") writeFileSync("dist/index.html", html);
  else writeFileSync(`dist${m.ruta}.html`, html);
}

writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url>\n    <loc>${u.url}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.prioridad}</priority>\n  </url>`).join("\n") +
    `\n</urlset>\n`,
);

writeFileSync(
  "dist/404.html",
  `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Página no encontrada | Boletus</title>
<meta name="robots" content="noindex" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#172e21;color:#f4efe6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px}a{display:inline-block;margin-top:20px;padding:12px 22px;border-radius:999px;background:#f4efe6;color:#172e21;font-weight:700;text-decoration:none}h1{font-family:Georgia,serif;font-size:32px;margin:12px 0 8px}p{opacity:.8;margin:0}</style>
</head>
<body><main>
<img src="/logo-boletus-dark.svg" alt="Boletus" width="160" onerror="this.remove()" />
<h1>Esta página no existe</h1>
<p>Puede que la dirección esté mal escrita o que la página se haya movido.</p>
<a href="/">Ir al inicio</a>
</main></body>
</html>
`,
);
console.log(`prerender-seo: ${urls.length} secciones, sitemap y 404 listos`);
