-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0016 · Reseñas reales de servicios.
-- Quien ya le escribió a un vecino por la app (lo contactó para contratarlo) le puede dejar
-- de 1 a 5 estrellas y un comentario. Una reseña por vecino y servicio; se puede editar o borrar.
-- Las reseñas de ejemplo (en `extra`) se siguen mostrando junto a las reales.
-- Requiere 0001–0015. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  estrellas smallint not null check (estrellas between 1 and 5),
  comentario text not null default '' check (char_length(comentario) <= 500),
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (servicio_id, perfil_id)
);

create index on public.resenas (servicio_id, created_at desc);

alter table public.resenas enable row level security;

-- Se ven las reseñas de los servicios del conjunto.
create policy "ver resenas de mi conjunto" on public.resenas
  for select to authenticated using (
    exists (select 1 from public.servicios s where s.id = servicio_id and s.conjunto_id = public.mi_conjunto())
  );

-- Solo se escriben con las funciones de abajo.
revoke all on public.resenas from anon, authenticated;
grant select on public.resenas to authenticated;

-- ¿Puedo reseñar este servicio? 'propio' · 'sin_contacto' (aún no le he escrito) · 'si'
create or replace function public.puedo_resenar(p_servicio uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when s.id is null then 'no_existe'
    when s.perfil_id = auth.uid() then 'propio'
    when exists (
      select 1 from public.mensajes m
      where m.de = auth.uid()
        and (m.para = s.perfil_id or m.para_demo = 's:' || s.slug)
    ) then 'si'
    else 'sin_contacto'
  end
  from (select 1) uno
  left join public.servicios s on s.id = p_servicio and s.conjunto_id = public.mi_conjunto() and s.activo
$$;

-- Dejar o editar mi reseña. Le avisa al vecino que ofrece el servicio.
create or replace function public.resenar_servicio(p_servicio uuid, p_estrellas int, p_comentario text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_puede text := public.puedo_resenar(p_servicio);
  v_servicio public.servicios%rowtype;
  v_resena uuid;
  v_nombre text;
begin
  if v_puede = 'propio' then
    raise exception 'SERVICIO_PROPIO' using errcode = 'P0001';
  elsif v_puede = 'sin_contacto' then
    raise exception 'SIN_CONTACTO' using errcode = 'P0001';
  elsif v_puede <> 'si' then
    raise exception 'NO_EXISTE' using errcode = 'P0001';
  end if;
  if p_estrellas not between 1 and 5 then
    raise exception 'ESTRELLAS_INVALIDAS' using errcode = 'P0001';
  end if;

  insert into public.resenas (servicio_id, perfil_id, estrellas, comentario)
  values (p_servicio, auth.uid(), p_estrellas, coalesce(trim(p_comentario), ''))
  on conflict (servicio_id, perfil_id) do update
    set estrellas = excluded.estrellas, comentario = excluded.comentario, actualizado_en = now()
  returning id into v_resena;

  select * into v_servicio from public.servicios where id = p_servicio;
  if v_servicio.perfil_id is not null then
    select split_part(nombre, ' ', 1) into v_nombre from public.perfiles where id = auth.uid();
    perform public.notificar(v_servicio.perfil_id, 'messages', 'warm',
      v_nombre || ' te dejó una reseña',
      repeat('★', p_estrellas) || coalesce(' · ' || nullif(trim(p_comentario), ''), ''),
      '/directorio/' || v_servicio.slug || '#resenas',
      'resena:' || v_resena);
  end if;
end;
$$;

-- Borrar mi reseña.
create or replace function public.borrar_resena(p_servicio uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from public.resenas where servicio_id = p_servicio and perfil_id = auth.uid()
$$;

revoke all on function public.puedo_resenar(uuid), public.resenar_servicio(uuid, int, text), public.borrar_resena(uuid) from public, anon;
grant execute on function public.puedo_resenar(uuid), public.resenar_servicio(uuid, int, text), public.borrar_resena(uuid) to authenticated;
