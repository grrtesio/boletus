import { useState, useEffect, useRef } from "react";
import { aplicarSeo } from "./seo";
import { usePortafolio, useEquipo, useAjuste, type ItemPortafolio, type Persona } from "./contenido";
import {
  Menu, X, Phone, Mail, MapPin, Clock, MessageCircle, Leaf,
  Droplets, Scissors, Star, ArrowRight, LogOut, Home, Search,
  CheckCircle, Package, Users, BarChart3, Eye, Edit2, Plus,
  TrendingUp, Award, ChevronDown, Sprout, Sun, Filter, X as XIcon,
  ChevronRight, Trash2, ShieldCheck
} from "lucide-react";

type PublicPage = "home" | "servicios" | "productos" | "portafolio" | "nosotros" | "contacto";

// El sitio es una SPA con estado en memoria; sin sincronizar con la History
// API, el botón "atrás" del navegador salta a la página anterior a boletus.cl
// (o queda en blanco). Estas dos funciones son la traducción página↔URL.
const RUTAS: Record<PublicPage, string> = { home: "/", servicios: "/servicios", productos: "/productos", portafolio: "/portafolio", nosotros: "/nosotros", contacto: "/contacto" };
function pathAPagina(path: string): PublicPage {
  const p = (path || "/").toLowerCase();
  const entry = (Object.entries(RUTAS) as [PublicPage, string][]).find(([, ruta]) => ruta === p);
  return entry ? entry[0] : "home";
}
type PortfolioCategory = "todos" | "pasto" | "paisajismo" | "huertas" | "poda";

/* Respaldo: lo que se muestra si la base no contesta. El contenido real se edita en /admin. */
const PORTFOLIO_ITEMS: ItemPortafolio[] = [
  // Fotos reales en public/portafolio/ (6-oct-2026). PENDIENTES: «pasto antes» (iría primera en Recreo) y «poda 1» (primera en Peñablanca).
  { id: 1, categoria: "pasto", titulo: "Casa particular — Recreo", fotos: ["/portafolio/pasto-3.jpg", "/portafolio/pasto-despues.jpg"], desc: "Instalación de 10 m² de pasto con preparación de suelo incluido." },
  { id: 2, categoria: "poda", titulo: "Casa particular — Quilpué", fotos: ["/portafolio/poda-esp.jpg"], desc: "Poda especializada de saneamiento en cerco vivo." },
  // Huertas va como GALERÍA y no como antes/después: son bancales instalados y llenos,
  // no la transformación de un terreno. Un "antes" acá no dice nada.
  { id: 3, categoria: "huertas", titulo: "Huerta familiar — Concón", fotos: ["/portafolio/bancal-pequeno.jpg", "/portafolio/bancales-varios.jpg", "/portafolio/bancal-escalonado.jpg"], desc: "Huerta agroecológica con bancales y compostaje, pensada para producir todo el año en un patio de casa." },
  { id: 4, categoria: "poda", titulo: "Poda de cerco perimetral de parcela — Peñablanca", fotos: ["/portafolio/poda-2.jpg"], desc: "Poda de mantención del cerco perimetral: se rebaja la altura, se empareja la línea y se retira el material cortado." },
  { id: 5, categoria: "huertas", titulo: "Huerta familiar — Peñablanca", fotos: ["/portafolio/bancal-profundo.jpg"], desc: "Huerta agroecológica con bancales profundos, compostaje y riego por goteo, pensada para producir todo el año en una parcela." },
];

// ─── Shared UI ───────────────────────────────────────────────────────────────

function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/56950081548?text=Hola%20BOLETUS%2C%20quisiera%20cotizar%20un%20proyecto"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25d366] text-white rounded-full shadow-2xl px-4 py-3 hover:bg-[#1ebe5d] transition-all duration-300 hover:scale-105 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="text-sm font-medium hidden sm:block whitespace-nowrap">Cotiza ahora</span>
    </a>
  );
}

// ─── Public Navbar ────────────────────────────────────────────────────────────

function Navbar({
  currentPage,
  onNavigate,
}: {
  currentPage: PublicPage;
  onNavigate: (p: PublicPage) => void;
}) {
  const [open, setOpen] = useState(false);
  const links: { id: PublicPage; label: string }[] = [
    { id: "home", label: "Inicio" },
    { id: "servicios", label: "Servicios" },
    { id: "productos", label: "Productos" },
    { id: "portafolio", label: "Portafolio" },
    { id: "nosotros", label: "Nosotros" },
    { id: "contacto", label: "Contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 group">
          <img src="/logo-boletus.svg" alt="Boletus" className="h-10 w-auto" />
        </button>

        <ul className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => onNavigate(l.id)}
                className={`text-sm font-medium transition-colors ${
                  currentPage === l.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onNavigate("contacto")}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors rounded-sm"
          >
            Cotiza tu proyecto
          </button>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-border px-4 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => { onNavigate(l.id); setOpen(false); }}
              className={`text-left text-sm py-2 font-medium ${currentPage === l.id ? "text-primary" : "text-foreground"}`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => { onNavigate("contacto"); setOpen(false); }}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-sm text-center mt-2"
          >
            Cotiza tu proyecto
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

function HomePage({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  const portafolio = usePortafolio(PORTFOLIO_ITEMS);
  // Los tres de la portada tienen que existir en la página de Servicios y
  // llamarse igual: antes acá aparecía «Riego Tecnificado», que no es un
  // servicio del sitio, y «Paisajismo Agroecológico», que allá se llama
  // «Paisajismo y Diseño». Van en el mismo orden que la página de Servicios.
  const services = [
    { icon: Leaf, title: "Paisajismo y Diseño", desc: "Diseñamos con plantas nativas que resisten el clima local y requieren menos agua." },
    { icon: Sun, title: "Instalaciones Agroecológicas", desc: "Huertas productivas en espacios chicos o grandes, con compostaje y riego eficiente." },
    { icon: Sprout, title: "Instalación de Pasto", desc: "Preparamos el suelo correctamente para que tu pasto dure años, no meses." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-foreground">
          <img
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&h=900&fit=crop&auto=format"
            alt="Jardín agroecológico profesional Villa Alemana"
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <p className="text-accent text-sm font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Villa Alemana · Región de Valparaíso · Chile
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-2xl mb-6"
          >
            Jardinería Agroecológica Profesional
          </h1>
          <p className="text-white/80 text-lg max-w-xl mb-8 leading-relaxed">
            Ingenieros agrónomos especializados en paisajismo, instalación de pasto y huertas agroecológicas en la Región de Valparaíso.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/56950081548?text=Hola%20BOLETUS%2C%20quisiera%20cotizar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-semibold hover:bg-accent/90 transition-colors rounded-sm text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Cotizar por WhatsApp
            </a>
            <button
              onClick={() => onNavigate("portafolio")}
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-6 py-3 font-medium hover:bg-white/10 transition-colors rounded-sm text-sm"
            >
              Ver nuestros proyectos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: "+80", label: "proyectos diversos" },
            { num: "2", label: "años de experiencia" },
            { num: "2", label: "ingenieros agrónomos" },
            { num: "100%", label: "enfoque agroecológico" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-accent mb-1">
                {s.num}
              </div>
              <div className="text-xs text-primary-foreground/70 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services preview */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Nuestros servicios
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-4xl font-bold text-foreground max-w-lg">
              Expertos en cada etapa de tu jardín
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="group p-6 border border-border bg-card hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 bg-secondary rounded-sm flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                  <s.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate("servicios")}
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all text-sm"
            >
              Ver todos los servicios <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Portfolio before/after */}
      <section className="py-20 bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                Portafolio
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-4xl font-bold text-foreground">
                Transformaciones reales
              </h2>
            </div>
            <button
              onClick={() => onNavigate("portafolio")}
              className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              Ver galería completa
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {(() => {
              // Los marcados «en la portada» en /admin; si no hay, los dos primeros.
              if (!portafolio) return [0, 1].map((n) => <div key={n} className="h-72 border border-border bg-muted animate-pulse" />);
              const marcados = portafolio.filter((p) => p.enInicio);
              return (marcados.length ? marcados : portafolio).slice(0, 2).map((item) => <BeforeAfterCard key={item.id} item={item} />);
            })()}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-accent text-accent" />
            ))}
          </div>
          <blockquote
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-xl md:text-2xl text-foreground italic leading-relaxed mb-8"
          >
            "Trabajo con explicaciones de manejos de una forma clara, prolija y profesional, además, generan opciones en base a mis necesidades, gustos y espacio de jardines."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-primary">EA</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">Eugenio Asenjo</div>
              <div className="text-xs text-muted-foreground">Quilpué</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              ¿Listo para transformar tu espacio verde?
            </h2>
            <p className="text-primary-foreground/70 text-sm">Cotización sin compromiso · Respuesta en menos de 24 horas</p>
          </div>
          <a
            href="https://wa.me/56950081548?text=Hola%20BOLETUS%2C%20quiero%20una%20cotización"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-semibold hover:bg-accent/90 transition-colors rounded-sm text-sm whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

// ─── Before / After Card ──────────────────────────────────────────────────────

/**
 * Tarjeta del portafolio. Dos modos, y el trabajo decide cuál:
 *
 *  · ANTES / DESPUÉS cuando lo que se muestra es una transformación —un pasto que no
 *    existía, un cerco desbordado que se emparejó—. Ahí el "antes" es media historia.
 *  · GALERÍA (`fotos`) cuando el trabajo es una instalación: bancales puestos y llenos.
 *    Un "antes" de un patio vacío no dice nada, y forzarlo obliga a inventar una foto.
 */
function BeforeAfterCard({ item }: { item: ItemPortafolio }) {
  const [showAfter, setShowAfter] = useState(false);
  const fotos = item.fotos ?? null;
  const [i, setI] = useState(0);

  return (
    <div className="group overflow-hidden border border-border bg-card">
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={fotos ? fotos[i] : showAfter ? item.after : item.before}
          alt={fotos ? `${item.titulo} — foto ${i + 1}` : `${showAfter ? "Después" : "Antes"} — ${item.titulo}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {fotos ? fotos.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              aria-label={`Foto ${n + 1}`}
              className={`w-6 h-6 text-xs font-medium rounded-sm transition-colors ${n === i ? "bg-accent text-accent-foreground" : "bg-black/40 text-white hover:bg-black/60"}`}
            >
              {n + 1}
            </button>
          )) : <>
          <button
            onClick={() => setShowAfter(false)}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${!showAfter ? "bg-foreground text-background" : "bg-black/40 text-white hover:bg-black/60"}`}
          >
            Antes
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${showAfter ? "bg-accent text-accent-foreground" : "bg-black/40 text-white hover:bg-black/60"}`}
          >
            Después
          </button>
          </>}
        </div>
        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-sm capitalize">
          {item.categoria}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm mb-1">{item.titulo}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
      </div>
    </div>
  );
}

// ─── Services Page ────────────────────────────────────────────────────────────

function ServicesPage({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  const services = [
    {
      icon: Leaf,
      title: "Paisajismo y Diseño",
      desc: "Diseñamos espacios verdes en Villa Alemana, Quilpué y Valparaíso con metodología agroecológica comprobada. Priorizamos plantas nativas del litoral central que toleran la sequía y aportan biodiversidad local.",
      price: "Presupuesto según proyecto",
      includes: ["Diseño en plano 2D", "Selección de especies", "Instalación y trasplante"],
      img: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Sun,
      title: "Instalaciones Agroecológicas",
      desc: "Implementamos huertas productivas en espacios pequeños o grandes, con técnicas de compostaje, biodiversidad funcional y riego eficiente.",
      price: "Presupuesto según proyecto",
      includes: ["Diseño de la huerta", "Compostaje inicial", "Plantines de temporada", "Invernadero", "Capacitación de uso"],
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Scissors,
      title: "Poda Especializada",
      desc: "Realizamos podas formativas, sanitarias y de fructificación con criterio agronómico. Nuestro enfoque preserva la salud del árbol mientras mejora su forma y producción.",
      price: "Desde $15.000/hora",
      includes: ["Diagnóstico fitosanitario", "Poda técnica especializada", "Retiro de material", "Recomendaciones de seguimiento"],
      img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Sprout,
      title: "Instalación de Pasto",
      desc: "Preparamos y nivelamos el suelo, seleccionamos la variedad de césped más adecuada para tu microclima e instalamos sistemas de riego para garantizar un resultado duradero en casas y parcelas de Villa Alemana, Quilpué y Valparaíso.",
      price: "Desde $35.000/m²",
      includes: ["Análisis de suelo", "Nivelación y preparación", "Siembra o tapizado", "Sistema de riego básico"],
      img: "/instalacion-pasto.jpg",
    },
    {
      icon: Droplets,
      title: "Mantención Recurrente",
      desc: "Planes mensuales o quincenales para jardines de Villa Alemana, Quilpué y alrededores. Incluye corte de pasto, control de malezas, riego y revisión general de la salud del jardín.",
      price: "Planes desde $80.000/mes",
      includes: ["Corte y bordes de pasto", "Control de malezas", "Revisión de riego"],
      img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Award,
      title: "Asesoría Técnica",
      desc: "Consultoría profesional para proyectos agroecológicos, diseño de espacios productivos o resolución de problemas fitosanitarios en jardines y huertos.",
      price: "Desde $60.000/hora",
      includes: ["Diagnóstico en terreno", "Informe técnico escrito", "Plan de acción", "Seguimiento"],
      img: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&h=380&fit=crop&auto=format",
    },
  ];

  return (
    <div className="pt-16">
      <div className="bg-primary py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Lo que hacemos
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-5xl font-bold text-primary-foreground max-w-xl leading-tight">
            Servicios de Jardinería Profesional
          </h1>
          <p className="text-primary-foreground/70 mt-4 max-w-xl text-sm">
            Como ingenieros agrónomos, ofrecemos servicios de jardinería profesional adaptados a cada etapa de tu proyecto.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid gap-8">
        {services.map((s, i) => (
          <div key={s.title} className={`grid md:grid-cols-2 gap-0 border border-border overflow-hidden bg-card ${i % 2 === 1 ? "md:[&>*:first-child]:order-last" : ""}`}>
            <div className="h-56 md:h-auto bg-muted overflow-hidden">
              <img src={s.img} alt={s.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-secondary flex items-center justify-center rounded-sm">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground">{s.title}</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{s.desc}</p>
              <ul className="space-y-1.5 mb-6">
                {s.includes.map((inc) => (
                  <li key={inc} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    {inc}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{s.price}</span>
                <button
                  onClick={() => onNavigate("contacto")}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Products Page ────────────────────────────────────────────────────────────

/**
 * Productos: lo que Boletus VENDE, a diferencia de Servicios, que es lo que HACE.
 *
 * Comparte la misma maqueta que ServicesPage —tarjetas alternadas, foto a un
 * lado, texto al otro— a propósito: son dos caras del mismo negocio y deben
 * leerse como hermanas, no como dos sitios distintos.
 *
 * PENDIENTE: las fotos y los precios son provisionales. Las imágenes apuntan a
 * Unsplash para poder ver la maqueta; las definitivas van en `public/productos/`
 * y basta cambiar el campo `img` de cada uno. Los precios dicen «Consultar»
 * hasta que Gonzalo confirme las cifras — inventar un precio en un sitio
 * comercial es peor que no ponerlo.
 */
function ProductsPage({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  const products = [
    {
      icon: Package,
      title: "Cajón Pequeño",
      desc: "El formato de entrada para partir con una huerta en casa. Ideal para terrazas, patios chicos o para probar antes de comprometerse con algo mayor. Madera tratada y medidas pensadas para llegar cómodo al centro sin pisar la tierra.",
      price: "Consultar precio",
      includes: ["Madera tratada para exterior", "Armado incluido", "Listo para llenar con sustrato", "Medida compacta para terraza"],
      img: "/bancal-pequeno.jpg",
    },
    {
      icon: Leaf,
      title: "Bancal Profundo",
      desc: "El mismo bancal, con el doble de tierra. Esa profundidad es la que permite zanahoria, betarraga o papa —raíces que en un bancal bajo se topan con el fondo— y hace que el riego dure más, porque la humedad se guarda abajo en vez de evaporarse. Se puede llevar armado o con instalación completa en terreno.",
      price: "Consultar precio · con o sin instalación",
      includes: ["Profundidad para raíz larga", "Opción con instalación en terreno", "Mejor retención de humedad", "Estructura reforzada"],
      img: "/bancal-profundo.jpg",
    },
    {
      icon: Sun,
      title: "Bancal en Altura",
      desc: "Elevado a la altura de la cintura, para trabajar de pie y sin agacharse. Pensado para adultos mayores, personas con movilidad reducida o para quien simplemente quiere cuidar la espalda mientras cultiva.",
      price: "Consultar precio",
      includes: ["Altura de trabajo de pie", "Accesible en silla de ruedas", "Base y patas reforzadas", "Armado e instalación"],
      img: "/bancales-varios.jpg",
    },
    {
      icon: Sprout,
      title: "Sustrato Premium",
      desc: "Sustrato listo para cultivo: tierra de hoja, perlita, compost y fibra de coco. La mezcla que usamos en nuestros propios bancales — retiene humedad sin encharcarse y deja la raíz respirar desde el primer día.",
      price: "Consultar precio",
      includes: ["Tierra de hoja", "Perlita", "Compost", "Fibra de coco"],
      img: "/sustrato.jpg",
    },
  ];

  return (
    <div className="pt-16">
      <div className="bg-primary py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Lo que vendemos
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-5xl font-bold text-primary-foreground max-w-xl leading-tight">
            Bancales y Cajones para tu Huerta
          </h1>
          <p className="text-primary-foreground/70 mt-4 max-w-xl text-sm">
            Fabricados por nosotros en Villa Alemana, con madera tratada para exterior y medidas pensadas para que cultivar sea cómodo. Y el sustrato con el que los llenamos, listo para plantar. Si buscas una cama de cultivo, un huerto urbano o un bancal elevado para tu patio o terraza, estos son nuestros modelos, con despacho a Quilpué, Valparaíso y el resto de la región.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid gap-8">
        {products.map((p, i) => (
          <div key={p.title} className={`grid md:grid-cols-2 gap-0 border border-border overflow-hidden bg-card ${i % 2 === 1 ? "md:[&>*:first-child]:order-last" : ""}`}>
            <div className="h-56 md:h-auto bg-muted overflow-hidden">
              <img src={p.img} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-secondary flex items-center justify-center rounded-sm">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground">{p.title}</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{p.desc}</p>
              <ul className="space-y-1.5 mb-6">
                {p.includes.map((inc) => (
                  <li key={inc} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    {inc}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{p.price}</span>
                <button
                  onClick={() => onNavigate("contacto")}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Solicitar cotización <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Portfolio Page ───────────────────────────────────────────────────────────

function PortfolioPage() {
  const [cat, setCat] = useState<PortfolioCategory>("todos");
  const cats: { id: PortfolioCategory; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "pasto", label: "Pasto" },
    { id: "paisajismo", label: "Paisajismo" },
    { id: "huertas", label: "Huertas" },
    { id: "poda", label: "Poda" },
  ];
  const portafolio = usePortafolio(PORTFOLIO_ITEMS);
  const todos = portafolio ?? [];
  const filtered = cat === "todos" ? todos : todos.filter((p) => p.categoria === cat);

  return (
    <div className="pt-16">
      <div className="bg-primary py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Galería de proyectos
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-5xl font-bold text-primary-foreground">
            Transformaciones Reales
          </h1>
          <p className="text-primary-foreground/70 mt-4 max-w-xl text-sm">
            Cada proyecto es una historia de antes y después. Fotografías tomadas en terreno por nuestro equipo.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex gap-2 flex-wrap mb-10">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-4 py-2 text-xs font-medium rounded-sm border transition-colors ${
                cat === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <BeforeAfterCard key={item.id} item={item} />
          ))}
        </div>

        {!portafolio && (
          <div className="grid sm:grid-cols-2 gap-6">{[0, 1].map((n) => <div key={n} className="h-72 border border-border bg-muted animate-pulse" />)}</div>
        )}
        {portafolio && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No hay proyectos en esta categoría aún.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────

/* Respaldo de «Quiénes somos» si la base no contesta. Se edita en /admin. */
const EQUIPO_RESPALDO: Persona[] = [
  { id: "mauricio", nombre: "Mauricio Espinoza", cargo: "Ingeniero Agrónomo · Especialista en Huertas y Hortalizas", foto: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&h=400&fit=crop&auto=format",
    bio: "Experiencia en manejo de viveros, proyección de manejos técnicos en regiones. Especializado en el uso de técnicas agrícolas para la producción de especies vegetales con sistemas hídricos eficientes." },
  { id: "benjamin", nombre: "Benjamín Reyes", cargo: "Ingeniero Agrónomo · Especialista en Medioambiente y Suelos", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop&auto=format",
    bio: "Especialista en manejos ambientales, compostaje, saneamiento de suelos y biodiversidad funcional, con técnicas de manejo a gran y pequeña escala, integrando especies vegetales nativas y dinámicas entomológicas." },
];
const CABECERA_RESPALDO = "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&h=700&fit=crop&auto=format";

function AboutPage({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  const equipo = useEquipo(EQUIPO_RESPALDO);
  const cabecera = useAjuste("nosotros_cabecera", CABECERA_RESPALDO);
  const values = [
    { icon: Leaf, title: "Plantas nativas", desc: "Preferimos especies locales del litoral central porque resisten mejor el clima de la Región de Valparaíso y consumen menos agua." },
    { icon: Droplets, title: "Riego eficiente", desc: "Diseñamos sistemas de riego tecnificado que reducen el consumo hídrico hasta en un 60% respecto al riego manual." },
    { icon: ShieldCheck, title: "Sin agroquímicos", desc: "Aplicamos agroecología real: control biológico, compostaje y biodiversidad funcional en lugar de pesticidas." },
  ];

  return (
    <div className="pt-16">
      <div className="bg-foreground py-24 px-4 sm:px-6 relative overflow-hidden">
        {cabecera && <img
          src={cabecera}
          alt="Equipo Boletus en terreno"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />}
        <div className="relative max-w-6xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Nuestro equipo
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Dos ingenieros agrónomos. Una visión agroecológica.
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {!equipo && [0, 1].map((n) => <div key={n} className="h-96 border border-border bg-muted animate-pulse" />)}
          {(equipo ?? []).map((p, n) => {
            const Icono = n % 2 === 0 ? Leaf : Sprout;
            return (
              <div key={p.id} className="border border-border bg-card overflow-hidden group">
                <div className="h-64 bg-muted overflow-hidden">
                  {p.foto && <img
                    src={p.foto}
                    alt={[p.nombre, p.cargo].filter(Boolean).join(" — ")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    // Retratos: el recuadro es ancho y bajo, y centrado cortaba la cabeza.
                    style={{ objectPosition: "50% 35%" }}
                  />}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground">{p.nombre}</h2>
                      {p.cargo && <p className="text-xs text-accent" style={{ fontFamily: "'DM Mono', monospace" }}>{p.cargo}</p>}
                    </div>
                    <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
                      <Icono className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  {p.bio && <p className="text-sm text-muted-foreground leading-relaxed">{p.bio}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-secondary/40 p-8 md:p-12 mb-12">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Nuestra filosofía
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-sm text-muted-foreground leading-relaxed">
            <p>
              Creemos que un jardín bien diseñado no debería requerir grandes cantidades de agua, pesticidas o mantención constante. La agroecología nos enseña a trabajar con la naturaleza, no en su contra.
            </p>
            <p>
              Trabajamos en terreno en Villa Alemana, Quilpué y el resto de la Región de Valparaíso, y conocemos su clima. Por eso elegimos plantas nativas: llevan miles de años adaptadas a nuestras condiciones de sequía estival y lluvia invernal. Simplemente funcionan mejor.
            </p>
            <p>
              Nuestro objetivo no es hacer jardines bonitos por temporada. Queremos diseñar espacios verdes que mejoren con el tiempo, que sean más resistentes cada año y que sus dueños puedan disfrutar sin preocupaciones.
            </p>
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-foreground mb-8">
            Por qué elegirnos
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="w-9 h-9 bg-primary rounded-sm flex items-center justify-center flex-shrink-0">
                  <v.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{v.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────

function ContactPage() {
  const [form, setForm] = useState({ nombre: "", telefono: "", servicio: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const servicios = ["Paisajismo y Diseño", "Instalaciones Agroecológicas", "Poda Especializada", "Instalación de Pasto", "Mantención Recurrente", "Asesoría Técnica"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErrorEnvio("");
    try {
      const r = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "error");
      setForm({ nombre: "", telefono: "", servicio: "", mensaje: "" });
      setSent(true);
    } catch {
      setErrorEnvio("No pudimos enviar tu consulta. Intenta de nuevo o escríbenos por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pt-16">
      <div className="bg-primary py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Contáctanos
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-5xl font-bold text-primary-foreground">
            Cotiza tu Proyecto
          </h1>
          <p className="text-primary-foreground/70 mt-4 text-sm">Respuesta en menos de 24 horas hábiles.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border bg-card">
              <CheckCircle className="w-12 h-12 text-accent mb-4" />
              <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground mb-2">¡Mensaje recibido!</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Mauricio o Benjamín te contactarán dentro de las próximas 24 horas hábiles.
              </p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm text-primary underline underline-offset-4">
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nombre completo *</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="María González"
                  className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Teléfono *</label>
                <input
                  required
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+56 9 5008 1548"
                  className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Servicio de interés *</label>
                <select
                  required
                  value={form.servicio}
                  onChange={(e) => setForm({ ...form, servicio: e.target.value })}
                  className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors rounded-sm appearance-none"
                >
                  <option value="">Selecciona un servicio</option>
                  {servicios.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Mensaje</label>
                <textarea
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  rows={4}
                  placeholder="Describe brevemente tu proyecto o lo que necesitas..."
                  className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-sm resize-none"
                />
              </div>
              {errorEnvio && (
                <p className="text-sm text-red-600">{errorEnvio}</p>
              )}
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-primary text-primary-foreground py-3 font-semibold text-sm hover:bg-primary/90 transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? "Enviando…" : "Enviar consulta"}
              </button>
            </form>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-semibold text-foreground mb-4">
              Información de contacto
            </h2>
            <div className="space-y-4">
              {[
                { icon: Phone, label: "+56 9 5008 1548", sub: "Benjamín (directo)" },
                { icon: Phone, label: "+56 9 7598 2205", sub: "Mauricio (directo)" },
                { icon: Mail, label: "contacto@boletus.cl", sub: "Respuesta en 24 hrs" },
                { icon: MapPin, label: "Villa Alemana, Región de Valparaíso", sub: "Servicio toda la región" },
                { icon: Clock, label: "Lunes a Viernes · 8:00–18:00", sub: "Sábados hasta las 13:00" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    <c.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-5">
            <p className="text-xs font-medium text-foreground mb-3">O escríbenos directo por WhatsApp</p>
            <a
              href="https://wa.me/56950081548?text=Hola%20BOLETUS%2C%20quisiera%20cotizar%20un%20proyecto"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25d366] text-white py-3 text-sm font-semibold rounded-sm hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </a>
          </div>

          {/* Mapa embebido de Google sin clave de API: la URL pública con output=embed basta para un punto. */}
          <div className="h-56 bg-muted rounded-sm overflow-hidden border border-border">
            <iframe
              title="Mapa de Villa Alemana, Región de Valparaíso"
              src="https://www.google.com/maps?q=Villa+Alemana,+Regi%C3%B3n+de+Valpara%C3%ADso,+Chile&z=12&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  return (
    <footer className="bg-foreground text-white/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo-boletus-dark.svg" alt="Boletus" className="h-12 w-auto" />
          </div>
          <p className="text-xs leading-relaxed">
            Jardinería agroecológica profesional en Villa Alemana y Región de Valparaíso. Ingenieros agrónomos comprometidos con el paisajismo sostenible.
          </p>
        </div>
        <div>
          <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Servicios</h3>
          <ul className="space-y-2">
            {["Paisajismo y Diseño", "Instalaciones Agroecológicas", "Poda Especializada", "Instalación de Pasto", "Mantención Recurrente"].map((s) => (
              <li key={s}>
                <button onClick={() => onNavigate("servicios")} className="text-xs hover:text-white transition-colors">{s}</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Contacto</h3>
          <ul className="space-y-2 text-xs">
            <li>+56 9 5008 1548</li>
            <li>+56 9 7598 2205</li>
            <li>contacto@boletus.cl</li>
            <li>Villa Alemana, Región de Valparaíso</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <p className="text-xs">© 2026 BOLETUS. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // El panel de administración es otra página (/admin, con login): ver admin/index.html.
  // La página inicial sale del pathname: /servicios → servicios, / → home, etc.
  // Así, links directos y refresh en cualquier ruta abren la sección correcta.
  const [publicPage, setPublicPage] = useState<PublicPage>(() => {
    if (typeof window === "undefined") return "home";
    return pathAPagina(window.location.pathname);
  });

  // Sincroniza el back/forward del navegador con el estado de la SPA. Sin esto,
  // el usuario entra a "servicios", aprieta atrás, y salía del sitio (o queda
  // en blanco) porque nunca empujamos entradas al history.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { pagina?: PublicPage } | null;
      setPublicPage(st?.pagina ?? pathAPagina(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Título, descripción y canonical propios de cada sección (SEO).
  useEffect(() => {
    aplicarSeo(publicPage);
  }, [publicPage]);

  const navigatePublic = (p: PublicPage) => {
    if (p !== publicPage) {
      window.history.pushState({ pagina: p }, "", RUTAS[p]);
    }
    setPublicPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar
        currentPage={publicPage}
        onNavigate={navigatePublic}
      />
      <main>
        {publicPage === "home" && <HomePage onNavigate={navigatePublic} />}
        {publicPage === "servicios" && <ServicesPage onNavigate={navigatePublic} />}
        {publicPage === "productos" && <ProductsPage onNavigate={navigatePublic} />}
        {publicPage === "portafolio" && <PortfolioPage />}
        {publicPage === "nosotros" && <AboutPage onNavigate={navigatePublic} />}
        {publicPage === "contacto" && <ContactPage />}
      </main>
      <Footer onNavigate={navigatePublic} />
      <WhatsAppFloat />
    </div>
  );
}
