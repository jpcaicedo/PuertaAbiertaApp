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
| 2 · Inicio | I1 – I4 | pendiente |
| 3 · Agenda | A1 – A13 | pendiente |
| 4 · Mapa | M1 – M3 | pendiente |
| 5 · Directorio | D1 – D15 | pendiente |
| 6 · Zonas comunes | Z1 – Z8 | pendiente |
| 7 · Perfil y notificaciones | P1 – P4, N1 | pendiente |
| 8 · Administración | X1 – X8 | pendiente |

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
