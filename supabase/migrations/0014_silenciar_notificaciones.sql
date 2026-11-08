-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0014 · Interruptor general de notificaciones.
-- Por defecto todo prendido; si el vecino apaga "Notificaciones" en su perfil
-- (notificaciones.all = false), no se le crea ninguna, ni las de la administración.
-- Requiere 0011. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

alter table public.perfiles alter column notificaciones
  set default '{"all": true, "requests": true, "agenda": true, "messages": true, "marketplace": true}';

create or replace function public.notificar(
  p_perfil uuid, p_tipo text, p_tono text, p_titulo text, p_cuerpo text, p_href text, p_clave text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_prefs jsonb;
begin
  if p_perfil is null then
    return;
  end if;
  select notificaciones into v_prefs from public.perfiles where id = p_perfil;

  -- Interruptor general apagado: nada.
  if coalesce((v_prefs ->> 'all')::boolean, true) = false then
    return;
  end if;
  -- Cada tipo según P4 (los avisos y la moderación no se pueden apagar uno por uno).
  if p_tipo not in ('aviso', 'moderacion') and coalesce((v_prefs ->> p_tipo)::boolean, true) = false then
    return;
  end if;

  if p_clave is not null then
    delete from public.notificaciones where perfil_id = p_perfil and clave = p_clave and leida_en is null;
  end if;

  insert into public.notificaciones (perfil_id, tipo, tono, titulo, cuerpo, href, clave)
  values (p_perfil, p_tipo, p_tono, p_titulo, left(p_cuerpo, 160), p_href, p_clave);
end;
$$;

revoke all on function public.notificar(uuid, text, text, text, text, text, text) from public, anon, authenticated;
