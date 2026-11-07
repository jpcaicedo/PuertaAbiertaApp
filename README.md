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
