-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0008 · No inscribirse a actividades que ya empezaron.
-- Requiere 0001–0007. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- Antes de guardar una inscripción revisa la hora de Colombia:
--   · inscribirse o entrar a la lista de espera: solo antes de que empiece
--   · "Voy" a un evento del barrio: hasta que termine
create or replace function public.tg_inscripcion_a_tiempo()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_act public.actividades%rowtype;
  v_ahora timestamp := now() at time zone 'America/Bogota';
begin
  select * into v_act from public.actividades where id = new.actividad_id;
  if new.estado in ('inscrito', 'espera') and (v_act.fecha + v_act.inicio) <= v_ahora then
    raise exception 'ACTIVIDAD_YA_EMPEZO' using errcode = 'P0001';
  end if;
  if new.estado = 'voy' and (v_act.fecha + v_act.fin) <= v_ahora then
    raise exception 'ACTIVIDAD_YA_TERMINO' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists inscripciones_a_tiempo on public.inscripciones;
create trigger inscripciones_a_tiempo before insert on public.inscripciones
  for each row execute function public.tg_inscripcion_a_tiempo();
