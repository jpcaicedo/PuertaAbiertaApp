-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · Datos de ejemplo de la agenda y los avisos (Residencial Samán)
-- Correr después de 0002_agenda_avisos.sql. Las fechas se calculan desde hoy.
-- ════════════════════════════════════════════════════════════════════

-- Avisos
insert into public.avisos (conjunto_id, autor_id, titulo, mensaje, cuando, horario, lugar, resumen, audiencia, compartible, publicado_en)
select c.id, null, v.titulo, v.mensaje, v.cuando, v.horario, v.lugar, v.resumen, 'todos', v.compartible, now() - v.hace
from public.conjuntos c,
(values
  (
    'Mantenimiento ascensores, Torre B',
    'La empresa de mantenimiento hará la revisión anual obligatoria. Durante ese horario los ascensores de la Torre B no funcionan. Si necesitas ayuda para subir compras o tienes movilidad reducida, avisa en portería y te acompañamos por la Torre A.',
    'Jueves 12 de noviembre', '8:00 a. m. a 12:00 m.', 'Torre B, ascensores 1 y 2',
    'Jueves 12 de noviembre de 8:00 a. m. a 12:00 m.', true, interval '2 hours'
  ),
  (
    'Asamblea ordinaria de copropietarios',
    'Revisamos el presupuesto de 2027 y elegimos el nuevo consejo. Si no puedes asistir, deja tu poder firmado en la administración.',
    'Sábado 21 de noviembre', '9:00 a. m.', 'Salón social, Torre A',
    'Sábado 21 de noviembre, 9:00 a. m., salón social', false, interval '1 day'
  )
) as v (titulo, mensaje, cuando, horario, lugar, resumen, compartible, hace)
where c.slug = 'saman';

-- Agenda
insert into public.actividades (
  conjunto_id, slug, tipo, titulo, fecha, inicio, fin, lugar, categorias, imagen, imagen_alt, descripcion,
  cupos, inscritos_base, organizador_nombre, organizador_torre, organizador_lider, extra
)
select c.id, v.slug, v.tipo, v.titulo, public.hoy_colombia() + v.dias, v.inicio::time, v.fin::time, v.lugar,
  v.categorias, v.imagen, v.imagen_alt, v.descripcion, v.cupos, v.base, v.org, v.torre, v.lider, v.extra::jsonb
from public.conjuntos c,
(values
  ('cuentos-y-pintura', 'barrio', 'Tarde de cuentos y pintura para niños', 0, '16:30', '18:00',
   'C. C. Mirador del Sur, piso 2', array['ninos', 'cultura'],
   '/images/actividades/cuentos-y-pintura.jpg', 'Una mujer lee un cuento ilustrado a un grupo de niños',
   '', null::int, 0, 'Camila', 'B', false,
   '{"distanceLabel": "a 3 cuadras",
     "sharedBy": {"name": "Camila", "tower": "B", "avatar": "/images/vecinos/camila.jpg"},
     "sharedByQuote": "Lo hacen cada mes y a mis hijos les encanta. Los cupos son pocos, toca llegar temprano.",
     "costLabel": "Gratis", "audienceLabel": "niños de 4 a 10 años",
     "goingFromBuilding": [{"name": "Camila", "avatar": "/images/vecinos/camila.jpg"}, {"name": "Andrés", "avatar": "/images/vecinos/vecina-2.png"}, {"name": "Marta Lozano"}],
     "organizerNote": "Lo organiza el centro comercial, no Puerta Abierta. La entrada es en el lugar."}'),

  ('yoga-al-atardecer', 'actividad', 'Yoga al atardecer', 0, '18:30', '19:30',
   'Terraza, Torre A', array['deporte'],
   '/images/actividades/yoga-atardecer.jpg', 'Vecinos haciendo yoga en la terraza al atardecer',
   'Clase para todos los niveles. Trae tu mat y una botella de agua. Laura es instructora certificada y vive en la Torre A; organiza esta clase cada miércoles desde hace tres meses.',
   20, 16, 'Laura', 'A', true, '{}'),

  ('cata-de-cafe', 'actividad', 'Cata de café valluno', 0, '19:30', '21:00',
   'Salón social, Torre A', array['comida'],
   '/images/actividades/cata-cafe-valluno.jpg', 'Vecinos en una cata de café en el salón social',
   'Andrés trae cafés de cuatro fincas del Valle y explica cómo catarlos. Incluye pan artesanal.',
   12, 12, 'Andrés', 'C', false, '{}'),

  ('futbol-5', 'actividad', 'Fútbol 5 vecinal', 1, '19:00', '20:30',
   'Cancha sintética', array['deporte'], null, null,
   'Partido amistoso entre torres. Hay petos para todos.',
   10, 7, 'Juan', 'D', false, '{}'),

  ('club-de-lectura', 'actividad', 'Club de lectura', 2, '19:00', '20:30',
   'Biblioteca, Torre C', array['cultura'], null, null,
   'Este mes leemos «Cien años de soledad». No importa si no has terminado el libro.',
   12, 5, 'Laura', 'A', true, '{}'),

  ('huerta-urbana', 'actividad', 'Taller de huerta urbana', 3, '09:00', '11:00',
   'Terraza, Torre B', array['aprender', 'ninos'], null, null,
   'Aprende a sembrar aromáticas en materas recicladas. Los niños son bienvenidos.',
   16, 9, 'Marta', 'E', false, '{}'),

  ('caminata-con-perros', 'actividad', 'Caminata con perros', 4, '07:00', '08:00',
   'Portería principal', array['mascotas', 'deporte'], null, null,
   'Vuelta de una hora por el parque del barrio. Trae bolsas y agua para tu perro.',
   15, 6, 'Hernán', 'B', false, '{}')
) as v (slug, tipo, titulo, dias, inicio, fin, lugar, categorias, imagen, imagen_alt, descripcion,
        cupos, base, org, torre, lider, extra)
where c.slug = 'saman';

-- Vecinos de ejemplo que aparecen en "Quién va" mientras se inscriben los reales.
update public.actividades
set extra = extra || '{"attendees": [{"name": "Camila", "avatar": "/images/vecinos/camila.jpg"}, {"name": "Juan", "avatar": "/images/vecinos/vecina-2.png"}, {"name": "Paula", "avatar": "/images/vecinos/vecina-3.png"}]}'::jsonb
where tipo = 'actividad';
