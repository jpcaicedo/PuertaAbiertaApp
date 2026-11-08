-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · Servicios de ejemplo del directorio (Residencial Samán)
-- Correr después de 0004_directorio.sql. Son vecinos de muestra sin cuenta:
-- se pueden ver, pero los mensajes solo llegan a vecinos registrados.
-- ════════════════════════════════════════════════════════════════════

insert into public.servicios (
  conjunto_id, slug, perfil_id, categoria, titulo, rol_corto, descripcion, descripcion_larga, precio,
  disponibilidad, mostrar_apartamento, acepta_llamadas, horario_llamadas, extra
)
select c.id, v.slug, null, v.categoria, v.titulo, v.rol, v.descripcion, v.larga, v.precio, v.disponibilidad,
  true, v.llamadas is not null, v.llamadas, v.extra::jsonb
from public.conjuntos c,
(values
  ('camila', 'mascotas', 'Paseadora y entrenadora de mascotas', 'Paseadora de mascotas',
   'Estudiante de veterinaria y entrenadora canina certificada. Paseos grupales en la mañana y en la tarde.',
   'Estudiante de veterinaria y entrenadora canina certificada. Paseos grupales de máximo 4 perros dentro del conjunto y en el parque de la esquina.',
   'Paseo grupal de 1 hora: $15.000', 'Lunes a viernes, 7:00 a. m. y 6:00 p. m.', '8:00 a. m. a 7:00 p. m.',
   '{"name": "Camila Restrepo", "tower": "B", "apartment": "402", "avatar": "/images/vecinos/camila.jpg", "feminine": true,
     "phone": "+573000000010", "rating": 5, "reviewCount": 28,
     "reviews": [
       {"name": "Sandra", "fullName": "Sandra Rojas", "tower": "E", "text": "Toby vuelve feliz y cansado. Siempre manda fotos del paseo."},
       {"name": "Andrés", "fullName": "Andrés Pardo", "tower": "C", "text": "Muy puntual. Le ayudó a mi perro a dejar de jalar la correa."}],
     "keywords": ["perros", "perro", "mascotas", "paseo", "paseadora", "entrenadora", "gatos"]}'),
  ('juan', 'clases', 'Clases de inglés', 'Profesor de inglés',
   'Licenciado en idiomas con 8 años de experiencia. Clases para niños y adultos en tu apartamento o en el salón de estudio.',
   'Licenciado en idiomas con 8 años de experiencia. Clases para niños y adultos en tu apartamento o en el salón de estudio. Preparación para exámenes internacionales.',
   'Clase de 1 hora: $45.000', 'Lunes a sábado, 2:00 p. m. a 8:00 p. m.', null,
   '{"name": "Juan Gaviria", "tower": "A", "apartment": "101", "rating": 4.6, "reviewCount": 11,
     "reviews": [{"name": "Laura", "fullName": "Laura Gómez", "tower": "A", "text": "Mi hija pasó de odiar el inglés a pedir más clases."}],
     "keywords": ["inglés", "ingles", "idiomas", "clases", "tareas", "profesor"]}'),
  ('marta', 'comida', 'Postres y tortas por encargo', 'Repostera',
   'Tortas de cumpleaños, cheesecake y postres sin azúcar. Pide con dos días de anticipación.',
   'Tortas de cumpleaños, cheesecake y postres sin azúcar. Pide con dos días de anticipación. Entrego en la portería de tu torre.',
   'Torta para 12 personas: desde $85.000', 'Pedidos de lunes a jueves; entregas hasta el domingo', null,
   '{"name": "Marta Lucía Ospina", "tower": "C", "apartment": "703", "feminine": true, "rating": 4.9, "reviewCount": 19,
     "reviews": [{"name": "Hernán", "fullName": "Hernán Vélez", "tower": "B", "text": "La torta de zanahoria es la mejor que he probado."}],
     "keywords": ["tortas", "postres", "comida", "cumpleaños", "cheesecake", "repostería"]}')
) as v (slug, categoria, titulo, rol, descripcion, larga, precio, disponibilidad, llamadas, extra)
where c.slug = 'saman';
