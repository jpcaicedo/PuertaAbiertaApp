-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0002 · Agenda (actividades e inscripciones) y avisos
-- Requiere 0001_base.sql. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────── Funciones de ayuda ───────────────────────

-- Torre del usuario actual ("A", "B", …), para los avisos dirigidos a una torre.
create or replace function public.mi_torre()
returns text
language sql stable security definer set search_path = public
as $$
  select t.nombre
  from public.perfiles p
  join public.apartamentos a on a.id = p.apartamento_id
  join public.torres t on t.id = a.torre_id
  where p.id = auth.uid()
$$;

-- Fecha de hoy en Colombia (la base de datos trabaja en UTC).
create or replace function public.hoy_colombia()
returns date
language sql stable
as $$ select (now() at time zone 'America/Bogota')::date $$;

-- ─────────────────────────── Avisos ───────────────────────────

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null default public.mi_conjunto() references public.conjuntos (id) on delete cascade,
  autor_id uuid default auth.uid() references public.perfiles (id) on delete set null,
  titulo text not null check (char_length(titulo) between 4 and 60),
  mensaje text not null check (char_length(mensaje) between 10 and 400),
  -- "Jueves 12 de noviembre" o lo que escriba la administración en "Fecha y hora".
  cuando text not null check (char_length(cuando) between 1 and 80),
  horario text check (char_length(horario) <= 60),
  lugar text check (char_length(lugar) <= 80),
  -- Línea corta de la tarjeta de Inicio. Si falta, se usa "cuando".
  resumen text check (char_length(resumen) <= 120),
  -- 'todos' o el nombre de una torre.
  audiencia text not null default 'todos' check (char_length(audiencia) between 1 and 10),
  compartible boolean not null default true,
  notificar boolean not null default true,
  activo boolean not null default true,
  publicado_en timestamptz not null default now()
);

create index on public.avisos (conjunto_id, publicado_en desc);

alter table public.avisos enable row level security;

-- Cada residente ve los avisos activos de su conjunto dirigidos a todos o a su torre.
-- La administración ve todos los de su conjunto.
create policy "ver avisos de mi conjunto" on public.avisos
  for select to authenticated using (
    conjunto_id = public.mi_conjunto()
    and (public.es_admin() or (activo and (audiencia = 'todos' or audiencia = public.mi_torre())))
  );

create policy "admin publica avisos" on public.avisos
  for insert to authenticated with check (
    public.es_admin() and conjunto_id = public.mi_conjunto() and autor_id = auth.uid()
  );

create policy "admin edita avisos" on public.avisos
  for update to authenticated using (public.es_admin() and conjunto_id = public.mi_conjunto());

revoke all on public.avisos from anon, authenticated;
grant select on public.avisos to authenticated;
grant insert (titulo, mensaje, cuando, horario, lugar, resumen, audiencia, compartible, notificar)
  on public.avisos to authenticated;
grant update (activo) on public.avisos to authenticated;

-- ─────────────────────────── Agenda ───────────────────────────

create table public.actividades (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  -- Parte de la URL: /agenda/yoga-al-atardecer
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- 'actividad' = del conjunto, con cupos · 'barrio' = evento cercano que compartió un vecino.
  tipo text not null check (tipo in ('actividad', 'barrio')),
  estado text not null default 'publicada' check (estado in ('pendiente', 'publicada', 'rechazada', 'cancelada')),
  titulo text not null check (char_length(titulo) between 3 and 80),
  fecha date not null,
  inicio time not null,
  fin time not null check (fin > inicio),
  lugar text not null,
  categorias text[] not null default '{}',
  imagen text,
  imagen_alt text,
  descripcion text not null default '',
  cupos integer check (cupos between 1 and 500),
  -- Inscritos que no tienen cuenta en la app (datos de ejemplo o inscritos en portería).
  inscritos_base integer not null default 0 check (inscritos_base >= 0),
  organizador_id uuid references public.perfiles (id) on delete set null,
  organizador_nombre text not null,
  organizador_torre text,
  organizador_lider boolean not null default false,
  -- Datos de los eventos del barrio (distancia, costo, quién lo compartió…) y vecinos de ejemplo.
  extra jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (conjunto_id, slug)
);

create index on public.actividades (conjunto_id, fecha);

create table public.inscripciones (
  actividad_id uuid not null references public.actividades (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  -- inscrito / espera (actividades) · voy (eventos del barrio)
  estado text not null check (estado in ('inscrito', 'espera', 'voy')),
  created_at timestamptz not null default now(),
  primary key (actividad_id, perfil_id)
);

create index on public.inscripciones (perfil_id);

alter table public.actividades enable row level security;
alter table public.inscripciones enable row level security;

create policy "ver actividades de mi conjunto" on public.actividades
  for select to authenticated using (
    conjunto_id = public.mi_conjunto()
    and (estado = 'publicada' or organizador_id = auth.uid() or public.es_admin())
  );

-- Se ve quién va a las actividades del propio conjunto ("Quién va").
create policy "ver inscripciones de mi conjunto" on public.inscripciones
  for select to authenticated using (
    exists (select 1 from public.actividades a where a.id = actividad_id and a.conjunto_id = public.mi_conjunto())
  );

-- Las inscripciones solo se cambian con las funciones de abajo, que revisan los cupos.
revoke all on public.actividades, public.inscripciones from anon, authenticated;
grant select on public.actividades, public.inscripciones to authenticated;

-- Inscribirse (A3/A4). Si ya no hay cupo queda en lista de espera (A5).
-- Devuelve el estado final y, si quedó en espera, su puesto.
create or replace function public.inscribirme(p_actividad uuid)
returns table (estado text, puesto integer)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_act public.actividades%rowtype;
  v_ocupados integer;
  v_estado text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  -- Bloquea la actividad para que dos personas no tomen el último cupo a la vez.
  select * into v_act from public.actividades a
  where a.id = p_actividad and a.conjunto_id = public.mi_conjunto() and a.estado = 'publicada' and a.tipo = 'actividad'
  for update;
  if not found then
    raise exception 'ACTIVIDAD_NO_EXISTE' using errcode = 'P0001';
  end if;

  select i.estado into v_estado from public.inscripciones i
  where i.actividad_id = p_actividad and i.perfil_id = auth.uid();

  if v_estado is null then
    select v_act.inscritos_base + count(*) into v_ocupados
    from public.inscripciones i where i.actividad_id = p_actividad and i.estado = 'inscrito';

    -- Si hay cupo y nadie esperando, entra; si no, a la fila.
    v_estado := case
      when (v_act.cupos is null or v_ocupados < v_act.cupos)
        and not exists (select 1 from public.inscripciones i where i.actividad_id = p_actividad and i.estado = 'espera')
      then 'inscrito' else 'espera' end;
    insert into public.inscripciones (actividad_id, perfil_id, estado) values (p_actividad, auth.uid(), v_estado);
  end if;

  return query
    select v_estado,
      case when v_estado = 'espera' then (
        select count(*)::integer from public.inscripciones i
        where i.actividad_id = p_actividad and i.estado = 'espera'
          and i.created_at <= (select created_at from public.inscripciones
                               where actividad_id = p_actividad and perfil_id = auth.uid())
      ) end;
end;
$$;

-- Cancelar (inscripción o lista de espera). Si se libera un cupo, pasa el primero de la lista de espera.
create or replace function public.cancelar_inscripcion(p_actividad uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_estado text;
  v_siguiente uuid;
begin
  perform 1 from public.actividades where id = p_actividad for update;

  delete from public.inscripciones
  where actividad_id = p_actividad and perfil_id = auth.uid() and estado in ('inscrito', 'espera')
  returning estado into v_estado;

  if v_estado = 'inscrito' then
    select perfil_id into v_siguiente from public.inscripciones
    where actividad_id = p_actividad and estado = 'espera'
    order by created_at limit 1;
    if v_siguiente is not null then
      update public.inscripciones set estado = 'inscrito'
      where actividad_id = p_actividad and perfil_id = v_siguiente;
    end if;
  end if;
end;
$$;

-- "Voy" a un evento del barrio (A9/A10). p_voy = false lo quita.
create or replace function public.marcar_voy(p_actividad uuid, p_voy boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.actividades
    where id = p_actividad and conjunto_id = public.mi_conjunto() and estado = 'publicada' and tipo = 'barrio'
  ) then
    raise exception 'ACTIVIDAD_NO_EXISTE' using errcode = 'P0001';
  end if;

  if p_voy then
    insert into public.inscripciones (actividad_id, perfil_id, estado)
    values (p_actividad, auth.uid(), 'voy')
    on conflict (actividad_id, perfil_id) do nothing;
  else
    delete from public.inscripciones where actividad_id = p_actividad and perfil_id = auth.uid() and estado = 'voy';
  end if;
end;
$$;

revoke all on function public.inscribirme(uuid), public.cancelar_inscripcion(uuid), public.marcar_voy(uuid, boolean) from public;
grant execute on function public.inscribirme(uuid), public.cancelar_inscripcion(uuid), public.marcar_voy(uuid, boolean) to authenticated;

-- Para "Quién va": nombre y foto de los vecinos inscritos, respetando que el perfil sea visible en el directorio.
create or replace view public.asistentes
with (security_invoker = true)
as
  select i.actividad_id, i.estado, i.created_at, p.id as perfil_id, p.nombre, p.avatar_url, t.nombre as torre
  from public.inscripciones i
  join public.perfiles p on p.id = i.perfil_id
  join public.apartamentos a on a.id = p.apartamento_id
  join public.torres t on t.id = a.torre_id
  where p.en_directorio or p.id = auth.uid();

grant select on public.asistentes to authenticated;
