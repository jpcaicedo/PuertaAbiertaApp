-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0003 · Reservas de zonas comunes, actividades propuestas
-- por vecinos y solicitudes para la administración.
-- Requiere 0001 y 0002. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- ───────────── Actividades propuestas por vecinos ─────────────

-- 'propuesta' = la administración propuso otra fecha; el vecino decide.
alter table public.actividades drop constraint if exists actividades_estado_check;
alter table public.actividades add constraint actividades_estado_check
  check (estado in ('pendiente', 'publicada', 'propuesta', 'rechazada', 'cancelada'));

-- Mensaje de la administración al rechazar o proponer otra fecha.
alter table public.actividades add column if not exists respuesta text check (char_length(respuesta) <= 280);
alter table public.actividades add column if not exists decidido_en timestamptz;

-- A6 · Crear actividad. Si usa una zona común queda pendiente de aprobación; si no, se publica de una.
create or replace function public.proponer_actividad(
  p_titulo text,
  p_descripcion text,
  p_fecha date,
  p_inicio time,
  p_fin time,
  p_lugar text,
  p_cupos integer,
  p_usa_zona boolean
)
returns table (id uuid, slug text, estado text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_perfil record;
  v_slug text;
  v_id uuid;
  v_estado text := case when p_usa_zona then 'pendiente' else 'publicada' end;
begin
  select p.id, p.nombre, t.nombre as torre, t.conjunto_id into v_perfil
  from public.perfiles p
  join public.apartamentos a on a.id = p.apartamento_id
  join public.torres t on t.id = a.torre_id
  where p.id = auth.uid();
  if not found then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  if p_fecha < public.hoy_colombia() then
    raise exception 'FECHA_PASADA' using errcode = 'P0001';
  end if;

  -- "Tarde de juegos de mesa" → tarde-de-juegos-de-mesa-4f2a
  v_slug := trim(both '-' from regexp_replace(
    lower(translate(trim(p_titulo), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'actividad'), 50) || '-' || substr(md5(random()::text), 1, 4);

  insert into public.actividades (
    conjunto_id, slug, tipo, estado, titulo, fecha, inicio, fin, lugar, descripcion, cupos,
    organizador_id, organizador_nombre, organizador_torre
  ) values (
    v_perfil.conjunto_id, v_slug, 'actividad', v_estado, trim(p_titulo), p_fecha, p_inicio, p_fin, trim(p_lugar),
    coalesce(trim(p_descripcion), ''), p_cupos,
    v_perfil.id, split_part(v_perfil.nombre, ' ', 1), v_perfil.torre
  )
  returning actividades.id into v_id;

  return query select v_id, v_slug, v_estado;
end;
$$;

-- ─────────────────────── Reservas de zonas ───────────────────────

-- Las zonas (salón, BBQ, turco…) están definidas en la app; aquí solo se guardan las reservas.
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  zona text not null check (zona ~ '^[a-z0-9-]+$'),
  -- "Salón social, Torre A"
  lugar text not null,
  fecha date not null,
  inicio time not null,
  fin time not null check (fin > inicio),
  -- privada / comunidad (con aprobación) · turno (inmediato)
  tipo text not null check (tipo in ('privada', 'comunidad', 'turno')),
  motivo text check (char_length(motivo) <= 80),
  invitados integer check (invitados between 1 and 500),
  estado text not null check (estado in ('pendiente', 'aprobada', 'propuesta', 'rechazada', 'cancelada')),
  respuesta text check (char_length(respuesta) <= 280),
  -- Si era "para la comunidad", la actividad que se publicó al aprobarla.
  actividad_id uuid references public.actividades (id) on delete set null,
  created_at timestamptz not null default now(),
  decidido_en timestamptz
);

-- Una franja solo puede estar pedida o confirmada una vez.
create unique index reservas_franja_unica on public.reservas (conjunto_id, zona, fecha, inicio)
  where estado in ('pendiente', 'aprobada');
create index on public.reservas (perfil_id);
create index on public.reservas (conjunto_id, estado);

alter table public.reservas enable row level security;

-- Cada vecino ve sus reservas; la administración, todas las de su conjunto.
create policy "ver mis reservas" on public.reservas
  for select to authenticated using (
    perfil_id = auth.uid() or (public.es_admin() and conjunto_id = public.mi_conjunto())
  );

revoke all on public.reservas from anon, authenticated;
grant select on public.reservas to authenticated;

-- Franjas ocupadas de una zona (sin decir quién ni para qué).
create or replace function public.franjas_ocupadas(p_zona text, p_desde date, p_hasta date)
returns table (fecha date, inicio time, mia boolean, estado text)
language sql stable security definer set search_path = public
as $$
  select r.fecha, r.inicio, r.perfil_id = auth.uid(), case when r.perfil_id = auth.uid() then r.estado end
  from public.reservas r
  where r.conjunto_id = public.mi_conjunto() and r.zona = p_zona
    and r.fecha between p_desde and p_hasta and r.estado in ('pendiente', 'aprobada')
$$;

-- Z4/Z7 · Reservar. Los turnos quedan confirmados; el salón y la BBQ esperan a la administración.
create or replace function public.reservar_zona(
  p_zona text,
  p_lugar text,
  p_fecha date,
  p_inicio time,
  p_fin time,
  p_tipo text,
  p_motivo text,
  p_invitados integer
)
returns table (id uuid, estado text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_id uuid;
  v_estado text := case when p_tipo = 'turno' then 'aprobada' else 'pendiente' end;
begin
  if public.mi_conjunto() is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if p_fecha < public.hoy_colombia() then
    raise exception 'FECHA_PASADA' using errcode = 'P0001';
  end if;

  insert into public.reservas (conjunto_id, perfil_id, zona, lugar, fecha, inicio, fin, tipo, motivo, invitados, estado)
  values (public.mi_conjunto(), auth.uid(), p_zona, p_lugar, p_fecha, p_inicio, p_fin, p_tipo,
          nullif(trim(p_motivo), ''), p_invitados, v_estado)
  returning reservas.id into v_id;

  return query select v_id, v_estado;
exception
  when unique_violation then
    raise exception 'FRANJA_OCUPADA' using errcode = 'P0001';
end;
$$;

-- Cancelar una reserva propia (libera la franja).
create or replace function public.cancelar_reserva(p_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.reservas set estado = 'cancelada'
  where id = p_id and perfil_id = auth.uid() and estado in ('pendiente', 'aprobada', 'propuesta')
$$;

-- ─────────────────────── Decisiones de la administración ───────────────────────

-- X3 · Aprobar, rechazar o proponer otra fecha. p_tipo: 'actividad' o 'reserva'.
create or replace function public.decidir_solicitud(p_tipo text, p_id uuid, p_decision text, p_mensaje text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_estado text := case p_decision when 'aprobar' then 'aprobada' when 'rechazar' then 'rechazada' when 'proponer' then 'propuesta' end;
  v_res public.reservas%rowtype;
  v_perfil record;
  v_actividad uuid;
begin
  if not public.es_admin() then
    raise exception 'SOLO_ADMIN' using errcode = 'P0001';
  end if;
  if v_estado is null then
    raise exception 'DECISION_INVALIDA' using errcode = 'P0001';
  end if;

  if p_tipo = 'actividad' then
    update public.actividades
    set estado = case when v_estado = 'aprobada' then 'publicada' else v_estado end,
        respuesta = nullif(trim(p_mensaje), ''),
        decidido_en = now()
    where id = p_id and conjunto_id = public.mi_conjunto() and estado = 'pendiente';
    if not found then
      raise exception 'YA_DECIDIDA' using errcode = 'P0001';
    end if;
    return;
  end if;

  update public.reservas
  set estado = v_estado, respuesta = nullif(trim(p_mensaje), ''), decidido_en = now()
  where id = p_id and conjunto_id = public.mi_conjunto() and estado = 'pendiente'
  returning * into v_res;
  if not found then
    raise exception 'YA_DECIDIDA' using errcode = 'P0001';
  end if;

  -- "Actividad para la comunidad": al aprobarla aparece en la Agenda para que se inscriban.
  if v_estado = 'aprobada' and v_res.tipo = 'comunidad' then
    select p.nombre, t.nombre as torre into v_perfil
    from public.perfiles p
    join public.apartamentos a on a.id = p.apartamento_id
    join public.torres t on t.id = a.torre_id
    where p.id = v_res.perfil_id;

    insert into public.actividades (
      conjunto_id, slug, tipo, estado, titulo, fecha, inicio, fin, lugar, cupos,
      organizador_id, organizador_nombre, organizador_torre, decidido_en
    ) values (
      v_res.conjunto_id,
      'reserva-' || substr(replace(v_res.id::text, '-', ''), 1, 10),
      'actividad', 'publicada', coalesce(v_res.motivo, 'Actividad en ' || v_res.lugar),
      v_res.fecha, v_res.inicio, v_res.fin, v_res.lugar, v_res.invitados,
      v_res.perfil_id, split_part(v_perfil.nombre, ' ', 1), v_perfil.torre, now()
    )
    returning id into v_actividad;
    update public.reservas set actividad_id = v_actividad where id = v_res.id;
  end if;
end;
$$;

revoke all on function
  public.proponer_actividad(text, text, date, time, time, text, integer, boolean),
  public.franjas_ocupadas(text, date, date),
  public.reservar_zona(text, text, date, time, time, text, text, integer),
  public.cancelar_reserva(uuid),
  public.decidir_solicitud(text, uuid, text, text)
from public;
grant execute on function
  public.proponer_actividad(text, text, date, time, time, text, integer, boolean),
  public.franjas_ocupadas(text, date, date),
  public.reservar_zona(text, text, date, time, time, text, text, integer),
  public.cancelar_reserva(uuid),
  public.decidir_solicitud(text, uuid, text, text)
to authenticated;

-- X2 · Solicitudes pendientes (actividades con zona y reservas) con lo que la administración necesita ver.
create or replace view public.solicitudes
with (security_invoker = true)
as
  select
    'actividad'::text as tipo, a.id, a.conjunto_id, a.estado, a.titulo, a.fecha, a.inicio, a.fin, a.lugar,
    null::text as zona, a.cupos as personas, a.descripcion as mensaje, 'comunidad'::text as alcance,
    a.organizador_id as perfil_id, a.created_at, a.respuesta
  from public.actividades a
  where a.organizador_id is not null
  union all
  select
    'reserva', r.id, r.conjunto_id, r.estado, coalesce(r.motivo, 'Reserva'), r.fecha, r.inicio, r.fin, r.lugar,
    r.zona, r.invitados, r.motivo, r.tipo, r.perfil_id, r.created_at, r.respuesta
  from public.reservas r
  where r.tipo <> 'turno';

grant select on public.solicitudes to authenticated;
