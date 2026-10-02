-- ─────────────────────────────────────────────────────────────────────────────
-- PANEL DE ADMINISTRACIÓN DE BOLETUS · ETAPA 1 (2-oct-2026)
--
-- Quién entra: solo los correos de `admins` (hoy contacto@boletus.cl). El login
-- es por código al correo (Supabase Auth OTP) con el registro DESACTIVADO: solo
-- reciben código los usuarios ya creados. Y aunque alguien consiguiera una sesión
-- con otro correo, no ve nada: cada tabla exige es_admin().
--
-- Cotizaciones: las del formulario de /contacto entran solas (api/contacto con
-- la service key, que salta RLS); las de WhatsApp o llamada se cargan a mano.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  nombre text,
  creado timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Nadie lee ni escribe la lista desde el navegador: se administra desde Supabase.

insert into public.admins (email, nombre) values ('contacto@boletus.cl', 'Boletus')
  on conflict (email) do nothing;

-- ¿La sesión actual es de un admin? security definer: lee `admins` aunque RLS no lo deje.
create or replace function public.es_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now(),
  origen text not null default 'manual' check (origen in ('web', 'whatsapp', 'llamada', 'otro', 'manual')),
  nombre text not null,
  telefono text,
  email text,
  comuna text,
  servicio text,
  mensaje text,
  fecha_contacto date not null default (now() at time zone 'America/Santiago')::date,
  estado text not null default 'nueva'
    check (estado in ('nueva', 'cotizada', 'aceptada', 'rechazada', 'sin_respuesta')),
  monto_cotizado integer check (monto_cotizado is null or monto_cotizado >= 0),
  notas text
);
create index if not exists cotizaciones_estado_idx on public.cotizaciones (estado, creada desc);

create or replace function public.tocar_actualizada() returns trigger language plpgsql as $$
begin new.actualizada := now(); return new; end $$;
drop trigger if exists cotizaciones_tocar on public.cotizaciones;
create trigger cotizaciones_tocar before update on public.cotizaciones
  for each row execute function public.tocar_actualizada();

alter table public.cotizaciones enable row level security;
drop policy if exists cotizaciones_admin on public.cotizaciones;
create policy cotizaciones_admin on public.cotizaciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
