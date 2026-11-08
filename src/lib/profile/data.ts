import { Calendar, MapPin, Megaphone, MessageCircle, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * Datos de Perfil y Notificaciones (mock).
 * TODO: reemplazar por la API:
 *   GET   /api/usuarios/me/actividad        (P2)
 *   GET   /api/usuarios/me/notificaciones   (N1) · PATCH /api/notificaciones/:id { leida: true }
 *   PATCH /api/usuarios/me/privacidad       (P3)
 *   PATCH /api/usuarios/me/preferencias     (P4)
 */

/* ───────────────────────── P2 · Mis reservas y actividades ───────────────────────── */

export type ActivityStatus = "confirmed" | "pending" | "past";

export type MyActivity = {
  id: string;
  /** "YYYY-MM-DD" */
  day: string;
  title: string;
  detail: string;
  status: ActivityStatus;
  statusLabel: string;
  href?: string;
};

export const myActivities: MyActivity[] = [
  {
    id: "yoga",
    day: "2026-10-14",
    title: "Yoga al atardecer",
    detail: "Terraza, Torre A, 6:30 p. m.",
    status: "confirmed",
    statusLabel: "Inscripción confirmada",
    href: "/agenda/yoga-al-atardecer",
  },
  {
    id: "turco-16",
    day: "2026-10-16",
    title: "Turno en el turco",
    detail: "De 7:00 a 7:30 p. m.",
    status: "confirmed",
    statusLabel: "Turno confirmado",
    href: "/zonas-comunes/turco",
  },
  {
    id: "tarde-de-juegos",
    day: "2026-10-17",
    title: "Tarde de juegos",
    detail: "Organizas tú. Salón social, de 3:00 a 6:00 p. m.",
    status: "pending",
    statusLabel: "En revisión de la administración",
    href: "/agenda?dia=2026-10-17",
  },
  {
    id: "cata-de-cafe",
    day: "2026-10-12",
    title: "Cata de café valluno",
    detail: "Salón social, Torre A",
    status: "past",
    statusLabel: "Asististe",
  },
];

/* ───────────────────────── N1 · Notificaciones ───────────────────────── */

export type NotificationTone = "success" | "brand" | "warm" | "neutral";

export type AppNotification = {
  id: string;
  icon: LucideIcon;
  tone: NotificationTone;
  title: string;
  body: string;
  when: string;
  /** Sin leer al abrir la app por primera vez. */
  unread: boolean;
  href: string;
};

export const notifications: AppNotification[] = [
  {
    id: "aprobada-tarde-de-juegos",
    icon: ShieldCheck,
    tone: "success",
    title: "La administración aprobó tu tarde de juegos",
    body: "Ya está en la Agenda para el sábado 17.",
    when: "Hace 5 min",
    unread: true,
    href: "/agenda?dia=2026-10-17",
  },
  {
    id: "aviso-ascensores",
    icon: Megaphone,
    tone: "brand",
    title: "Nuevo aviso de la administración",
    body: "Mantenimiento de ascensores en la Torre B, jueves 12 de noviembre.",
    when: "Hace 2 h",
    unread: true,
    href: "/avisos/mantenimiento-ascensores-torre-b",
  },
  {
    id: "mensajes-silla",
    icon: MessageCircle,
    tone: "brand",
    title: "3 vecinos te escribieron por la silla",
    body: "Respóndeles desde Mis publicaciones.",
    when: "Hace 3 h",
    unread: true,
    href: "/directorio/mis-publicaciones",
  },
  {
    id: "camila-cuentos",
    icon: MapPin,
    tone: "warm",
    title: "Camila compartió un plan del barrio",
    body: "Tarde de cuentos y pintura para niños, hoy a las 4:30 p. m.",
    when: "Ayer",
    unread: false,
    href: "/agenda/cuentos-y-pintura",
  },
  {
    id: "turno-turco",
    icon: Calendar,
    tone: "neutral",
    title: "Tu turno en el turco está confirmado",
    body: "Viernes 16, de 7:00 a 7:30 p. m.",
    when: "Ayer",
    unread: false,
    href: "/perfil/inscripciones",
  },
];

/* ───────────────────────── P3 / P4 · Preferencias ───────────────────────── */

export type PrivacyKey = "showApartment" | "showPhone" | "inDirectory" | "acceptMessages";
/** `all` es el interruptor general: apagado, no llega ninguna notificación. */
export type NotifyKey = "all" | "requests" | "agenda" | "messages" | "marketplace";

export const privacyOptions: { key: PrivacyKey; title: string; description: string }[] = [
  { key: "showApartment", title: "Mostrar mi apartamento", description: "Tus vecinos verían «apto 204»." },
  {
    key: "showPhone",
    title: "Mostrar mi teléfono",
    description: "Si está apagado, te escriben por el chat de la app.",
  },
  {
    key: "inDirectory",
    title: "Aparecer en el directorio",
    description: "Tus vecinos pueden encontrarte por tu nombre.",
  },
  { key: "acceptMessages", title: "Recibir mensajes de vecinos", description: "Siempre puedes bloquear a alguien." },
];

export const notifyOptions: { key: Exclude<NotifyKey, "all">; title: string; description: string }[] = [
  {
    key: "requests",
    title: "Respuestas a tus solicitudes",
    description: "Cuando aprueban tu plan o proponen otra fecha.",
  },
  { key: "agenda", title: "Nuevos planes en la Agenda", description: "Cuando un vecino propone algo." },
  { key: "messages", title: "Mensajes de vecinos", description: "Del directorio y del marketplace." },
  {
    key: "marketplace",
    title: "Productos nuevos en el marketplace",
    description: "Un resumen al día, no uno por producto.",
  },
];
