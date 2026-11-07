-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · Datos iniciales: Residencial Samán y códigos de prueba
-- Pegar en Supabase → SQL Editor → Run, DESPUÉS de 0001_base.sql.
-- ════════════════════════════════════════════════════════════════════

-- Conjunto
insert into public.conjuntos (slug, nombre) values ('saman', 'Residencial Samán');

-- Torres A–E
insert into public.torres (conjunto_id, nombre)
select c.id, t from public.conjuntos c, unnest(array['A', 'B', 'C', 'D', 'E']) as t
where c.slug = 'saman';

-- Apartamentos de prueba (pisos 1 a 4, dos por piso) + la oficina de la administración (A-001)
insert into public.apartamentos (torre_id, numero)
select t.id, n
from public.torres t
join public.conjuntos c on c.id = t.conjunto_id and c.slug = 'saman',
unnest(array['101', '102', '201', '202', '301', '302', '401', '402']) as n;

insert into public.apartamentos (torre_id, numero)
select t.id, '001' from public.torres t join public.conjuntos c on c.id = t.conjunto_id
where c.slug = 'saman' and t.nombre = 'A';

insert into public.apartamentos (torre_id, numero)
select t.id, '204' from public.torres t join public.conjuntos c on c.id = t.conjunto_id
where c.slug = 'saman' and t.nombre = 'E'
on conflict do nothing;

-- Códigos de residencia (cada uno sirve para UNA cuenta)
with u as (
  select t.nombre as torre, a.numero, a.id
  from public.apartamentos a
  join public.torres t on t.id = a.torre_id
  join public.conjuntos c on c.id = t.conjunto_id and c.slug = 'saman'
)
insert into public.codigos_residencia (codigo, apartamento_id, rol)
select v.codigo, u.id, v.rol::public.rol
from (values
  ('SAM-E204-K7Q', 'E', '204', 'vecino'),          -- Sandra (la cuenta demo)
  ('SAM-B402-M3P', 'B', '402', 'vecino'),          -- Camila
  ('SAM-A101-R8T', 'A', '101', 'vecino'),
  ('SAM-C301-X2L', 'C', '301', 'vecino'),
  ('SAM-D102-H5N', 'D', '102', 'vecino'),
  ('SAM-B201-J4W', 'B', '201', 'vecino'),
  ('SAM-C202-P9D', 'C', '202', 'vecino'),
  ('SAM-A001-ADM', 'A', '001', 'administracion')   -- Administración (/admin)
) as v (codigo, torre, numero, rol)
join u on u.torre = v.torre and u.numero = v.numero;
