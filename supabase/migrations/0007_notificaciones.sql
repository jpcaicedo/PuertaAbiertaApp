-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0007 · Notificaciones dentro de la app (campana de Inicio, N1).
-- Se crean solas con lo que pasa en la base de datos: avisos, respuestas de la
-- administración, mensajes, cupos liberados y reportes.
-- Requiere 0001–0006. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  -- aviso · requests · agenda · messages · marketplace · moderacion (coinciden con las preferencias de P4)
  tipo text not null,
  -- success · brand · warm · neutral (color del icono en N1)
  tono text not null default 'brand',
  titulo text not null,
  cuerpo text not null default '',
  href text not null default '/inicio',
  -- Para agrupar: un solo aviso por conversación con mensajes sin leer.
  clave text,
  created_at timestamptz not null default now(),
  leida_en timestamptz
);

create index on public.notificaciones (perfil_id, created_at desc);
create unique index notificaciones_clave_sin_leer on public.notificaciones (perfil_id, clave) where leida_en is null and clave is not null;

alter table public.notificaciones enable row level security;

create policy "ver mis notificaciones" on public.notificaciones
  for select to authenticated using (perfil_id = auth.uid());
create policy "marcar mis notificaciones" on public.notificaciones
  for update to authenticated using (perfil_id = auth.uid());

revoke all on public.notificaciones from anon, authenticated;
grant select on public.notificaciones to authenticated;
grant update (leida_en) on public.notificaciones to authenticated;

-- Campana en vivo.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;

-- Crea una notificación respetando las preferencias del vecino (P4).
-- Los avisos de la administración y las decisiones de moderación siempre llegan.
create or replace function public.notificar(
  p_perfil uuid, p_tipo text, p_tono text, p_titulo text, p_cuerpo text, p_href text, p_clave text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_quiere boolean;
begin
  if p_perfil is null then
    return;
  end if;
  if p_tipo not in ('aviso', 'moderacion') then
    select coalesce((notificaciones ->> p_tipo)::boolean, true) into v_quiere from public.perfiles where id = p_perfil;
    if not coalesce(v_quiere, false) then
      return;
    end if;
  end if;

  if p_clave is not null then
    -- Si ya hay una sin leer con la misma clave, se actualiza en vez de repetirla.
    update public.notificaciones
    set titulo = p_titulo, cuerpo = left(p_cuerpo, 160), href = p_href, created_at = now()
    where perfil_id = p_perfil and clave = p_clave and leida_en is null;
    if found then
      return;
    end if;
  end if;

  insert into public.notificaciones (perfil_id, tipo, tono, titulo, cuerpo, href, clave)
  values (p_perfil, p_tipo, p_tono, p_titulo, left(p_cuerpo, 160), p_href, p_clave);
end;
$$;

revoke all on function public.notificar(uuid, text, text, text, text, text, text) from public, anon, authenticated;

-- A todos los administradores de un conjunto.
create or replace function public.notificar_admins(
  p_conjunto uuid, p_tipo text, p_tono text, p_titulo text, p_cuerpo text, p_href text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_admin uuid;
begin
  for v_admin in
    select p.id from public.perfiles p
    join public.apartamentos a on a.id = p.apartamento_id
    join public.torres t on t.id = a.torre_id
    where p.rol = 'administracion' and t.conjunto_id = p_conjunto
  loop
    perform public.notificar(v_admin, p_tipo, p_tono, p_titulo, p_cuerpo, p_href);
  end loop;
end;
$$;

revoke all on function public.notificar_admins(uuid, text, text, text, text, text) from public, anon, authenticated;

-- ─────────────────────── Disparadores ───────────────────────

-- Aviso nuevo → vecinos del conjunto (o de la torre a la que va dirigido).
create or replace function public.tg_aviso_nuevo()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_vecino uuid;
begin
  for v_vecino in
    select p.id from public.perfiles p
    join public.apartamentos a on a.id = p.apartamento_id
    join public.torres t on t.id = a.torre_id
    where t.conjunto_id = new.conjunto_id and p.rol = 'vecino'
      and (new.audiencia = 'todos' or t.nombre = new.audiencia)
  loop
    perform public.notificar(v_vecino, 'aviso', 'brand', 'Nuevo aviso de la administración',
      new.titulo || '. ' || new.cuando, '/avisos/' || new.id);
  end loop;
  return new;
end;
$$;

create trigger avisos_notificar after insert on public.avisos
  for each row when (new.activo) execute function public.tg_aviso_nuevo();

-- Reserva: solicitud nueva → administración · respuesta → vecino.
create or replace function public.tg_reserva()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_cuando text := to_char(new.fecha, 'DD/MM') || ', ' || to_char(new.inicio, 'HH24:MI');
begin
  if tg_op = 'INSERT' then
    if new.estado = 'pendiente' then
      perform public.notificar_admins(new.conjunto_id, 'requests', 'warm', 'Nueva solicitud de reserva',
        coalesce(new.motivo, 'Reserva') || ' · ' || new.lugar || ', ' || v_cuando, '/admin/solicitudes/r-' || new.id);
    end if;
  elsif old.estado = 'pendiente' and new.estado <> old.estado then
    perform public.notificar(
      new.perfil_id, 'requests',
      case new.estado when 'aprobada' then 'success' when 'propuesta' then 'warm' else 'neutral' end,
      case new.estado
        when 'aprobada' then 'La administración aprobó tu reserva'
        when 'propuesta' then 'La administración te propone otra fecha'
        else 'La administración no aprobó tu reserva' end,
      coalesce(new.respuesta, new.lugar || ', ' || v_cuando),
      '/perfil/inscripciones');
  end if;
  return new;
end;
$$;

create trigger reservas_notificar after insert or update of estado on public.reservas
  for each row when (new.tipo <> 'turno') execute function public.tg_reserva();

-- Actividad propuesta por un vecino: pendiente → administración · respuesta → organizador.
create or replace function public.tg_actividad()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.organizador_id is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.estado = 'pendiente' then
      perform public.notificar_admins(new.conjunto_id, 'requests', 'warm', 'Un vecino propone una actividad',
        new.titulo || ' · ' || new.lugar, '/admin/solicitudes/a-' || new.id);
    end if;
  elsif old.estado = 'pendiente' and new.estado <> old.estado then
    perform public.notificar(
      new.organizador_id, 'requests',
      case new.estado when 'publicada' then 'success' when 'propuesta' then 'warm' else 'neutral' end,
      case new.estado
        when 'publicada' then 'La administración aprobó tu ' || lower(new.titulo)
        when 'propuesta' then 'La administración te propone otra fecha'
        else 'La administración no aprobó tu actividad' end,
      coalesce(new.respuesta, 'Ya está en la Agenda para el ' || to_char(new.fecha, 'DD/MM') || '.'),
      case when new.estado = 'publicada' then '/agenda/' || new.slug else '/perfil/inscripciones' end);
  end if;
  return new;
end;
$$;

create trigger actividades_notificar after insert or update of estado on public.actividades
  for each row execute function public.tg_actividad();

-- Lista de espera: cuando alguien pasa de "espera" a "inscrito" porque se liberó un cupo.
create or replace function public.tg_cupo_liberado()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_act public.actividades%rowtype;
begin
  if old.estado = 'espera' and new.estado = 'inscrito' then
    select * into v_act from public.actividades where id = new.actividad_id;
    perform public.notificar(new.perfil_id, 'agenda', 'success', 'Se liberó un cupo para ti',
      'Ya estás inscrito en ' || v_act.titulo || ', ' || to_char(v_act.fecha, 'DD/MM') || ' a las ' || to_char(v_act.inicio, 'HH24:MI') || '.',
      '/agenda/' || v_act.slug);
  end if;
  return new;
end;
$$;

create trigger inscripciones_notificar after update of estado on public.inscripciones
  for each row execute function public.tg_cupo_liberado();

-- Mensaje nuevo → quien lo recibe (uno solo por conversación mientras no lo lea).
create or replace function public.tg_mensaje()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_nombre text;
  v_producto text;
begin
  if new.para is null then
    return new; -- vecino de ejemplo: nadie lo recibe
  end if;
  select split_part(nombre, ' ', 1) into v_nombre from public.perfiles where id = new.de;
  if new.producto_id is not null then
    select titulo into v_producto from public.productos where id = new.producto_id;
  end if;
  perform public.notificar(new.para, 'messages', 'brand',
    case when v_producto is not null then v_nombre || ' te escribió por ' || lower(v_producto)
         else v_nombre || ' te escribió' end,
    new.texto, '/mensajes/' || new.de, 'mensajes:' || new.de);
  return new;
end;
$$;

create trigger mensajes_notificar after insert on public.mensajes
  for each row execute function public.tg_mensaje();

-- Reporte nuevo → administración · publicación retirada → vendedor.
create or replace function public.tg_reporte()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_titulo text;
begin
  select titulo into v_titulo from public.productos where id = new.producto_id;
  perform public.notificar_admins(new.conjunto_id, 'requests', 'warm', 'Reportaron una publicación',
    coalesce(v_titulo, 'Producto') || ' · ' || new.motivo, '/admin/reportes/' || new.id);
  return new;
end;
$$;

create trigger reportes_notificar after insert on public.reportes
  for each row execute function public.tg_reporte();

create or replace function public.tg_producto_retirado()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_motivo text;
begin
  if old.estado = 'activo' and new.estado = 'retirado' then
    select motivo into v_motivo from public.reportes where producto_id = new.id order by created_at desc limit 1;
    perform public.notificar(new.perfil_id, 'moderacion', 'neutral', 'La administración retiró tu publicación',
      new.titulo || coalesce(' · Motivo: ' || v_motivo, ''), '/directorio/mis-publicaciones');
  end if;
  return new;
end;
$$;

create trigger productos_notificar after update of estado on public.productos
  for each row execute function public.tg_producto_retirado();
