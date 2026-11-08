-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0006 · Mensajes a vecinos de ejemplo y borrar mensajes.
-- Requiere 0001–0005. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- Un mensaje va a un vecino con cuenta (para) o a uno de ejemplo (para_demo), nunca a los dos.
-- para_demo: "s:<slug del servicio>" o "p:<slug del producto>". Se guarda lo que uno escribió;
-- el vecino de ejemplo nunca responde.
alter table public.mensajes alter column para drop not null;
alter table public.mensajes add column if not exists para_demo text check (para_demo ~ '^[sp]:[a-z0-9-]+$');
alter table public.mensajes drop constraint if exists mensajes_destino;
alter table public.mensajes add constraint mensajes_destino check ((para is null) <> (para_demo is null));

-- "Eliminar para mí" de un mensaje recibido: deja de verlo solo quien lo recibió.
alter table public.mensajes add column if not exists oculto_para_receptor boolean not null default false;

create index if not exists mensajes_para_demo_idx on public.mensajes (de, para_demo) where para_demo is not null;

drop policy if exists "enviar mensajes" on public.mensajes;
create policy "enviar mensajes" on public.mensajes
  for insert to authenticated with check (
    de = auth.uid()
    and conjunto_id = public.mi_conjunto()
    and (
      -- A un vecino del conjunto que acepta mensajes.
      (para is not null and exists (
        select 1 from public.perfiles p
        join public.apartamentos a on a.id = p.apartamento_id
        join public.torres t on t.id = a.torre_id
        where p.id = para and p.recibe_mensajes and t.conjunto_id = public.mi_conjunto()
      ))
      -- A un vecino de ejemplo (servicio o producto sin cuenta) del conjunto.
      or (para_demo like 's:%' and exists (
        select 1 from public.servicios s
        where s.slug = substr(para_demo, 3) and s.perfil_id is null and s.conjunto_id = public.mi_conjunto()
      ))
      or (para_demo like 'p:%' and exists (
        select 1 from public.productos pr
        where pr.slug = substr(para_demo, 3) and pr.perfil_id is null and pr.conjunto_id = public.mi_conjunto()
      ))
    )
  );

-- Borrar para todos: solo los mensajes que uno envió.
drop policy if exists "borrar mis mensajes" on public.mensajes;
create policy "borrar mis mensajes" on public.mensajes
  for delete to authenticated using (de = auth.uid());

grant insert (para_demo) on public.mensajes to authenticated;
grant update (oculto_para_receptor) on public.mensajes to authenticated;
grant delete on public.mensajes to authenticated;
