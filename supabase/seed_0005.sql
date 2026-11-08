-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · Productos de ejemplo del marketplace (Residencial Samán)
-- Correr después de 0005_marketplace.sql. Son vendedores de muestra sin cuenta.
-- ════════════════════════════════════════════════════════════════════

insert into public.productos (
  conjunto_id, slug, perfil_id, titulo, descripcion, precio, precio_anterior, categoria, condicion, condicion_texto, fotos, extra, created_at
)
select c.id, v.slug, null, v.titulo, v.descripcion, v.precio, v.anterior, v.categoria, v.condicion, v.texto,
  array[v.foto], v.extra::jsonb, now() - v.hace
from public.conjuntos c,
(values
  ('buso-talla-m', 'Buso Nike talla M', 'Lo usé dos veces, me quedó grande. Algodón perizado, color negro.',
   90000, null::int, 'ropa', 'como-nuevo', 'Usado · como nuevo', '/images/marketplace/buso.jpg',
   '{"name": "Mateo Rincón", "tower": "D"}', interval '3 hours'),
  ('sudadera-deportiva', 'Sudadera deportiva', 'Conjunto de buso y pantalón, talla S. Lavado a mano.',
   120000, null, 'ropa', 'usado', 'Usado · buen estado', '/images/marketplace/sudadera.jpg',
   '{"name": "Valeria Muñoz", "tower": "A"}', interval '1 day'),
  ('chaqueta-verde-oliva', 'Chaqueta verde oliva', 'Chaqueta de paño, talla 38. Ideal para disfraces o colección.',
   80000, null, 'ropa', 'como-nuevo', 'Usado · como nuevo', '/images/marketplace/chaqueta.jpg',
   '{"name": "Andrés Salazar", "tower": "C"}', interval '2 days'),
  ('balon-autografiado', 'Balón autografiado', 'Balón firmado por el plantel campeón. Incluye certificado.',
   500000, 700000, 'otro', 'usado', 'Colección', '/images/marketplace/balon.jpg',
   '{"name": "Felipe Arango", "tower": "B"}', interval '3 days')
) as v (slug, titulo, descripcion, precio, anterior, categoria, condicion, texto, foto, extra, hace)
where c.slug = 'saman';

-- Un reporte de ejemplo para que la administración tenga algo que revisar (X7).
insert into public.reportes (conjunto_id, producto_id, reportado_por, motivo)
select conjunto_id, id, null, 'Producto prohibido o peligroso'
from public.productos where slug = 'chaqueta-verde-oliva';
