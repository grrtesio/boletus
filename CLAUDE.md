# CLAUDE.md — Instrucciones para Claude Code en el sitio de Boletus

¡Hola! Trabajas para Benjamín en `boletus.cl`. Este archivo lo lees al inicio de cada sesión: son las reglas del juego para que puedas ayudarlo a editar el sitio sin romperlo.

## Qué es este proyecto

Sitio web comercial de **Boletus** en `boletus.cl`. React + Vite + TypeScript, componentes MUI + Radix + shadcn. Se despliega automáticamente en Vercel: la rama `main` publica en producción; cualquier otra rama con un PR abierto genera una preview URL propia.

## Tono al hablar con Benjamín

- Español neutro/chileno, formal pero simpático. Nada de voseo argentino ("descargá", "entrá", "mirá" → usar "descarga", "entra", "mira").
- Explica lo que haces en pocas palabras: qué archivo tocaste y qué cambia visualmente. Nada de tecnicismos innecesarios.
- Si algo no queda claro en el pedido, pregunta antes de asumir.

## Reglas duras (no negociables)

1. **NUNCA subas cambios a `main` directo.** Trabaja siempre en una rama nueva `feat/<descripcion-corta>` (ej. `feat/hero-nuevo-titulo`) y abre un **Pull Request** apuntando a `main`. Gonzalo (el papá de Benjamín) es quien aprueba y mergea.
2. **NUNCA entregues claves, tokens ni credenciales** por chat, ni las pongas en el código. Si necesitás una API key para algo, díselo a Benjamín para que se lo pida a Gonzalo.
3. Si un cambio requiere agregar/actualizar dependencias (`package.json`), tocar `vite.config.ts`, `tsconfig.json`, archivos `.env*` o algo en `api/`, **pide confirmación explícita a Benjamín** antes de hacerlo. Cambios de texto, colores, layout, imágenes, componentes visuales → adelante sin trámite.
4. **Antes de commitear**, corre:
   - `pnpm typecheck` (que no queden errores de TypeScript)
   - `pnpm build` (que compile limpio)
   Si alguno falla, arréglalo o revierte antes de abrir el PR.

## Cómo hacer un cambio típico

1. Escucha el pedido de Benjamín.
2. Ubica el archivo (casi todo vive en `src/app/`).
3. Crea la rama: `git checkout -b feat/<nombre>`
4. Haz el cambio.
5. Corre `pnpm typecheck && pnpm build`.
6. Commit con mensaje corto en español ("hero: cambiar título a X", "contacto: agregar horario").
7. Push + abrir PR a `main` con descripción de qué cambia y por qué.
8. Cuéntale a Benjamín el link del PR y el link de la preview de Vercel (aparece como comentario automático en el PR).

## Estilo del sitio

- Marca **Boletus**. Logo, favicon (hongo) y paleta ya están definidos.
- Contenido en español (Chile).
- Contacto oficial: `contacto@boletus.cl` y WhatsApp `+56 9 5008 1548` — si te piden cambiarlos, confírmalo dos veces con Benjamín.

## Instalación y comandos

Este repo usa **pnpm**, no npm. Correr `npm install` genera un `package-lock.json`
que convive mal con el `pnpm-lock.yaml` y termina instalando versiones distintas.

```
pnpm install      # una vez, o cuando cambien las dependencias
pnpm dev          # servidor local
pnpm typecheck    # revisa tipos — tiene que dar 0 errores
pnpm build        # compila para producción
```

## Estructura

- `src/app/App.tsx` — punto de entrada de la app
- `src/app/components/` — componentes del sitio
- `src/app/components/ui/` — primitivos de UI (shadcn) — evita editarlos salvo que Benjamín lo pida específicamente
- `src/app/components/figma/` — piezas exportadas de Figma
- `src/styles/` — estilos globales
- `public/` — assets estáticos (favicon, imágenes, `robots.txt`, `sitemap.xml`)
- `api/` — endpoints serverless (por ejemplo el formulario de contacto). Tratar con cuidado.

## Cuando no sepas algo

Pregúntale a Benjamín en español simple. Es mejor una pregunta más que un cambio que hay que revertir. Y si algo huele a que puede romper el sitio o exponer datos, **párate y consulta antes de seguir**.

¡A trabajar!
