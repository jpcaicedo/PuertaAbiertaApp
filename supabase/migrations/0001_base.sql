-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0001 · Base: conjuntos, apartamentos, códigos y perfiles
-- Pegar completo en Supabase → SQL Editor → Run. Se corre una sola vez.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────── Tipos ───────────────────────────

create type public.rol as enum ('vecino', 'administracion');

-- ─────────────────────────── Tablas ───────────────────────────

-- Un conjunto residencial de Skema (Residencial Samán, …).
create table public.conjuntos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table public.torres (
  id uuid primary key default gen_random_uuid(),
  conjunto_id uuid not null references public.conjuntos (id) on delete cascade,
  nombre text not null, -- "A", "B", …
  unique (conjunto_id, nombre)
);

create table public.apartamentos (
  id uuid primary key default gen_random_uuid(),
  torre_id uuid not null references public.torres (id) on delete cascade,
  numero text not null, -- "204"
  unique (torre_id, numero)
);

-- Código que entrega la administración o Skema. Se usa una sola vez para registrarse.
create table public.codigos_residencia (
  codigo text primary key check (codigo ~ '^[A-Z]{3}-[A-Z][0-9]{3}-[A-Z0-9]{3}$'),
  apartamento_id uuid not null references public.apartamentos (id) on delete cascade,
  rol public.rol not null default 'vecino',
  usado_por uuid references auth.users (id) on delete set null,
  usado_en timestamptz,
  created_at timestamptz not null default now()
);

-- Perfil del residente. Se crea solo, al registrarse (ver handle_new_user).
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  apartamento_id uuid not null references public.apartamentos (id),
  rol public.rol not null default 'vecino',
  nombre text not null check (char_length(nombre) between 3 and 80),
  bio text check (char_length(bio) <= 160),
  avatar_url text,
  telefono text,
  -- Privacidad (P3): por defecto solo se ve el nombre y la torre.
  mostrar_apartamento boolean not null default false,
  mostrar_telefono boolean not null default false,
  en_directorio boolean not null default true,
  recibe_mensajes boolean not null default true,
  -- Autorizaciones de R5 (Ley 1581 de 2012).
  acepto_normas_en timestamptz not null,
  acepto_datos_en timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.torres (conjunto_id);
create index on public.apartamentos (torre_id);
create index on public.perfiles (apartamento_id);

-- ─────────────────────── Funciones de ayuda ───────────────────────

-- Conjunto del usuario que hace la consulta.
create or replace function public.mi_conjunto()
returns uuid
language sql stable security definer set search_path = public
as $$
  select t.conjunto_id
  from public.perfiles p
  join public.apartamentos a on a.id = p.apartamento_id
  join public.torres t on t.id = a.torre_id
  where p.id = auth.uid()
$$;

-- ¿El usuario actual es de la administración?
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administracion')
$$;

-- R2: valida un código sin exponer la tabla. Devuelve la unidad si existe y no se ha usado.
create or replace function public.validar_codigo(p_codigo text)
returns table (conjunto text, torre text, apartamento text)
language sql stable security definer set search_path = public
as $$
  select c.nombre, t.nombre, a.numero
  from public.codigos_residencia cr
  join public.apartamentos a on a.id = cr.apartamento_id
  join public.torres t on t.id = a.torre_id
  join public.conjuntos c on c.id = t.conjunto_id
  where cr.codigo = upper(trim(p_codigo)) and cr.usado_por is null
$$;

revoke all on function public.validar_codigo(text) from public;
grant execute on function public.validar_codigo(text) to anon, authenticated;

-- Al crear la cuenta (auth.signUp) se crea el perfil y se gasta el código, todo en la misma transacción.
-- Si el código no sirve o faltan las autorizaciones, el registro completo se cancela.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_codigo text := upper(trim(new.raw_user_meta_data ->> 'codigo'));
  v_cr public.codigos_residencia%rowtype;
begin
  -- Usuarios creados a mano desde el panel de Supabase: sin perfil.
  if v_codigo is null then
    return new;
  end if;

  select * into v_cr
  from public.codigos_residencia
  where codigo = v_codigo and usado_por is null
  for update;

  if not found then
    raise exception 'CODIGO_INVALIDO' using errcode = 'P0001';
  end if;

  if coalesce((new.raw_user_meta_data ->> 'acepto_normas')::boolean, false) is false
     or coalesce((new.raw_user_meta_data ->> 'acepto_datos')::boolean, false) is false then
    raise exception 'FALTAN_AUTORIZACIONES' using errcode = 'P0001';
  end if;

  insert into public.perfiles (id, apartamento_id, rol, nombre, acepto_normas_en, acepto_datos_en)
  values (
    new.id,
    v_cr.apartamento_id,
    v_cr.rol,
    trim(new.raw_user_meta_data ->> 'nombre'),
    now(),
    now()
  );

  update public.codigos_residencia set usado_por = new.id, usado_en = now() where codigo = v_codigo;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger perfiles_updated_at
  before update on public.perfiles
  for each row execute function public.tocar_updated_at();

-- ─────────────────────── Seguridad por fila (RLS) ───────────────────────

alter table public.conjuntos enable row level security;
alter table public.torres enable row level security;
alter table public.apartamentos enable row level security;
alter table public.codigos_residencia enable row level security;
alter table public.perfiles enable row level security;

-- Cada vecino solo ve su propio conjunto.
create policy "ver mi conjunto" on public.conjuntos
  for select to authenticated using (id = public.mi_conjunto());

create policy "ver torres de mi conjunto" on public.torres
  for select to authenticated using (conjunto_id = public.mi_conjunto());

create policy "ver apartamentos de mi conjunto" on public.apartamentos
  for select to authenticated using (
    exists (select 1 from public.torres t where t.id = torre_id and t.conjunto_id = public.mi_conjunto())
  );

-- Códigos: solo la administración de ese conjunto puede verlos. Nadie los edita desde la app.
create policy "admin ve los códigos de su conjunto" on public.codigos_residencia
  for select to authenticated using (
    public.es_admin() and exists (
      select 1 from public.apartamentos a join public.torres t on t.id = a.torre_id
      where a.id = apartamento_id and t.conjunto_id = public.mi_conjunto()
    )
  );

-- Perfiles: se ven los vecinos del mismo conjunto; cada uno edita solo el suyo.
create policy "ver perfiles de mi conjunto" on public.perfiles
  for select to authenticated using (
    id = auth.uid() or exists (
      select 1 from public.apartamentos a join public.torres t on t.id = a.torre_id
      where a.id = apartamento_id and t.conjunto_id = public.mi_conjunto()
    )
  );

create policy "editar mi perfil" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Nadie puede cambiarse el rol ni el apartamento desde la app: solo estas columnas son editables.
revoke insert, update, delete on public.perfiles from anon, authenticated;
grant update (nombre, bio, avatar_url, telefono, mostrar_apartamento, mostrar_telefono, en_directorio, recibe_mensajes)
  on public.perfiles to authenticated;

revoke insert, update, delete on public.conjuntos, public.torres, public.apartamentos, public.codigos_residencia
  from anon, authenticated;
