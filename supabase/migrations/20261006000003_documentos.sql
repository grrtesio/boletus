-- ============================================================================
-- DOCUMENTOS DE COTIZACIÓN (6-oct-2026)
--
-- Cada cotización puede tener UN documento generado por el panel (el PDF con el
-- diseño de Boletus; al regenerarlo se reemplaza, no se duplica) y cualquier
-- cantidad de PDF subidos a mano. Los archivos viven en el bucket PRIVADO
-- `documentos` (solo los administradores los leen, por URL firmada).
-- ============================================================================

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now(),
  cotizacion_id uuid not null references public.cotizaciones (id) on delete cascade,
  tipo text not null check (tipo in ('generado', 'subido')),
  ruta text not null,                 -- ruta dentro del bucket `documentos`
  nombre_archivo text not null,       -- cómo se llama al descargar
  titulo text,                        -- título del servicio (para listarlo sin abrir el PDF)
  estado_al_emitir text,              -- estado de la cotización cuando se generó (lo que dice el PDF)
  datos jsonb,                        -- el formulario con el que se generó: permite editar y regenerar
  notas text
);
create index if not exists documentos_cotizacion_idx on public.documentos (cotizacion_id, creada desc);
-- Un solo documento GENERADO por cotización: regenerar actualiza la misma fila.
create unique index if not exists documentos_generado_unico on public.documentos (cotizacion_id) where tipo = 'generado';

drop trigger if exists documentos_tocar on public.documentos;
create trigger documentos_tocar before update on public.documentos
  for each row execute function public.tocar_actualizada();

alter table public.documentos enable row level security;
drop policy if exists documentos_admin on public.documentos;
create policy documentos_admin on public.documentos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Bucket privado: solo PDF, hasta 20 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documentos_leer_admin on storage.objects;
create policy documentos_leer_admin on storage.objects
  for select to authenticated using (bucket_id = 'documentos' and public.es_admin());
drop policy if exists documentos_subir_admin on storage.objects;
create policy documentos_subir_admin on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos' and public.es_admin());
drop policy if exists documentos_cambiar_admin on storage.objects;
create policy documentos_cambiar_admin on storage.objects
  for update to authenticated using (bucket_id = 'documentos' and public.es_admin()) with check (bucket_id = 'documentos' and public.es_admin());
drop policy if exists documentos_borrar_admin on storage.objects;
create policy documentos_borrar_admin on storage.objects
  for delete to authenticated using (bucket_id = 'documentos' and public.es_admin());
