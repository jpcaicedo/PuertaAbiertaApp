-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0004 · Directorio: servicios de vecinos, mensajes,
-- preferencias del perfil y fotos de perfil.
-- Requiere 0001–0003. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────── Perfil ───────────────────────

-- P4 · Qué notificaciones quiere recibir.
alter table public.perfiles add column if not exists notificaciones jsonb not null
  default '{"requests": true, "agenda": true, "messages": true, "marketplace": false}';

grant update (notificaciones) on public.perfiles to authenticated;

-- El teléfono no se puede leer directamente: solo se comparte cuando el vecino lo permite (ver abajo).
revoke select on public.perfiles from authenticated;
grant select (
  id, apartamento_id, rol, nombre, bio, avatar_url, mostrar_apartamento, mostrar_telefono,
  en_directorio, recibe_mensajes, notificaciones, acepto_normas_en, acepto_datos_en, created_at, updated_at
) on public.perfiles to authenticated;

-- Mi propio teléfono (para llenar formularios).
create or replace function public.mi_telefono()
returns text
language sql stable security definer set search_path = public
as $$ select telefono from public.perfiles where id = auth.uid() $$;

-- ─────────────────────── Servicios ───────────────────────

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- null = servicio de ejemplo (sin cuenta); sus datos van en `extra`.
  perfil_id uuid references public.perfiles (id) on delete cascade,
  categoria text not null check (categoria in ('mascotas', 'clases', 'hogar', 'comida', 'belleza', 'otro')),
  titulo text not null check (char_length(titulo) between 4 and 60),
  rol_corto text,
  descripcion text not null check (char_length(descripcion) between 20 and 280),
  descripcion_larga text,
  precio text not null check (char_length(precio) <= 60),
  disponibilidad text not null check (char_length(disponibilidad) <= 80),
  mostrar_apartamento boolean not null default true,
  acepta_llamadas boolean not null default false,
  horario_llamadas text,
  activo boolean not null default true,
  extra jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (conjunto_id, slug)
);

create index on public.servicios (conjunto_id, created_at desc);
create index on public.servicios (perfil_id);

alter table public.servicios enable row level security;

create policy "ver servicios de mi conjunto" on public.servicios
  for select to authenticated using (conjunto_id = public.mi_conjunto() and (activo or perfil_id = auth.uid()));

create policy "editar mis servicios" on public.servicios
  for update to authenticated using (perfil_id = auth.uid());

revoke all on public.servicios from anon, authenticated;
grant select on public.servicios to authenticated;
grant update (activo) on public.servicios to authenticated;

-- D1/D3 · Servicios con lo que se puede mostrar de quien los ofrece.
-- Corre con los permisos del dueño de la vista para poder dar el teléfono solo cuando se acepta llamadas;
-- por eso filtra el conjunto a mano.
create or replace view public.directorio_servicios as
  select
    s.id, s.slug, s.perfil_id, s.categoria, s.titulo, s.rol_corto, s.descripcion, s.descripcion_larga,
    s.precio, s.disponibilidad, s.acepta_llamadas, s.horario_llamadas, s.extra, s.created_at,
    p.nombre, p.avatar_url, t.nombre as torre,
    case when s.mostrar_apartamento then a.numero end as apartamento,
    case when s.acepta_llamadas then p.telefono end as telefono,
    coalesce(p.recibe_mensajes, false) as recibe_mensajes
  from public.servicios s
  left join public.perfiles p on p.id = s.perfil_id
  left join public.apartamentos a on a.id = p.apartamento_id
  left join public.torres t on t.id = a.torre_id
  where s.conjunto_id = public.mi_conjunto()
    and s.activo
    -- Quien apagó "Aparecer en el directorio" no sale, salvo para sí mismo.
    and (s.perfil_id is null or p.en_directorio or s.perfil_id = auth.uid());

revoke all on public.directorio_servicios from anon;
grant select on public.directorio_servicios to authenticated;

-- D5/D6 · Publicar servicio. Si acepta llamadas, guarda también el celular en el perfil.
create or replace function public.publicar_servicio(
  p_categoria text,
  p_titulo text,
  p_descripcion text,
  p_precio text,
  p_disponibilidad text,
  p_mostrar_apartamento boolean,
  p_acepta_llamadas boolean,
  p_telefono text
)
returns table (id uuid, slug text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_conjunto uuid := public.mi_conjunto();
  v_slug text;
  v_id uuid;
begin
  if v_conjunto is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if p_acepta_llamadas and coalesce(trim(p_telefono), '') !~ '^\+?[0-9 ]{7,15}$' then
    raise exception 'TELEFONO_INVALIDO' using errcode = 'P0001';
  end if;

  v_slug := trim(both '-' from regexp_replace(
    lower(translate(trim(p_titulo), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'servicio'), 50) || '-' || substr(md5(random()::text), 1, 4);

  if p_acepta_llamadas then
    update public.perfiles set telefono = regexp_replace(trim(p_telefono), ' ', '', 'g') where perfiles.id = auth.uid();
  end if;

  insert into public.servicios (
    conjunto_id, slug, perfil_id, categoria, titulo, descripcion, descripcion_larga, precio, disponibilidad,
    mostrar_apartamento, acepta_llamadas
  ) values (
    v_conjunto, v_slug, auth.uid(), p_categoria, trim(p_titulo), trim(p_descripcion), trim(p_descripcion),
    trim(p_precio), trim(p_disponibilidad), p_mostrar_apartamento, p_acepta_llamadas
  )
  returning servicios.id into v_id;

  return query select v_id, v_slug;
end;
$$;

revoke all on function public.publicar_servicio(text, text, text, text, text, boolean, boolean, text), public.mi_telefono() from public;
grant execute on function public.publicar_servicio(text, text, text, text, text, boolean, boolean, text), public.mi_telefono() to authenticated;

-- ─────────────────────── Mensajes ───────────────────────

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null default public.mi_conjunto() references public.conjuntos (id) on delete cascade,
  de uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  para uuid not null references public.perfiles (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 1000),
  created_at timestamptz not null default now(),
  leido_en timestamptz,
  check (de <> para)
);

create index on public.mensajes (para, created_at desc);
create index on public.mensajes (de, created_at desc);

alter table public.mensajes enable row level security;

-- Cada quien solo ve sus conversaciones.
create policy "ver mis mensajes" on public.mensajes
  for select to authenticated using (de = auth.uid() or para = auth.uid());

-- Solo a vecinos del mismo conjunto que aceptan mensajes.
create policy "enviar mensajes" on public.mensajes
  for insert to authenticated with check (
    de = auth.uid()
    and conjunto_id = public.mi_conjunto()
    and exists (
      select 1 from public.perfiles p
      join public.apartamentos a on a.id = p.apartamento_id
      join public.torres t on t.id = a.torre_id
      where p.id = para and p.recibe_mensajes and t.conjunto_id = public.mi_conjunto()
    )
  );

create policy "marcar leidos" on public.mensajes
  for update to authenticated using (para = auth.uid());

revoke all on public.mensajes from anon, authenticated;
grant select on public.mensajes to authenticated;
grant insert (para, texto) on public.mensajes to authenticated;
grant update (leido_en) on public.mensajes to authenticated;

-- Mensajes en vivo (Supabase Realtime).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end $$;

-- ─────────────────────── Fotos de perfil ───────────────────────

-- Carpeta pública "avatares": cada vecino solo puede escribir en la suya (avatares/<su id>/…).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy "subir mi foto" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    execute $p$
      create policy "cambiar mi foto" on storage.objects for update to authenticated
      using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    execute $p$
      create policy "borrar mi foto" on storage.objects for delete to authenticated
      using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
  end if;
end $$;
