/**
 * Panel de la administración (mock).
 * TODO: reemplazar por la API:
 *   GET   /api/admin/resumen
 *   GET   /api/admin/solicitudes?tipo=      · GET /api/admin/solicitudes/:id
 *   POST  /api/admin/solicitudes/:id/aprobar · /rechazar · /proponer { fecha, mensaje }
 *   POST  /api/avisos                        { titulo, mensaje, cuando, audiencia, compartible, notificar }
 *   GET   /api/admin/reportes/:id            · POST /api/admin/reportes/:id/retirar · /mantener
 */

export type RequestKind = "activity" | "reservation";

export type AdminRequest = {
  id: string;
  kind: RequestKind;
  title: string;
  /** Línea de la tarjeta de X2: "Salón social, sábado 17, de 3:00 a 6:00 p. m." */
  summary: string;
  place: string;
  when: string;
  capacity: string;
  /** "Sandra, Torre E" */
  by: { name: string; tower: string; avatar?: string };
  /** "Propone" (actividad) o "Pide" (reserva). */
  verb: string;
  age: string;
  waitingHours: number;
  /** Más de 12 horas esperando: la etiqueta se pinta naranja ("Lleva 18 h"). */
  overdue: boolean;
  history: string;
  message: string;
  checks: string[];
};

export const requestKindLabel: Record<RequestKind, string> = {
  activity: "Actividad abierta",
  reservation: "Reserva privada",
};

export const adminRequests: AdminRequest[] = [
  {
    id: "tarde-de-juegos",
    kind: "activity",
    title: "Tarde de juegos",
    summary: "Salón social, sábado 17, de 3:00 a 6:00 p. m.",
    place: "Salón social, Torre A",
    when: "Sábado 17, de 3:00 a 6:00 p. m.",
    capacity: "Hasta 20 personas, abierta a todo el conjunto",
    by: { name: "Sandra", tower: "E", avatar: "/images/avatar-sandra.png" },
    verb: "Propone",
    age: "Hace 5 min",
    waitingHours: 0,
    overdue: false,
    history: "Ha organizado 3 planes sin novedades",
    message: "Llevo juegos de mesa y parqués. La idea es que vengan familias con niños.",
    checks: ["El salón está libre en esa franja.", "Cumple las normas: termina antes de las 10:00 p. m."],
  },
  {
    id: "asado-familiar",
    kind: "reservation",
    title: "Asado familiar",
    summary: "BBQ, domingo 18, de 12:00 m. a 4:00 p. m.",
    place: "Zona BBQ, terraza Torre C",
    when: "Domingo 18, de 12:00 m. a 4:00 p. m.",
    capacity: "15 invitados, reunión privada",
    by: { name: "Hernán", tower: "B" },
    verb: "Pide",
    age: "Lleva 18 h",
    waitingHours: 18,
    overdue: true,
    history: "Ha reservado 2 veces sin novedades",
    message: "Es el cumpleaños de mi papá. Traemos nuestro carbón y dejamos la parrilla limpia.",
    checks: ["La zona BBQ está libre en esa franja.", "Cumple el aforo: máximo 20 personas."],
  },
  {
    id: "torneo-microfutbol",
    kind: "activity",
    title: "Torneo de microfútbol",
    summary: "Cancha, sábado 17, de 8:00 a 11:00 a. m.",
    place: "Cancha múltiple",
    when: "Sábado 17, de 8:00 a 11:00 a. m.",
    capacity: "Hasta 24 personas, abierta a todo el conjunto",
    by: { name: "Andrés", tower: "C" },
    verb: "Propone",
    age: "Hace 6 h",
    waitingHours: 6,
    overdue: false,
    history: "Primera vez que organiza un plan",
    message: "Armamos equipos de 6. Pueden jugar niños desde los 12 años con un adulto.",
    checks: ["La cancha está libre en esa franja.", "Cumple las normas: termina antes de las 9:00 p. m."],
  },
];

export const getAdminRequest = (id: string) => adminRequests.find((r) => r.id === id);

export type AdminNotice = { id: string; title: string; when: string; shareable: boolean };

export const activeNotices: AdminNotice[] = [
  {
    id: "mantenimiento-ascensores-torre-b",
    title: "Mantenimiento ascensores, Torre B",
    when: "Jueves 12, de 8:00 a. m. a 12:00 m.",
    shareable: true,
  },
  {
    id: "asamblea-ordinaria",
    title: "Asamblea ordinaria de copropietarios",
    when: "Sábado 21, 9:00 a. m., salón social",
    shareable: false,
  },
];

/* ───────────────────────── Avisos (X5) ───────────────────────── */

export const audiences = [
  { id: "todos", label: "Todo el conjunto", apartments: 320 },
  { id: "A", label: "Torre A", apartments: 64 },
  { id: "B", label: "Torre B", apartments: 64 },
  { id: "C", label: "Torre C", apartments: 64 },
  { id: "D", label: "Torre D", apartments: 64 },
  { id: "E", label: "Torre E", apartments: 64 },
] as const;

export type AudienceId = (typeof audiences)[number]["id"];

/* ───────────────────────── Reportes (X7) ───────────────────────── */

export type Report = {
  id: string;
  product: { title: string; price: number; image: string; seller: string; sellerName: string };
  reason: string;
  guidance: string;
};

export const reports: Report[] = [
  {
    id: "chaqueta-verde-oliva",
    product: {
      title: "Chaqueta verde oliva",
      price: 80000,
      image: "/images/marketplace/chaqueta.jpg",
      seller: "Andrés, Torre C",
      sellerName: "Andrés",
    },
    reason: "Producto prohibido o peligroso",
    guidance:
      "Si la prenda es de uso exclusivo de una institución, o si el producto incumple las normas de la comunidad, retírala. Al vendedor le llega el motivo.",
  },
];

export const getReport = (id: string) => reports.find((r) => r.id === id);
