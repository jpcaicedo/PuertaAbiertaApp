-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0012 · Fotos y audios en los chats.
-- Los archivos van a una carpeta PRIVADA ("chat"): solo los pueden abrir quien
-- lo envió y quien lo recibió, con enlaces temporales.
-- Requiere 0001–0011. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

-- texto · foto · audio
alter table public.mensajes add column if not exists tipo text not null default 'texto'
  check (tipo in ('texto', 'foto', 'audio'));
-- Ruta del archivo en la carpeta "chat": <id de quien envía>/<archivo>
alter table public.mensajes add column if not exists adjunto text;
-- Duración del audio en segundos.
alter table public.mensajes add column if not exists duracion integer check (duracion between 0 and 600);

-- Una foto o un audio pueden ir sin texto.
alter table public.mensajes alter column texto set default '';
alter table public.mensajes drop constraint if exists mensajes_texto_check;
alter table public.mensajes drop constraint if exists mensajes_contenido;
alter table public.mensajes add constraint mensajes_contenido check (
  char_length(texto) <= 1000
  and (
    (tipo = 'texto' and char_length(trim(texto)) >= 1 and adjunto is null)
    or (tipo in ('foto', 'audio') and adjunto is not null)
  )
);

-- Solo se pueden adjuntar archivos de la propia carpeta.
drop policy if exists "adjunto propio" on public.mensajes;
create policy "adjunto propio" on public.mensajes
  as restrictive for insert to authenticated
  with check (adjunto is null or split_part(adjunto, '/', 1) = auth.uid()::text);

grant insert (tipo, adjunto, duracion) on public.mensajes to authenticated;

-- La notificación dice qué llegó, como en WhatsApp.
create or replace function public.tg_mensaje()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_nombre text;
  v_producto text;
  v_titulo text;
  v_cuerpo text;
begin
  if new.para is null then
    return new; -- vecino de ejemplo: nadie lo recibe
  end if;
  select split_part(nombre, ' ', 1) into v_nombre from public.perfiles where id = new.de;
  if new.producto_id is not null then
    select titulo into v_producto from public.productos where id = new.producto_id;
  end if;

  v_titulo := case new.tipo
    when 'foto' then v_nombre || ' te envió una foto'
    when 'audio' then v_nombre || ' te envió un audio'
    else v_nombre || ' te escribió' end
    || coalesce(' por «' || v_producto || '»', '');
  v_cuerpo := case new.tipo
    when 'foto' then coalesce(nullif(trim(new.texto), ''), 'Foto')
    when 'audio' then 'Mensaje de voz' || coalesce(' (' || (new.duracion / 60) || ':' || lpad((new.duracion % 60)::text, 2, '0') || ')', '')
    else new.texto end;

  perform public.notificar(new.para, 'messages', 'brand', v_titulo, v_cuerpo, '/mensajes/' || new.de, 'mensajes:' || new.de);
  return new;
end;
$$;

-- ─────────────────────── Carpeta privada "chat" ───────────────────────

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('chat', 'chat', false, 10485760,
            array['image/jpeg', 'image/png', 'image/webp', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/aac'])
    on conflict (id) do nothing;

    -- Subir: cada vecino solo en su carpeta.
    execute $p$
      create policy "chat subir" on storage.objects for insert to authenticated
      with check (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    -- Ver: quien lo subió, o quien recibió el mensaje que lo lleva.
    execute $p$
      create policy "chat ver" on storage.objects for select to authenticated
      using (
        bucket_id = 'chat' and (
          (storage.foldername(name))[1] = auth.uid()::text
          or exists (select 1 from public.mensajes m where m.adjunto = name and m.para = auth.uid())
        )
      )
    $p$;
    -- Borrar: solo quien lo subió (al "Eliminar para todos").
    execute $p$
      create policy "chat borrar" on storage.objects for delete to authenticated
      using (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
  end if;
end $$;
