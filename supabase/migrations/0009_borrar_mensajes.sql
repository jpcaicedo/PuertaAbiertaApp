-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0009 · Borrar mensajes como en WhatsApp:
-- "Eliminar para mí" (también los que uno envió) y "Eliminar para todos".
-- Requiere 0001–0008. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- Quien envió un mensaje puede dejar de verlo sin borrárselo al otro.
alter table public.mensajes add column if not exists oculto_para_emisor boolean not null default false;

-- "Eliminar para mí": oculta el mensaje solo en el chat de quien lo pide (lo haya enviado o recibido).
create or replace function public.ocultar_mensaje(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.mensajes set oculto_para_emisor = true where id = p_id and de = auth.uid();
  if not found then
    update public.mensajes set oculto_para_receptor = true where id = p_id and para = auth.uid();
  end if;
end;
$$;

-- "Vaciar chat": oculta toda la conversación solo para quien la vacía; el otro vecino conserva la suya.
create or replace function public.vaciar_conversacion(p_vecino uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.mensajes set oculto_para_emisor = true where de = auth.uid() and para = p_vecino;
  update public.mensajes set oculto_para_receptor = true where para = auth.uid() and de = p_vecino;
$$;

revoke all on function public.ocultar_mensaje(uuid), public.vaciar_conversacion(uuid) from public, anon;
grant execute on function public.ocultar_mensaje(uuid), public.vaciar_conversacion(uuid) to authenticated;
