-- ─────────────────────────────────────────────────────────────────────────────
-- PORTAFOLIO Y «QUIÉNES SOMOS» EDITABLES DESDE EL PANEL (2-oct-2026)
--
-- Lo publicado lo lee cualquiera (el sitio público, con la clave publishable);
-- solo un admin escribe. Las fotos van al bucket público `publico`.
-- Se siembra con lo que el sitio mostraba en el código, para que nada cambie
-- hasta que Benjamín y Mauricio lo editen.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.portafolio (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  titulo text not null,
  descripcion text,
  comuna text,
  categoria text not null check (categoria in ('pasto', 'paisajismo', 'huertas', 'poda')),
  -- Antes/después (una transformación) o galería (un trabajo terminado, p. ej. huertas).
  tipo text not null default 'antes_despues' check (tipo in ('antes_despues', 'galeria')),
  antes text,
  despues text,
  galeria text[] not null default '{}',
  orden integer not null default 0,
  publicado boolean not null default true,
  -- Los que salen en la portada del sitio (los dos primeros por orden).
  en_inicio boolean not null default false
);
create or replace function public.tocar_actualizado() returns trigger language plpgsql as $$
begin new.actualizado := now(); return new; end $$;
drop trigger if exists portafolio_tocar on public.portafolio;
create trigger portafolio_tocar before update on public.portafolio
  for each row execute function public.tocar_actualizado();

alter table public.portafolio enable row level security;
drop policy if exists portafolio_publico on public.portafolio;
create policy portafolio_publico on public.portafolio for select to anon, authenticated using (publicado or public.es_admin());
drop policy if exists portafolio_admin on public.portafolio;
create policy portafolio_admin on public.portafolio for all to authenticated using (public.es_admin()) with check (public.es_admin());

create table if not exists public.equipo (
  id uuid primary key default gen_random_uuid(),
  actualizado timestamptz not null default now(),
  nombre text not null,
  cargo text,
  bio text,
  foto text,
  orden integer not null default 0,
  visible boolean not null default true
);
drop trigger if exists equipo_tocar on public.equipo;
create trigger equipo_tocar before update on public.equipo for each row execute function public.tocar_actualizado();
alter table public.equipo enable row level security;
drop policy if exists equipo_publico on public.equipo;
create policy equipo_publico on public.equipo for select to anon, authenticated using (visible or public.es_admin());
drop policy if exists equipo_admin on public.equipo;
create policy equipo_admin on public.equipo for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Ajustes sueltos del sitio (p. ej. la foto de cabecera de «Quiénes somos»).
create table if not exists public.ajustes (
  clave text primary key,
  valor text
);
alter table public.ajustes enable row level security;
drop policy if exists ajustes_publico on public.ajustes;
create policy ajustes_publico on public.ajustes for select to anon, authenticated using (true);
drop policy if exists ajustes_admin on public.ajustes;
create policy ajustes_admin on public.ajustes for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Fotos: bucket público (lectura libre), escritura solo admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('publico', 'publico', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
drop policy if exists publico_admin_insert on storage.objects;
create policy publico_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'publico' and public.es_admin());
drop policy if exists publico_admin_update on storage.objects;
create policy publico_admin_update on storage.objects for update to authenticated using (bucket_id = 'publico' and public.es_admin());
drop policy if exists publico_admin_delete on storage.objects;
create policy publico_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'publico' and public.es_admin());

-- ── Siembra: lo que el sitio mostraba hasta hoy (fotos de banco de imágenes que hay que reemplazar) ──
insert into public.portafolio (titulo, descripcion, categoria, tipo, antes, despues, galeria, orden, en_inicio)
select * from (values
  ('Casa particular — Recreo', 'Instalación de 120 m² de pasto bermuda, preparación de suelo y sistema de riego tecnificado.', 'pasto', 'antes_despues',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=480&fit=crop&auto=format', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&h=480&fit=crop&auto=format', '{}'::text[], 1, true),
  ('Condominio Los Pinos — Quilpué', 'Diseño paisajístico de áreas comunes con plantas nativas de la V Región, senderos y luminarias.', 'paisajismo', 'antes_despues',
   'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=700&h=480&fit=crop&auto=format', 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=700&h=480&fit=crop&auto=format', '{}'::text[], 2, true),
  ('Huerta familiar — Concón', 'Huerta agroecológica con bancales, compostaje y riego por goteo, pensada para producir todo el año en un patio de casa.', 'huertas', 'galeria',
   null, null, array['https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=700&h=480&fit=crop&auto=format', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&h=480&fit=crop&auto=format'], 3, false),
  ('Poda de cerco perimetral de parcela', 'Poda de mantención del cerco perimetral: se rebaja la altura, se empareja la línea y se retira el material cortado.', 'poda', 'antes_despues',
   'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&h=480&fit=crop&auto=format', 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=700&h=480&fit=crop&auto=format', '{}'::text[], 4, false)
) as v(titulo, descripcion, categoria, tipo, antes, despues, galeria, orden, en_inicio)
where not exists (select 1 from public.portafolio);

insert into public.equipo (nombre, cargo, bio, foto, orden)
select * from (values
  ('Mauricio', 'Ingeniero Agrónomo · Especialista en Huertas y Hortalizas',
   'Experiencia en manejo de viveros, proyección de manejos técnicos en regiones. Especializado en el uso de técnicas agrícolas para la producción de especies vegetales con sistemas hídricos eficientes.',
   'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&h=400&fit=crop&auto=format', 1),
  ('Benjamín', 'Ingeniero Agrónomo · Especialista en Medioambiente y Suelos',
   'Especialista en manejos ambientales, compostaje, saneamiento de suelos y biodiversidad funcional, con técnicas de manejo a gran y pequeña escala, integrando especies vegetales nativas y dinámicas entomológicas.',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop&auto=format', 2)
) as v(nombre, cargo, bio, foto, orden)
where not exists (select 1 from public.equipo);

insert into public.ajustes (clave, valor) values
  ('nosotros_cabecera', 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&h=700&fit=crop&auto=format')
  on conflict (clave) do nothing;
