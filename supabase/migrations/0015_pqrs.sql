-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0015 · Reportes de daños y PQRS.
-- El vecino reporta (con foto opcional) y sigue el estado: recibido → en proceso → resuelto.
-- La administración cambia el estado con una nota; cada cambio queda en el historial
-- y le llega como notificación al vecino.
-- Requiere 0001–0014. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

create table public.pqrs (
  id uuid primary key default gen_random_uuid(),
  -- Número de radicado que ve el vecino (PQRS-0001).
  numero integer generated always as identity,
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  -- daño · peticion · queja · reclamo · sugerencia
  tipo text not null check (tipo in ('dano', 'peticion', 'queja', 'reclamo', 'sugerencia')),
  titulo text not null check (char_length(trim(titulo)) between 4 and 80),
  descripcion text not null default '' check (char_length(descripcion) <= 1000),
  lugar text check (char_length(lugar) <= 80),
  -- Ruta de la foto en la carpeta privada "pqrs": <id del vecino>/<archivo>
  foto text,
  estado text not null default 'recibido' check (estado in ('recibido', 'en_proceso', 'resuelto')),
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index on public.pqrs (conjunto_id, estado, created_at desc);
create index on public.pqrs (perfil_id, created_at desc);

-- Historial: cada cambio de estado con la nota de la administración.
create table public.pqrs_eventos (
  id uuid primary key default gen_random_uuid(),
  pqrs_id uuid not null references public.pqrs (id) on delete cascade,
  estado text not null check (estado in ('recibido', 'en_proceso', 'resuelto')),
  nota text check (char_length(nota) <= 500),
  autor_id uuid references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.pqrs_eventos (pqrs_id, created_at);

alter table public.pqrs enable row level security;
alter table public.pqrs_eventos enable row level security;

-- Cada vecino ve los suyos; la administración, todos los del conjunto.
create policy "ver mis pqrs" on public.pqrs
  for select to authenticated using (
    perfil_id = auth.uid() or (public.es_admin() and conjunto_id = public.mi_conjunto())
  );
create policy "ver historial de mis pqrs" on public.pqrs_eventos
  for select to authenticated using (
    exists (select 1 from public.pqrs p where p.id = pqrs_id)
  );

-- Solo se escriben con las funciones de abajo.
revoke all on public.pqrs, public.pqrs_eventos from anon, authenticated;
grant select on public.pqrs, public.pqrs_eventos to authenticated;

-- Crear un reporte. Avisa a la administración.
create or replace function public.crear_pqrs(
  p_tipo text, p_titulo text, p_descripcion text, p_lugar text, p_foto text
)
returns table (id uuid, numero integer)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_conjunto uuid := public.mi_conjunto();
  v_id uuid;
  v_numero integer;
  v_nombre text;
begin
  if v_conjunto is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if p_foto is not null and split_part(p_foto, '/', 1) <> auth.uid()::text then
    raise exception 'FOTO_INVALIDA' using errcode = 'P0001';
  end if;

  insert into public.pqrs (conjunto_id, perfil_id, tipo, titulo, descripcion, lugar, foto)
  values (v_conjunto, auth.uid(), p_tipo, trim(p_titulo), coalesce(trim(p_descripcion), ''),
          nullif(trim(p_lugar), ''), p_foto)
  returning pqrs.id, pqrs.numero into v_id, v_numero;

  insert into public.pqrs_eventos (pqrs_id, estado, autor_id) values (v_id, 'recibido', auth.uid());

  select split_part(nombre, ' ', 1) into v_nombre from public.perfiles where perfiles.id = auth.uid();
  perform public.notificar_admins(v_conjunto, 'requests', 'warm',
    case p_tipo when 'dano' then 'Nuevo reporte de daño' else 'Nueva PQRS' end,
    v_nombre || ' · ' || trim(p_titulo), '/admin/pqrs/' || v_id);

  return query select v_id, v_numero;
end;
$$;

-- La administración cambia el estado (con nota). Avisa al vecino.
create or replace function public.actualizar_pqrs(p_id uuid, p_estado text, p_nota text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_pqrs public.pqrs%rowtype;
begin
  if not public.es_admin() then
    raise exception 'SOLO_ADMIN' using errcode = 'P0001';
  end if;
  if p_estado not in ('recibido', 'en_proceso', 'resuelto') then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  update public.pqrs
  set estado = p_estado,
      actualizado_en = now(),
      resuelto_en = case when p_estado = 'resuelto' then now() else null end
  where id = p_id and conjunto_id = public.mi_conjunto()
  returning * into v_pqrs;
  if not found then
    raise exception 'NO_EXISTE' using errcode = 'P0001';
  end if;

  insert into public.pqrs_eventos (pqrs_id, estado, nota, autor_id)
  values (p_id, p_estado, nullif(trim(p_nota), ''), auth.uid());

  perform public.notificar(v_pqrs.perfil_id, 'requests',
    case p_estado when 'resuelto' then 'success' when 'en_proceso' then 'brand' else 'neutral' end,
    case p_estado
      when 'resuelto' then 'Resolvieron tu reporte'
      when 'en_proceso' then 'Tu reporte está en proceso'
      else 'Actualizaron tu reporte' end,
    coalesce(nullif(trim(p_nota), ''), v_pqrs.titulo),
    '/pqrs/' || p_id);
end;
$$;

revoke all on function public.crear_pqrs(text, text, text, text, text), public.actualizar_pqrs(uuid, text, text) from public, anon;
grant execute on function public.crear_pqrs(text, text, text, text, text), public.actualizar_pqrs(uuid, text, text) to authenticated;

-- ─────────────────────── Fotos (carpeta privada "pqrs") ───────────────────────

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('pqrs', 'pqrs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy "pqrs subir" on storage.objects for insert to authenticated
      with check (bucket_id = 'pqrs' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    -- Ver: quien la subió, o la administración del conjunto del reporte.
    execute $p$
      create policy "pqrs ver" on storage.objects for select to authenticated
      using (
        bucket_id = 'pqrs' and (
          (storage.foldername(name))[1] = auth.uid()::text
          or (public.es_admin() and exists (
            select 1 from public.pqrs p where p.foto = name and p.conjunto_id = public.mi_conjunto()
          ))
        )
      )
    $p$;
  end if;
end $$;
