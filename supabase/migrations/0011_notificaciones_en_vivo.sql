-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0011 · Aviso flotante para cada mensaje.
-- Antes, si ya había una notificación sin leer de la misma conversación, se actualizaba
-- (UPDATE) y el aviso flotante no se enteraba. Ahora se reemplaza: se borra la anterior sin
-- leer y se crea una nueva (INSERT), así cada mensaje avisa y en la lista sigue habiendo una
-- sola por conversación.
-- Requiere 0007. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

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
    delete from public.notificaciones where perfil_id = p_perfil and clave = p_clave and leida_en is null;
  end if;

  insert into public.notificaciones (perfil_id, tipo, tono, titulo, cuerpo, href, clave)
  values (p_perfil, p_tipo, p_tono, p_titulo, left(p_cuerpo, 160), p_href, p_clave);
end;
$$;

revoke all on function public.notificar(uuid, text, text, text, text, text, text) from public, anon, authenticated;
