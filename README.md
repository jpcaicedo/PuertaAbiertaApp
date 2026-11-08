# Puerta Abierta · Skema

Implementación en Next.js del prototipo de Figma **"PI2🏠 Comunidad" › Prototipo final**.

**Stack:** Next.js 15 (App Router), React 19, TypeScript estricto, Tailwind CSS v4, primitivas Radix (las mismas de shadcn/ui), Lucide Icons y Plus Jakarta Sans self-hosted.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Estado

| Flujo | Pantallas | Estado |
| --- | --- | --- |
| 1 · Acceso y registro | R1 – R8b (12) | ✅ |
| 2 · Inicio | I1 – I4 | ✅ |
| 3 · Agenda | A1 – A13 (15) | ✅ |
| 4 · Mapa | M1 – M3 (4) | ✅ |
| 5 · Directorio | D1 – D15 (18) | ✅ |
| 6 · Zonas comunes | Z1 – Z8 (9) | ✅ |
| 7 · Perfil y notificaciones | P1 – P4, N1 (5) | ✅ |
| 8 · Administración | X1 – X8 (8) | ✅ |

## Rutas (flujo 1)

| Ruta | Frame |
| --- | --- |
| `/` | R1 · Bienvenida |
| `/registro/codigo` | R2 · Código de residencia · R2b · Código inválido (estado de error) |
| `/registro/ayuda` | R3 · Ayuda de la administración |
| `/registro/cuenta?codigo=…` | R4 · Crear cuenta |
| `/registro/normas` | R5 · Normas y datos · R5b · No acepta (hoja inferior) |
| `/registro/perfil` | R6 · Perfil (opcional) |
| `/ingresar` | R7 · Iniciar sesión · R7b · Datos incorrectos |
| `/recuperar` | R8 · Recuperar contraseña |
| `/recuperar/enviado?correo=…` | R8b · Enlace enviado |

## Rutas (flujo 2)

| Ruta | Frame |
| --- | --- |
| `/inicio` | I1 · Inicio |
| `/avisos/[id]` | I2 · Detalle del aviso · I3 · Compartir aviso (hoja inferior) |
| — | I4 · Así le llega a un vecino sin la app → etiquetas Open Graph en `layout.tsx` + `public/og-puerta-abierta.png` |

## Rutas (flujo 3)

| Ruta | Frame |
| --- | --- |
| `/agenda?dia=2026-10-14` | A1 · Agenda · A2b (día sin actividades, p. ej. `?dia=2026-10-18`) |
| (hojas en `/agenda`) | A2 · Filtrar · A5 · Cupos llenos · A5b · Lista de espera · A13 · Proponer un plan |
| `/agenda/[id]` | A3 · Detalle · A4 · Inscripción confirmada · A9 · Evento del barrio · A10 · Vas al evento |
| `/agenda/crear` | A6 · Crear actividad |
| `/agenda/crear/enviada` | A7 · Solicitud enviada (simula la aprobación a los 4 s) |
| `/agenda/crear/publicada` | A8 · Actividad publicada |
| `/agenda/compartir` | A11 · Compartir un evento del barrio |
| `/agenda/compartir/listo` | A12 · Evento compartido |

## Rutas (flujo 4)

| Ruta | Frame |
| --- | --- |
| `/mapa` | M1 · Mapa (plano ilustrado + pines + lugar destacado) |
| `/mapa/buscar?q=café` | M2 · Buscar lugares · M2b · Sin resultados (p. ej. `?q=sushi`) |
| `/mapa/[id]` | M3 · Detalle del lugar |

**Mapa real con Mapbox.** Copia `.env.example` como `.env.local` y pon tu token público:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
```

Con token, M1 muestra Mapbox (`streets-v12`, centrado en Cali, zoom 13) con los pines como `<Marker>`.
Sin token, usa el plano ilustrado del diseño. Las coordenadas de los lugares están en `src/lib/places/data.ts`
y son de ejemplo: hay que reemplazarlas por las reales. En Vercel, agrega la misma variable en
*Settings → Environment Variables*.

## Rutas (flujo 5)

| Ruta | Frame |
| --- | --- |
| `/directorio` | D1 · Vecinos y servicios |
| `/directorio/buscar?q=perros` | D2 · Buscar vecinos · D2b · Sin resultados |
| `/directorio/[id]` | D3 · Perfil del vecino |
| `/directorio/[id]/mensaje` | D4 · Mensaje a Camila |
| `/directorio/ofrecer` → `/vista-previa` → `/listo` | D5 · Publicar servicio · D6 · Vista previa · D7 · Servicio publicado |
| `/directorio/marketplace` | D8 · Marketplace |
| `/directorio/marketplace/[id]` | D9 · Detalle del producto · D14 · Reportar (hoja) |
| `/directorio/marketplace/[id]/mensaje` | D4b · Mensaje al vendedor |
| `/directorio/marketplace/[id]/reportado` | D15 · Reporte enviado |
| `/directorio/marketplace/vender` → `/listo` | D10 · Vender un producto · D11 · Producto publicado |
| `/directorio/mis-publicaciones` | D12 · Mis publicaciones · D13 · ¿Ya lo vendiste? · D12b · Producto vendido |

## Rutas (flujo 6)

| Ruta | Frame |
| --- | --- |
| `/zonas-comunes` | Z1 · Zonas comunes (con la pestaña Inicio activa) |
| `/zonas-comunes/salon-social` · `/zona-bbq` | Z2 · Detalle con aprobación |
| `/zonas-comunes/[id]/reservar?dia=2026-10-24&franja=18:00` | Z3 · Elegir fecha y franja |
| `/zonas-comunes/[id]/reservar/detalles?…` | Z4 · ¿Para quién es la reserva? |
| `/zonas-comunes/[id]/reservar/enviada?…` | Z5 · Solicitud enviada (simula la aprobación a los 4 s) |
| `/zonas-comunes/[id]/reservar/confirmada?…` | Z6 · Reserva confirmada |
| `/zonas-comunes/turco` · `/cancha-multiple` | Z7 · Turno inmediato · Z7b · Turno confirmado (hoja) |
| `/zonas-comunes/piscina` · `/gimnasio` | Z8 · Zona sin reserva |

## Rutas (flujo 7)

| Ruta | Frame |
| --- | --- |
| `/perfil` | P1 · Perfil (las normas de la comunidad se abren en una hoja) |
| `/perfil/inscripciones` | P2 · Mis reservas y actividades (incluye las reservas hechas en Zonas comunes) |
| `/perfil/privacidad` | P3 · Qué ven tus vecinos |
| `/perfil/notificaciones` | P4 · Preferencias de notificaciones |
| `/notificaciones` | N1 · Notificaciones (al tocar una, queda leída) |

Las preferencias y las notificaciones leídas se guardan en `sessionStorage` (`src/lib/profile/store.ts`).

## Rutas (flujo 8 · Administración)

Por ahora el panel se abre escribiendo la ruta `/admin` (cuando exista el inicio de sesión con roles, la administración entrará directo ahí).

| Ruta | Frame |
| --- | --- |
| `/admin` | X1 · Inicio de la administración |
| `/admin/solicitudes?tipo=actividades` | X2 · Solicitudes (filtros Todas / Actividades / Reservas) |
| `/admin/solicitudes/[id]` | X3 · Revisar solicitud (Proponer otra fecha y Rechazar abren una hoja) |
| `/admin/solicitudes/[id]/aprobada` | X4 · Solicitud aprobada |
| `/admin/avisos/nuevo` | X5 · Publicar aviso |
| `/admin/avisos/publicado?para=C` | X6 · Aviso publicado |
| `/admin/reportes/chaqueta-verde-oliva` | X7 · Revisar reporte |
| `/admin/reportes/[id]/retirada` | X8 · Publicación retirada |

`/politica-de-datos` es la política de tratamiento de datos (Ley 1581 de 2012), enlazada desde R5 y P3. **Es un borrador**: antes de publicar la app hay que revisarla con un abogado y completar la razón social, el NIT y el correo oficial.

Las decisiones y los avisos publicados se guardan en `sessionStorage` (`src/lib/admin/store.ts`).

Las publicaciones propias y el borrador del servicio se guardan en `sessionStorage` (`src/lib/directory/store.ts`).

Las pantallas de detalle y formularios viven en `src/app/(detail)/`, sin barra inferior.
El estado de inscripciones, lista de espera y "Voy" se guarda en `sessionStorage` (`src/lib/agenda/store.ts`) hasta que exista la API.

Las pantallas autenticadas viven en el grupo `src/app/(app)/`, cuyo layout agrega la barra inferior.

**Datos de demo** (`src/lib/mock-data.ts`):
- Código válido: `SAM-E204-K7Q`. Cualquier otro código lleva a R2b.
- Usuario: `sandra.rojas@gmail.com` / `vecinos2026`. Cualquier otra combinación lleva a R7b.

## Estructura

```
src/
├─ app/
│  ├─ globals.css          ← tokens de diseño (@theme de Tailwind v4)
│  ├─ layout.tsx           ← fuente Plus Jakarta Sans (next/font/local)
│  └─ …rutas del flujo
├─ components/
│  ├─ ui/                  ← primitivas estilo shadcn: button, input, checkbox, switch, bottom-sheet
│  └─ app/                 ← piezas del producto: screen, icon-tile, form-field, cards, controls, avatar-picker
├─ fonts/
└─ lib/                    ← utils (cn) y mock-data
```

## Tokens

Todos en `src/app/globals.css`. Los colores que ya existen como variables en Figma conservan su nombre en comentarios (`Marca/Azul Skema`, `Texto/Secundario`, `Estado/Error`, `Estado/Éxito`, `Texto/Sobre oscuro`). Además están mapeados a las variables de shadcn (`--primary`, `--ring`, …), así que lo que agregues con `npx shadcn add …` hereda la paleta.

Clases disponibles, por ejemplo: `bg-brand`, `bg-brand-soft`, `text-text-secondary`, `bg-ink`, `text-title`, `text-caption`, `rounded-field`, `rounded-sheet` y `shadow-button`.

## Pendientes de diseño / assets

- **Exportar en alta resolución:** `public/images/bienvenida.png` (foto R1), `logo-skema.png` y `avatar-sandra.png` están a 1x. Hay que exportarlos desde Figma a 2x/3x, o el logo en SVG, y reemplazarlos con el mismo nombre.
- `/politica-de-datos` todavía no existe.
- Los números de WhatsApp y teléfono de la administración son placeholders.

## Modo oscuro

- Se activa en **Perfil › Configuración › Modo oscuro**. Por defecto sigue el tema del sistema (`prefers-color-scheme`) y la elección se guarda en `localStorage` (`pa-theme`) con [`next-themes`](https://github.com/pacocoursey/next-themes).
- Los colores salen de los mismos tokens: el bloque `.dark { … }` de `src/app/globals.css` los reasigna, así que los componentes casi no llevan clases `dark:`.
- En modo oscuro el mapa usa el estilo `mapbox/dark-v11`.


## Backend (Supabase)

La app usa Supabase para la base de datos y las cuentas. Si las variables de Supabase no están, funciona en **modo demo** con los datos de ejemplo (sirve para trabajar en diseño sin conexión).

### Variables de entorno

En `.env.local` (y en Vercel → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clave `service_role` (secret) **nunca** va en el código, en `.env.local` ni en Vercel.

### Crear las tablas

En Supabase → SQL Editor, pega y ejecuta en este orden:

1. `supabase/migrations/0001_base.sql` — tablas, permisos (RLS) y la función que crea el perfil al registrarse.
2. `supabase/seed.sql` — Residencial Samán, torres A–E y códigos de prueba.
3. `supabase/migrations/0002_agenda_avisos.sql` — avisos, actividades, inscripciones y lista de espera.
4. `supabase/seed_0002.sql` — avisos y actividades de ejemplo (las fechas se calculan desde el día en que se corre).
5. `supabase/migrations/0003_solicitudes.sql` — reservas de zonas, actividades propuestas por vecinos y solicitudes para la administración.
6. `supabase/migrations/0004_directorio.sql` — servicios, mensajes en vivo, preferencias del perfil y la carpeta de fotos (`avatares`).
7. `supabase/seed_0004.sql` — los tres servicios de ejemplo (Camila, Juan y Marta, sin cuenta).
8. `supabase/migrations/0005_marketplace.sql` — productos, reportes y la carpeta de fotos (`productos`).
9. `supabase/seed_0005.sql` — los cuatro productos de ejemplo y un reporte para la administración.
10. `supabase/migrations/0006_mensajes.sql` — mensajes a vecinos de ejemplo y eliminar mensajes.
11. `supabase/migrations/0007_notificaciones.sql` — notificaciones dentro de la app (se crean solas con disparadores).
12. `supabase/migrations/0008_actividades_pasadas.sql` — no deja inscribirse a actividades que ya empezaron.
13. `supabase/migrations/0009_borrar_mensajes.sql` — borrar mensajes como en WhatsApp (para mí / para todos).
14. `supabase/migrations/0010_textos_notificaciones.sql` — respeta las mayúsculas de los títulos en las notificaciones.
15. `supabase/migrations/0011_notificaciones_en_vivo.sql` — cada mensaje genera su aviso flotante (sigue habiendo una notificación por conversación).
16. `supabase/migrations/0012_fotos_audios.sql` — fotos y audios en los chats, en una carpeta privada (`chat`).
17. `supabase/migrations/0013_ondas_audio.sql` — guarda la onda de cada mensaje de voz para dibujar las barras.

**Fotos y audios en el chat.** La cámara manda una foto (reducida a 1600 px); mantener presionado el micrófono graba un audio de hasta 2 minutos, al soltar se envía y deslizando a la izquierda se cancela. Los archivos van a una carpeta privada: solo los abren quien envió y quien recibió, con enlaces temporales. Los audios se ven como en WhatsApp: foto de quien habla, barras que suben y bajan según el volumen (se pintan al reproducir y se pueden tocar o arrastrar para adelantar) y la duración; mientras se graba, las barras se mueven en vivo. Debajo de cada mensaje propio aparece su estado, como en WhatsApp: reloj mientras se envía, un chulo gris cuando ya se envió y doble chulo azul cuando el otro vecino abrió la conversación (cambia en vivo); la bandeja muestra lo mismo en el último mensaje. La notificación dice "te envió una foto" o "te envió un audio" y la bandeja muestra "Foto" o "Mensaje de voz (0:12)".

Las actividades que ya empezaron dicen "En curso" y las que terminaron "Ya terminó", quedan al final del día y no permiten inscribirse ni marcar "Voy".

Para copiar un archivo, ábrelo en VS Code o en el Bloc de notas y usa Ctrl+A y Ctrl+C. Desde Git Bash, `clip` daña las tildes.

### Códigos de prueba

| Código | Unidad | Rol |
| --- | --- | --- |
| SAM-E204-K7Q | Torre E · Apto 204 | vecino |
| SAM-B402-M3P | Torre B · Apto 402 | vecino |
| SAM-A101-R8T | Torre A · Apto 101 | vecino |
| SAM-C301-X2L | Torre C · Apto 301 | vecino |
| SAM-A001-ADM | Administración | administracion |

Cada código sirve una sola vez. Para reutilizarlo, borra el usuario en Authentication → Users y ejecuta:
`update codigos_residencia set usado_por = null, usado_en = null where codigo = 'SAM-E204-K7Q';`

### Antes de abrirla a residentes reales

- Volver a activar **Confirm email** (Authentication → Sign In / Providers → Email).
- Activar **Secure email change** y **Secure password change**.
- Generar códigos nuevos (los de arriba son públicos).

### Qué está conectado

**Bloque 1.** Registro (R2–R6), inicio de sesión, cierre de sesión, protección de rutas y `/admin` solo para administración. Nombre, unidad y foto del usuario salen de la base de datos.

**Bloque 2.** Avisos: la administración publica desde `/admin/avisos/nuevo` (para todo el conjunto o una torre) y los residentes los ven en Inicio, en `/avisos` y en el detalle; los marcados "Solo residentes" no muestran Compartir. Agenda: actividades, inscripción con cupos reales, lista de espera (si alguien cancela, entra el primero de la fila) y "Voy" en los eventos del barrio. "Próxima actividad" en Inicio y "Mis reservas y actividades" en Perfil usan esos datos.

**Bloque 3.** Zonas comunes: reservas del salón y la BBQ (quedan en revisión), turnos inmediatos del turco y la cancha, y franjas ocupadas reales (sin mostrar de quién son). Crear actividad: con zona común va a la administración; sin zona se publica de una. Administración: lista de solicitudes, aprobar, rechazar o proponer otra fecha con mensaje; una reserva "para la comunidad" aprobada se publica sola en la Agenda. El vecino ve el estado y la respuesta en Mis reservas y actividades.

**Bloque 4.** Directorio: servicios reales (publicar, buscar, ver perfil), respetando "Aparecer en el directorio" y mostrando el celular solo si el vecino acepta llamadas. Mensajes entre vecinos guardados y en vivo, con bandeja en Perfil → Mensajes. Privacidad (P3) y notificaciones (P4) se guardan en el perfil. Foto de perfil al registrarse o tocando la foto en Perfil. La administración entra directo a `/admin` al iniciar sesión y tiene acceso al panel desde Perfil.

Los vecinos de ejemplo (Camila, Juan, Marta y los vendedores del Marketplace) no tienen cuenta: lo que les escribes se guarda y aparece en tu bandeja, pero nadie responde. En cualquier chat, mantener presionado un mensaje abre las opciones como en WhatsApp: copiar, eliminar para mí (lo haya enviado o recibido) y, en los propios, eliminar para todos (desaparece en vivo del chat del otro). La papelera de arriba vacía el chat solo para quien lo hace.

**Bloque 5.** Marketplace: publicar con hasta 5 fotos (se reducen a 1200 px y se guardan en Storage), escribirle al vendedor (el mensaje queda ligado al producto), marcar como vendido, eliminar y Mis publicaciones con cuántos vecinos escribieron. Los servicios propios del Directorio también se pueden eliminar desde su perfil (papelera). Reportes: el vecino reporta sin que se sepa quién fue; la administración los revisa en `/admin` y puede retirar la publicación o mantenerla.

**Bloque 6.** Notificaciones dentro de la app: la base de datos las crea sola cuando la administración publica un aviso (a todos o a una torre), responde una reserva o una actividad propuesta, cuando llega un mensaje (una por conversación mientras no se lea), se libera un cupo de la lista de espera, o retiran una publicación. A la administración le llegan las solicitudes y reportes nuevos. Respetan las preferencias de P4 (los avisos y la moderación siempre llegan). La campana muestra el punto rojo en vivo y N1 permite marcar todas como leídas. Además, en cualquier pantalla aparece un aviso flotante arriba, como en una app del celular, que lleva a lo que avisa; se cierra solo, con la X o deslizándolo hacia arriba, y no aparece si ya estás viendo eso. No hay notificaciones push al celular todavía.

Sigue simulada: la recuperación de contraseña.
