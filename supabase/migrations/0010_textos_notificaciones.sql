-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0010 · Textos de notificaciones: respeta mayúsculas de los títulos
-- ("Camila te escribió por «Buso Nike talla M»" en vez de "buso nike talla m").
-- Requiere 0007. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

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
    case when v_producto is not null then v_nombre || ' te escribió por «' || v_producto || '»'
         else v_nombre || ' te escribió' end,
    new.texto, '/mensajes/' || new.de, 'mensajes:' || new.de);
  return new;
end;
$$;

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
        when 'publicada' then 'La administración aprobó «' || new.titulo || '»'
        when 'propuesta' then 'La administración te propone otra fecha'
        else 'La administración no aprobó tu actividad' end,
      coalesce(new.respuesta, 'Ya está en la Agenda para el ' || to_char(new.fecha, 'DD/MM') || '.'),
      case when new.estado = 'publicada' then '/agenda/' || new.slug else '/perfil/inscripciones' end);
  end if;
  return new;
end;
$$;
