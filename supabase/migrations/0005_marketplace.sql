-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0005 · Marketplace: productos con fotos, vendidos,
-- reportes a la administración y fotos en Storage.
-- Requiere 0001–0004. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────── Productos ───────────────────────

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- null = producto de ejemplo (sin cuenta); el vendedor va en `extra`.
  perfil_id uuid references public.perfiles (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 60),
  descripcion text not null default '' check (char_length(descripcion) <= 280),
  precio integer not null check (precio > 0 and precio < 1000000000),
  precio_anterior integer check (precio_anterior > 0),
  categoria text not null check (categoria in ('ropa', 'hogar', 'ninos', 'otro')),
  condicion text not null check (condicion in ('nuevo', 'como-nuevo', 'usado')),
  -- Texto libre opcional ("Colección", "Usado · buen estado"). Si falta se arma con `condicion`.
  condicion_texto text,
  entrega text not null default 'Entrega en portería, sin salir del conjunto' check (char_length(entrega) <= 100),
  fotos text[] not null check (cardinality(fotos) between 1 and 5),
  -- activo · vendido · retirado (por la administración)
  estado text not null default 'activo' check (estado in ('activo', 'vendido', 'retirado')),
  vendido_en timestamptz,
  extra jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (conjunto_id, slug)
);

create index on public.productos (conjunto_id, estado, created_at desc);
create index on public.productos (perfil_id);

alter table public.productos enable row level security;

-- Se ven los activos del conjunto; el dueño ve también los suyos vendidos o retirados; la administración, todos.
create policy "ver productos de mi conjunto" on public.productos
  for select to authenticated using (
    conjunto_id = public.mi_conjunto()
    and (estado = 'activo' or perfil_id = auth.uid() or public.es_admin())
  );

revoke all on public.productos from anon, authenticated;
grant select on public.productos to authenticated;

-- D8/D9 · Productos con el nombre y la torre de quien vende (sin datos de contacto).
create or replace view public.marketplace_productos
with (security_invoker = true)
as
  select
    pr.*, p.nombre, p.avatar_url, t.nombre as torre, coalesce(p.recibe_mensajes, false) as recibe_mensajes
  from public.productos pr
  left join public.perfiles p on p.id = pr.perfil_id
  left join public.apartamentos a on a.id = p.apartamento_id
  left join public.torres t on t.id = a.torre_id;

grant select on public.marketplace_productos to authenticated;

-- D10 · Publicar. Las fotos deben estar ya subidas en productos/<id del vecino>/.
create or replace function public.publicar_producto(
  p_titulo text,
  p_descripcion text,
  p_precio integer,
  p_categoria text,
  p_condicion text,
  p_entrega text,
  p_fotos text[]
)
returns table (id uuid, slug text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_conjunto uuid := public.mi_conjunto();
  v_slug text;
  v_id uuid;
  v_foto text;
begin
  if v_conjunto is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  foreach v_foto in array p_fotos loop
    if position('/storage/v1/object/public/productos/' || auth.uid()::text || '/' in v_foto) = 0 then
      raise exception 'FOTO_INVALIDA' using errcode = 'P0001';
    end if;
  end loop;

  v_slug := trim(both '-' from regexp_replace(
    lower(translate(trim(p_titulo), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'producto'), 50) || '-' || substr(md5(random()::text), 1, 4);

  insert into public.productos (conjunto_id, slug, perfil_id, titulo, descripcion, precio, categoria, condicion, entrega, fotos)
  values (v_conjunto, v_slug, auth.uid(), trim(p_titulo), coalesce(trim(p_descripcion), ''), p_precio, p_categoria,
          p_condicion, coalesce(nullif(trim(p_entrega), ''), 'Entrega en portería, sin salir del conjunto'), p_fotos)
  returning productos.id into v_id;

  return query select v_id, v_slug;
end;
$$;

-- D13 · Marcar como vendido (solo el dueño).
create or replace function public.marcar_vendido(p_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.productos set estado = 'vendido', vendido_en = now()
  where id = p_id and perfil_id = auth.uid() and estado = 'activo'
$$;

-- Eliminar una publicación propia (también se borran sus reportes; los mensajes se conservan).
create or replace function public.eliminar_producto(p_id uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from public.productos where id = p_id and perfil_id = auth.uid()
$$;

-- ─────────────────────── Mensajes por producto ───────────────────────

-- Para contar cuántos vecinos escribieron por cada producto (D12).
alter table public.mensajes add column if not exists producto_id uuid references public.productos (id) on delete set null;
create index if not exists mensajes_producto_idx on public.mensajes (producto_id);
grant insert (producto_id) on public.mensajes to authenticated;

-- D12 · Vecinos distintos que le escribieron al dueño por cada uno de sus productos.
create or replace function public.interesados_por_producto()
returns table (producto_id uuid, vecinos integer)
language sql stable security definer set search_path = public
as $$
  select m.producto_id, count(distinct m.de)::integer
  from public.mensajes m
  join public.productos pr on pr.id = m.producto_id
  where pr.perfil_id = auth.uid() and m.para = auth.uid()
  group by m.producto_id
$$;

-- ─────────────────────── Reportes ───────────────────────

create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete cascade,
  -- Nunca se le muestra al vendedor ni a otros vecinos.
  reportado_por uuid references public.perfiles (id) on delete set null,
  motivo text not null check (char_length(motivo) between 3 and 80),
  estado text not null default 'abierto' check (estado in ('abierto', 'retirado', 'mantenido')),
  created_at timestamptz not null default now(),
  decidido_en timestamptz,
  unique (producto_id, reportado_por)
);

create index on public.reportes (conjunto_id, estado);

alter table public.reportes enable row level security;

-- Solo la administración ve los reportes.
create policy "admin ve reportes" on public.reportes
  for select to authenticated using (public.es_admin() and conjunto_id = public.mi_conjunto());

revoke all on public.reportes from anon, authenticated;
grant select on public.reportes to authenticated;

-- D14 · Reportar. Si el vecino ya lo reportó, no se duplica.
create or replace function public.reportar_producto(p_producto uuid, p_motivo text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_conjunto uuid;
begin
  select conjunto_id into v_conjunto from public.productos
  where id = p_producto and conjunto_id = public.mi_conjunto() and estado = 'activo';
  if v_conjunto is null then
    raise exception 'PRODUCTO_NO_EXISTE' using errcode = 'P0001';
  end if;
  insert into public.reportes (conjunto_id, producto_id, reportado_por, motivo)
  values (v_conjunto, p_producto, auth.uid(), trim(p_motivo))
  on conflict (producto_id, reportado_por) do nothing;
end;
$$;

-- X7 · Retirar o mantener. Al retirar, se cierran todos los reportes abiertos del producto.
create or replace function public.resolver_reporte(p_reporte uuid, p_accion text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_producto uuid;
begin
  if not public.es_admin() then
    raise exception 'SOLO_ADMIN' using errcode = 'P0001';
  end if;
  select producto_id into v_producto from public.reportes
  where id = p_reporte and conjunto_id = public.mi_conjunto() and estado = 'abierto';
  if v_producto is null then
    raise exception 'YA_RESUELTO' using errcode = 'P0001';
  end if;

  if p_accion = 'retirar' then
    update public.productos set estado = 'retirado' where id = v_producto;
    update public.reportes set estado = 'retirado', decidido_en = now()
    where producto_id = v_producto and estado = 'abierto';
  elsif p_accion = 'mantener' then
    update public.reportes set estado = 'mantenido', decidido_en = now() where id = p_reporte;
  else
    raise exception 'ACCION_INVALIDA' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function
  public.publicar_producto(text, text, integer, text, text, text, text[]),
  public.marcar_vendido(uuid),
  public.eliminar_producto(uuid),
  public.interesados_por_producto(),
  public.reportar_producto(uuid, text),
  public.resolver_reporte(uuid, text)
from public;
grant execute on function
  public.publicar_producto(text, text, integer, text, text, text, text[]),
  public.marcar_vendido(uuid),
  public.eliminar_producto(uuid),
  public.interesados_por_producto(),
  public.reportar_producto(uuid, text),
  public.resolver_reporte(uuid, text)
to authenticated;

-- ─────────────────────── Fotos de productos ───────────────────────

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('productos', 'productos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy "subir fotos de mis productos" on storage.objects for insert to authenticated
      with check (bucket_id = 'productos' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    execute $p$
      create policy "borrar fotos de mis productos" on storage.objects for delete to authenticated
      using (bucket_id = 'productos' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
  end if;
end $$;
