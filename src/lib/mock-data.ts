/**
 * Datos de ejemplo tomados del prototipo. Reemplazar por la API real.
 */

export type Unit = { project: string; tower: string; apartment: string };

export type Administration = {
  name: string;
  location: string;
  schedule: string;
  /** Formato E.164 sin "+" para wa.me (placeholder). */
  whatsapp: string;
  phone: string;
};

export const administration: Administration = {
  name: "Administración Residencial Samán",
  location: "Oficina en el primer piso, Torre A",
  schedule: "Lunes a viernes, 8:00 a. m. a 5:00 p. m.",
  whatsapp: "573000000000",
  phone: "+573000000000",
};

/** Códigos de residencia válidos en el mock. Formato: AAA-X999-XXX */
const validCodes: Record<string, Unit> = {
  "SAM-E204-K7Q": { project: "Residencial Samán", tower: "E", apartment: "204" },
};

export const RESIDENCE_CODE_PATTERN = /^[A-Z]{3}-[A-Z]\d{3}-[A-Z0-9]{3}$/;

export function lookupResidenceCode(code: string): Unit | null {
  return validCodes[code.trim().toUpperCase()] ?? null;
}

export function formatUnit(unit: Unit) {
  return `${unit.project}, Torre ${unit.tower}, Apto ${unit.apartment}`;
}

/** Credenciales de demo para la pantalla de inicio de sesión. */
export const demoUser = {
  name: "Sandra Rojas",
  email: "sandra.rojas@gmail.com",
  password: "vecinos2026",
  bio: "Me encanta el yoga y tengo un beagle que se llama Toby.",
  avatar: "/images/avatar-sandra.png",
};

/* ────────────────────────── Flujo 2 · Inicio ────────────────────────── */

export const community = {
  name: "Residencial Samán",
  /** Enlace público que se incluye al compartir (puertaabierta.app/saman). */
  publicUrl: "https://puertaabierta.app/saman",
  publicUrlLabel: "puertaabierta.app/saman",
};

export const currentResident = {
  firstName: "Sandra",
  unitLabel: "Torre E · Apto 204",
  avatar: "/images/avatar-sandra.png",
};

export type Notice = {
  id: string;
  /** Etiqueta corta en la tarjeta de Inicio ("Admin") y larga en el detalle ("Administración"). */
  source: { short: string; long: string };
  author: string;
  publishedAt: Date;
  title: string;
  /** Título compacto para la tarjeta de Inicio. */
  cardTitle: string;
  cardSummary: string;
  dateLabel: string;
  timeLabel: string;
  placeLabel: string;
  body: string;
  /** Resumen de una línea para el mensaje que se comparte por WhatsApp, SMS o correo. */
  shareSummary: string;
};

const HOUR = 60 * 60 * 1000;

export function getNotices(now = new Date()): Notice[] {
  return [
    {
      id: "mantenimiento-ascensores-torre-b",
      source: { short: "Admin", long: "Administración" },
      author: administration.name,
      publishedAt: new Date(now.getTime() - 2 * HOUR),
      title: "Mantenimiento ascensores, Torre B",
      cardTitle: "Mantenimiento de ascensores, Torre B",
      cardSummary: "Jueves 12 de noviembre de 8:00 a. m. a 12:00 m.",
      dateLabel: "Jueves 12 de noviembre",
      timeLabel: "8:00 a. m. a 12:00 m.",
      placeLabel: "Torre B, ascensores 1 y 2",
      body:
        "La empresa de mantenimiento hará la revisión anual obligatoria. Durante ese horario los ascensores de la Torre B no funcionan. Si necesitas ayuda para subir compras o tienes movilidad reducida, avisa en portería y te acompañamos por la Torre A.",
      shareSummary:
        "Jueves 12 de noviembre, de 8:00 a. m. a 12:00 m. Los ascensores 1 y 2 de la Torre B no funcionan. Si necesitas ayuda, avisa en portería.",
    },
  ];
}

export function getNotice(id: string, now = new Date()) {
  return getNotices(now).find((n) => n.id === id) ?? null;
}

export type Activity = {
  id: string;
  title: string;
  whenLabel: string;
  place: string;
  organizer: string;
  spotsLeft: number;
  capacity: number;
  image: string;
  imageAlt: string;
};

export const nextActivity: Activity = {
  id: "yoga-al-atardecer",
  title: "Yoga al atardecer",
  whenLabel: "Hoy · 6:30 p. m.",
  place: "Terraza, Torre A",
  organizer: "Laura",
  spotsLeft: 4,
  capacity: 20,
  image: "/images/actividades/yoga-atardecer.png",
  imageAlt: "Vecinos haciendo yoga en la terraza al atardecer",
};

export type Place = {
  id: string;
  name: string;
  recommendations: number;
  distanceLabel: string;
  perk?: string;
  image: string;
};

export const recommendedPlace: Place = {
  id: "cafe-saman-artesanal",
  name: "Café Samán Artesanal",
  recommendations: 34,
  distanceLabel: "a\u00a0200\u00a0m",
  perk: "10 % para residentes",
  image: "/images/lugares/cafe-saman.png",
};

/** "Hace 2 h", "Hace 5 min", "Hace 3 d". */
export function formatTimeAgo(date: Date, now = new Date()) {
  const minutes = Math.max(1, Math.round((now.getTime() - date.getTime()) / 60000));
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.round(hours / 24)} d`;
}
