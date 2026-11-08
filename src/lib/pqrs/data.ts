/** Reportes de daños y PQRS: tipos, textos y ejemplos para el modo demo. */

export type PqrsKind = "dano" | "peticion" | "queja" | "reclamo" | "sugerencia";
export type PqrsStatus = "recibido" | "en_proceso" | "resuelto";

export type PqrsEvent = { status: PqrsStatus; note?: string; at: string };

export type Pqrs = {
  id: string;
  /** Radicado que ve el vecino: "PQRS-0007". */
  number: string;
  kind: PqrsKind;
  title: string;
  place?: string;
  description: string;
  /** Enlace de la foto (temporal si viene de Supabase). */
  photo?: string;
  status: PqrsStatus;
  createdAt: string;
  updatedAt: string;
  /** Quién lo reportó (solo lo ve la administración). */
  by?: { name: string; unit: string };
  events: PqrsEvent[];
};

export const pqrsKinds: { id: PqrsKind; label: string }[] = [
  { id: "dano", label: "Daño" },
  { id: "peticion", label: "Petición" },
  { id: "queja", label: "Queja" },
  { id: "reclamo", label: "Reclamo" },
  { id: "sugerencia", label: "Sugerencia" },
];

export const kindLabel = (k: PqrsKind) => pqrsKinds.find((x) => x.id === k)?.label ?? "PQRS";

export const statusLabel: Record<PqrsStatus, string> = {
  recibido: "Recibido",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export const statusSteps: PqrsStatus[] = ["recibido", "en_proceso", "resuelto"];

export const pqrsNumber = (n: number) => `PQRS-${String(n).padStart(4, "0")}`;

/** "8 nov, 3:40 p. m." en hora de Colombia. */
export function pqrsDate(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })
    .format(d)
    .replace(".", "")
    .replace(" de ", " ");
  const time = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" })
    .format(d)
    .replace(/\s+/g, " ");
  return `${day}, ${time}`;
}

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Ejemplos del modo demo (sin Supabase). */
export function demoPqrs(): Pqrs[] {
  return [
    {
      id: "demo-1",
      number: pqrsNumber(12),
      kind: "dano",
      title: "Se dañó la luz del parqueadero",
      place: "Sótano 2, cerca de la rampa",
      description: "La lámpara del fondo no prende desde anoche y queda muy oscuro para salir del carro.",
      status: "en_proceso",
      createdAt: ago(20),
      updatedAt: ago(3),
      by: { name: "Sandra", unit: "Torre E, apto 204" },
      events: [
        { status: "recibido", at: ago(20) },
        { status: "en_proceso", note: "Ya llamamos al electricista. Viene mañana en la mañana.", at: ago(3) },
      ],
    },
    {
      id: "demo-2",
      number: pqrsNumber(9),
      kind: "peticion",
      title: "Poner una banca en el parque infantil",
      place: "Parque infantil",
      description: "Los papás no tenemos dónde sentarnos mientras los niños juegan.",
      status: "resuelto",
      createdAt: ago(24 * 9),
      updatedAt: ago(24 * 2),
      by: { name: "Sandra", unit: "Torre E, apto 204" },
      events: [
        { status: "recibido", at: ago(24 * 9) },
        { status: "en_proceso", note: "Lo llevamos al comité de convivencia.", at: ago(24 * 7) },
        { status: "resuelto", note: "Instalamos dos bancas junto al columpio.", at: ago(24 * 2) },
      ],
    },
  ];
}
