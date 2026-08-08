import { useState, useEffect, useRef } from "react";
import {
  Menu, X, Phone, Mail, MapPin, Clock, MessageCircle, Leaf,
  Droplets, Scissors, Star, ArrowRight, LogOut, Home, Search,
  CheckCircle, Package, Users, BarChart3, Eye, Edit2, Plus,
  TrendingUp, Award, ChevronDown, Sprout, Sun, Filter, X as XIcon,
  ChevronRight, Trash2, ShieldCheck
} from "lucide-react";

type PublicPage = "home" | "servicios" | "portafolio" | "nosotros" | "contacto";
type AdminPage = "dashboard" | "pedidos" | "clientes";
type AppMode = "public" | "admin";
type OrderStatus = "pendiente" | "en_proceso" | "completado" | "cancelado";
type PortfolioCategory = "todos" | "pasto" | "paisajismo" | "huertas" | "poda";

interface Order {
  id: string;
  cliente: string;
  servicio: string;
  fecha: string;
  monto: string;
  estado: OrderStatus;
  telefono: string;
}

interface Client {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  comuna: string;
  proyectos: number;
  ultimoContacto: string;
  tipo: "particular" | "condominio" | "empresa";
}

const ORDERS: Order[] = [
  { id: "BOL-001", cliente: "María González", servicio: "Instalación de Pasto", fecha: "12 Jul 2026", monto: "$420.000", estado: "completado", telefono: "+56 9 8123 4567" },
  { id: "BOL-002", cliente: "Condominio Los Pinos", servicio: "Mantención Áreas Verdes", fecha: "14 Jul 2026", monto: "$890.000", estado: "en_proceso", telefono: "+56 9 7234 5678" },
  { id: "BOL-003", cliente: "Roberto Fuentes", servicio: "Paisajismo y Diseño", fecha: "15 Jul 2026", monto: "$1.250.000", estado: "pendiente", telefono: "+56 9 6345 6789" },
  { id: "BOL-004", cliente: "Carolina Vidal", servicio: "Huerta Agroecológica", fecha: "10 Jul 2026", monto: "$380.000", estado: "completado", telefono: "+56 9 5456 7890" },
  { id: "BOL-005", cliente: "Empresa Verde SpA", servicio: "Asesoría Técnica", fecha: "16 Jul 2026", monto: "$220.000", estado: "pendiente", telefono: "+56 9 4567 8901" },
  { id: "BOL-006", cliente: "Jorge Saavedra", servicio: "Poda Especializada", fecha: "08 Jul 2026", monto: "$145.000", estado: "cancelado", telefono: "+56 9 3678 9012" },
  { id: "BOL-007", cliente: "Comunidad El Roble", servicio: "Instalación de Pasto", fecha: "17 Jul 2026", monto: "$760.000", estado: "en_proceso", telefono: "+56 9 2789 0123" },
];

const CLIENTS: Client[] = [
  { id: "CLI-001", nombre: "María González", email: "maria.gonzalez@gmail.com", telefono: "+56 9 8123 4567", comuna: "Villa Alemana", proyectos: 2, ultimoContacto: "12 Jul 2026", tipo: "particular" },
  { id: "CLI-002", nombre: "Condominio Los Pinos", email: "admin@lospinos.cl", telefono: "+56 9 7234 5678", comuna: "Quilpué", proyectos: 4, ultimoContacto: "14 Jul 2026", tipo: "condominio" },
  { id: "CLI-003", nombre: "Roberto Fuentes", email: "rfuentes@outlook.com", telefono: "+56 9 6345 6789", comuna: "Viña del Mar", proyectos: 1, ultimoContacto: "15 Jul 2026", tipo: "particular" },
  { id: "CLI-004", nombre: "Carolina Vidal", email: "carolina.vidal@gmail.com", telefono: "+56 9 5456 7890", comuna: "Villa Alemana", proyectos: 1, ultimoContacto: "10 Jul 2026", tipo: "particular" },
  { id: "CLI-005", nombre: "Empresa Verde SpA", email: "contacto@empresaverde.cl", telefono: "+56 9 4567 8901", comuna: "Valparaíso", proyectos: 3, ultimoContacto: "16 Jul 2026", tipo: "empresa" },
  { id: "CLI-006", nombre: "Comunidad El Roble", email: "admin@elroble.cl", telefono: "+56 9 2789 0123", comuna: "Quilpué", proyectos: 2, ultimoContacto: "17 Jul 2026", tipo: "condominio" },
];

const PORTFOLIO_ITEMS = [
  { id: 1, categoria: "pasto" as const, titulo: "Casa particular — Villa Alemana", before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=480&fit=crop&auto=format", after: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&h=480&fit=crop&auto=format", desc: "Instalación de 120 m² de pasto bermuda, preparación de suelo y sistema de riego tecnificado." },
  { id: 2, categoria: "paisajismo" as const, titulo: "Condominio Los Pinos — Quilpué", before: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=700&h=480&fit=crop&auto=format", after: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=700&h=480&fit=crop&auto=format", desc: "Diseño paisajístico de áreas comunes con plantas nativas de la V Región, senderos y luminarias." },
  { id: 3, categoria: "huertas" as const, titulo: "Huerta familiar — Viña del Mar", before: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=700&h=480&fit=crop&auto=format", after: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&h=480&fit=crop&auto=format", desc: "Huerta agroecológica de 30 m² con sistema de compostaje, riego por goteo y plantas aromáticas." },
  { id: 4, categoria: "poda" as const, titulo: "Parque privado — Villa Alemana", before: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&h=480&fit=crop&auto=format", after: "https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=700&h=480&fit=crop&auto=format", desc: "Poda formativa y sanitaria de 18 árboles frutales y ornamentales con herramientas especializadas." },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  en_proceso: { label: "En proceso", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  completado: { label: "Completado", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  cancelado: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

const clientTypeConfig: Record<string, string> = {
  particular: "bg-secondary text-secondary-foreground",
  condominio: "bg-blue-50 text-blue-700",
  empresa: "bg-purple-50 text-purple-700",
};

// ─── Shared UI ───────────────────────────────────────────────────────────────

function Badge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

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
  const services = [
    { icon: Sprout, title: "Instalación de Pasto", desc: "Preparamos el suelo correctamente para que tu pasto dure años, no meses." },
    { icon: Leaf, title: "Paisajismo Agroecológico", desc: "Diseñamos con plantas nativas que resisten el clima local y requieren menos agua." },
    { icon: Droplets, title: "Riego Tecnificado", desc: "Sistemas de riego por goteo que ahorran hasta 60% de agua comparado al riego manual." },
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
            Villa Alemana · V Región · Chile
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-2xl mb-6"
          >
            Jardinería Agroecológica Profesional
          </h1>
          <p className="text-white/80 text-lg max-w-xl mb-8 leading-relaxed">
            Ingenieros agrónomos especializados en paisajismo, instalación de pasto y huertas agroecológicas en la V Región.
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
            { num: "+80", label: "proyectos ejecutados" },
            { num: "5+", label: "años de experiencia" },
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
            {PORTFOLIO_ITEMS.slice(0, 2).map((item) => (
              <BeforeAfterCard key={item.id} item={item} />
            ))}
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
            "Mauricio y Benjamín transformaron nuestro jardín en algo que nunca imaginé posible. No solo quedó precioso, sino que nos explicaron cada decisión. Realmente saben de lo que hablan."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-primary">MG</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">María González</div>
              <div className="text-xs text-muted-foreground">Villa Alemana, V Región</div>
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

function BeforeAfterCard({ item }: { item: typeof PORTFOLIO_ITEMS[0] }) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="group overflow-hidden border border-border bg-card">
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={showAfter ? item.after : item.before}
          alt={`${showAfter ? "Después" : "Antes"} — ${item.titulo}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
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
      icon: Sprout,
      title: "Instalación de Pasto",
      desc: "Preparamos y nivelamos el suelo, seleccionamos la variedad de césped más adecuada para tu microclima en la V Región e instalamos sistemas de riego para garantizar un resultado duradero.",
      price: "Desde $35.000/m²",
      includes: ["Análisis de suelo", "Nivelación y preparación", "Siembra o tapizado", "Sistema de riego básico"],
      img: "/instalacion-pasto.jpg",
    },
    {
      icon: Leaf,
      title: "Paisajismo y Diseño",
      desc: "Diseñamos espacios verdes con metodología agroecológica comprobada. Priorizamos plantas nativas del litoral central que toleran la sequía y aportan biodiversidad local.",
      price: "Presupuesto según proyecto",
      includes: ["Diseño en plano 2D", "Selección de especies nativas", "Instalación y trasplante", "Informe de mantención"],
      img: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Sun,
      title: "Huertas Agroecológicas",
      desc: "Implementamos huertas productivas en espacios pequeños o grandes, con técnicas de compostaje, biodiversidad funcional y riego eficiente para familias y emprendimientos.",
      price: "Desde $180.000",
      includes: ["Diseño de la huerta", "Compostaje inicial", "Plantines de temporada", "Capacitación de uso"],
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Scissors,
      title: "Poda Especializada",
      desc: "Realizamos podas formativas, sanitarias y de fructificación con criterio agronómico. Nuestro enfoque preserva la salud del árbol mientras mejora su forma y producción.",
      price: "Desde $15.000/árbol",
      includes: ["Diagnóstico fitosanitario", "Poda técnica especializada", "Retiro de material", "Recomendaciones de seguimiento"],
      img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Droplets,
      title: "Mantención Recurrente",
      desc: "Planes mensuales o quincenales para condominios y particulares. Incluye corte de pasto, control de malezas, riego y revisión general de la salud del jardín.",
      price: "Planes desde $80.000/mes",
      includes: ["Corte y bordes de pasto", "Control de malezas", "Revisión de riego", "Informe mensual de estado"],
      img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=380&fit=crop&auto=format",
    },
    {
      icon: Award,
      title: "Asesoría Técnica",
      desc: "Consultoría profesional para proyectos agroecológicos, certificaciones, diseño de espacios productivos o resolución de problemas fitosanitarios en jardines y huertos.",
      price: "Desde $60.000/hora",
      includes: ["Diagnóstico en terreno", "Informe técnico escrito", "Plan de acción", "Seguimiento por correo"],
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
  const filtered = cat === "todos" ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((p) => p.categoria === cat);

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

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No hay proyectos en esta categoría aún.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────

function AboutPage({ onNavigate }: { onNavigate: (p: PublicPage) => void }) {
  const values = [
    { icon: Leaf, title: "Plantas nativas", desc: "Preferimos especies locales del litoral central porque resisten mejor el clima de la V Región y consumen menos agua." },
    { icon: Droplets, title: "Riego eficiente", desc: "Diseñamos sistemas de riego tecnificado que reducen el consumo hídrico hasta en un 60% respecto al riego manual." },
    { icon: ShieldCheck, title: "Sin agroquímicos", desc: "Aplicamos agroecología real: control biológico, compostaje y biodiversidad funcional en lugar de pesticidas." },
  ];

  return (
    <div className="pt-16">
      <div className="bg-foreground py-24 px-4 sm:px-6 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&h=700&fit=crop&auto=format"
          alt="Equipo Boletus en terreno"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
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
          <div className="border border-border bg-card overflow-hidden group">
            <div className="h-64 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&h=400&fit=crop&auto=format"
                alt="Mauricio — Ingeniero Agrónomo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground">Mauricio</h2>
                  <p className="text-xs text-accent" style={{ fontFamily: "'DM Mono', monospace" }}>Ingeniero Agrónomo · Especialista en Paisajismo</p>
                </div>
                <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Más de 8 años de experiencia en proyectos de paisajismo agroecológico en la V Región. Especializado en el uso de flora nativa del litoral central y diseño de sistemas hídricos eficientes.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card overflow-hidden group">
            <div className="h-64 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop&auto=format"
                alt="Benjamín — Ingeniero Agrónomo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-semibold text-foreground">Benjamín</h2>
                  <p className="text-xs text-accent" style={{ fontFamily: "'DM Mono', monospace" }}>Ingeniero Agrónomo · Especialista en Huertas y Suelos</p>
                </div>
                <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Especialista en agroecología y manejo de suelos, con enfoque en huertas productivas, compostaje y biodiversidad funcional. Ha asesorado a más de 50 familias en la transición a jardines sostenibles.
              </p>
            </div>
          </div>
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
              Por eso elegimos plantas nativas: conocemos el clima de la V Región. Esas plantas llevan miles de años adaptadas a nuestras condiciones de sequía estival y lluvia invernal. Simplemente funcionan mejor.
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
  const servicios = ["Instalación de Pasto", "Paisajismo y Diseño", "Huertas Agroecológicas", "Poda Especializada", "Mantención Recurrente", "Asesoría Técnica"];

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
                { icon: Phone, label: "+56 9 5008 1548", sub: "Mauricio (directo)" },
                { icon: Mail, label: "contacto@boletus.cl", sub: "Respuesta en 24 hrs" },
                { icon: MapPin, label: "Villa Alemana, V Región", sub: "Servicio toda la región" },
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

          <div className="h-40 bg-muted rounded-sm overflow-hidden border border-border flex items-center justify-center text-muted-foreground text-xs">
            <div className="text-center">
              <MapPin className="w-6 h-6 mx-auto mb-1 text-muted-foreground/60" />
              <span>Google Maps — Villa Alemana, V Región</span>
            </div>
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
            Jardinería agroecológica profesional en Villa Alemana y V Región. Ingenieros agrónomos comprometidos con el paisajismo sostenible.
          </p>
        </div>
        <div>
          <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Servicios</h3>
          <ul className="space-y-2">
            {["Instalación de Pasto", "Paisajismo y Diseño", "Huertas Agroecológicas", "Mantención Recurrente", "Poda Especializada"].map((s) => (
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
            <li>contacto@boletus.cl</li>
            <li>Villa Alemana, V Región</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <p className="text-xs">© 2026 BOLETUS. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// ─── Admin: Sidebar ───────────────────────────────────────────────────────────

function AdminSidebar({
  page,
  onPage,
  onExitAdmin,
}: {
  page: AdminPage;
  onPage: (p: AdminPage) => void;
  onExitAdmin: () => void;
}) {
  const links: { id: AdminPage; icon: React.ElementType; label: string }[] = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "pedidos", icon: Package, label: "Pedidos" },
    { id: "clientes", icon: Users, label: "Clientes" },
  ];

  return (
    <aside className="w-56 bg-sidebar text-sidebar-foreground flex flex-col h-full flex-shrink-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sidebar-primary rounded-sm flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-sm font-semibold text-sidebar-foreground">BOLETUS</div>
            <div className="text-[10px] text-sidebar-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => onPage(l.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
              page === l.id
                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <l.icon className="w-4 h-4" />
            {l.label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={onExitAdmin}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors rounded-sm"
        >
          <LogOut className="w-4 h-4" />
          Salir al sitio
        </button>
      </div>
    </aside>
  );
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

function AdminDashboard({ onPage }: { onPage: (p: AdminPage) => void }) {
  const stats = [
    { label: "Pedidos este mes", value: "12", change: "+4 vs mes anterior", icon: Package, trend: "up" },
    { label: "Clientes activos", value: "6", change: "+2 nuevos", icon: Users, trend: "up" },
    { label: "Ingresos estimados", value: "$3.065.000", change: "+18% vs junio", icon: TrendingUp, trend: "up" },
    { label: "Proyectos completados", value: "4", change: "este mes", icon: CheckCircle, trend: "neutral" },
  ];

  const recent = ORDERS.slice(0, 5);

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Julio 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="w-7 h-7 bg-secondary rounded-sm flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-foreground mb-1">{s.value}</div>
            <div className={`text-xs ${s.trend === "up" ? "text-accent" : "text-muted-foreground"}`}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Pedidos recientes</h2>
          <button onClick={() => onPage("pedidos")} className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Cliente", "Servicio", "Fecha", "Estado"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{o.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{o.cliente}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{o.servicio}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{o.fecha}</td>
                  <td className="px-5 py-3"><Badge status={o.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Orders ────────────────────────────────────────────────────────────

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "todos">("todos");

  const filtered = orders.filter((o) => {
    const matchSearch = o.cliente.toLowerCase().includes(search.toLowerCase()) || o.servicio.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || o.estado === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = (id: string, estado: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-foreground mb-1">Pedidos</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} pedidos encontrados</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs font-medium rounded-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo pedido
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input-background border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "todos")}
          className="bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary rounded-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ID", "Cliente", "Servicio", "Fecha", "Monto", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{o.cliente}</div>
                    <div className="text-xs text-muted-foreground">{o.telefono}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{o.servicio}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{o.fecha}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>{o.monto}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.estado}
                      onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                      className={`text-xs font-medium px-2 py-1 border rounded-full focus:outline-none ${statusConfig[o.estado].color}`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:border-primary hover:text-primary transition-colors text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:border-primary hover:text-primary transition-colors text-muted-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No se encontraron pedidos.</div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: Clients ───────────────────────────────────────────────────────────

function AdminClients() {
  const [search, setSearch] = useState("");
  const filtered = CLIENTS.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.comuna.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-foreground mb-1">Clientes</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} clientes registrados</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs font-medium rounded-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo cliente
        </button>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-input-background border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-sm"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-card border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 bg-secondary rounded-sm flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
              {c.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-foreground text-sm">{c.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${clientTypeConfig[c.tipo]}`}>
                  {c.tipo}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <span>{c.email}</span>
                <span>{c.telefono}</span>
                <span>{c.comuna}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="text-center">
                <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-lg font-bold text-foreground">{c.proyectos}</div>
                <div className="text-xs text-muted-foreground">proyectos</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Último contacto</div>
                <div className="text-xs font-medium text-foreground">{c.ultimoContacto}</div>
              </div>
              <div className="flex gap-1.5">
                <button className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:border-primary hover:text-primary transition-colors text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:border-primary hover:text-primary transition-colors text-muted-foreground">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Arranca en el SITIO PÚBLICO (comercial). Hasta que el admin tenga ruta y
  // login propios, se entra sin UI visible usando `?admin=1` en la URL. El
  // botón "Admin" del footer se quitó para que no lo vea cualquier visitante.
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window === "undefined") return "public";
    return new URLSearchParams(window.location.search).get("admin") === "1" ? "admin" : "public";
  });
  const [publicPage, setPublicPage] = useState<PublicPage>("home");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");

  const navigatePublic = (p: PublicPage) => {
    setPublicPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (mode === "admin") {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <AdminSidebar
          page={adminPage}
          onPage={setAdminPage}
          onExitAdmin={() => setMode("public")}
        />
        <main className="flex-1 overflow-auto">
          {adminPage === "dashboard" && <AdminDashboard onPage={setAdminPage} />}
          {adminPage === "pedidos" && <AdminOrders />}
          {adminPage === "clientes" && <AdminClients />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar
        currentPage={publicPage}
        onNavigate={navigatePublic}
      />
      <main>
        {publicPage === "home" && <HomePage onNavigate={navigatePublic} />}
        {publicPage === "servicios" && <ServicesPage onNavigate={navigatePublic} />}
        {publicPage === "portafolio" && <PortfolioPage />}
        {publicPage === "nosotros" && <AboutPage onNavigate={navigatePublic} />}
        {publicPage === "contacto" && <ContactPage />}
      </main>
      <Footer onNavigate={navigatePublic} />
      <WhatsAppFloat />
    </div>
  );
}
