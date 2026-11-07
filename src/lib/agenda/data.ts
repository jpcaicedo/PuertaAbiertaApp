/**
 * Datos de ejemplo del flujo 3 · Agenda. Reemplazar por la API real.
 * Las fechas son de la semana del 12 al 18 de octubre de 2026, como en el prototipo.
 */

export type Category = "deporte" | "mascotas" | "comida" | "ninos" | "cultura" | "aprender";
export type TimeOfDay = "manana" | "tarde" | "noche";

export const categories: { id: Category; label: string }[] = [
  { id: "deporte", label: "Deporte" },
  { id: "mascotas", label: "Mascotas" },
  { id: "comida", label: "Comida" },
  { id: "ninos", label: "Niños" },
  { id: "cultura", label: "Cultura" },
  { id: "aprender", label: "Aprender" },
];

export const timesOfDay: { id: TimeOfDay; label: string; from: number; to: number }[] = [
  { id: "manana", label: "Mañana", from: 0, to: 12 },
  { id: "tarde", label: "Tarde", from: 12, to: 18 },
  { id: "noche", label: "Noche", from: 18, to: 24 },
];

export type Person = { name: string; tower?: string; avatar?: string };

type AgendaBase = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24 h */
  start: string;
  end: string;
  place: string;
  categories: Category[];
  /** Foto de cabecera. Sin foto se usa la cabecera ilustrada. */
  image?: string;
  imageAlt?: string;
};

export type CommunityActivity = AgendaBase & {
  kind: "actividad";
  organizer: Person & { leader?: boolean };
  capacity: number;
  enrolled: number;
  description: string;
  attendees: Person[];
  attendeesLabel: string;
};

export type NeighborhoodEvent = AgendaBase & {
  kind: "barrio";
  distanceLabel: string;
  sharedBy: Person;
  sharedByQuote: string;
  costLabel: string;
  audienceLabel?: string;
  goingFromBuilding: Person[];
  goingSummary: string;
  goingCountLabel: string;
  organizerNote: string;
};

export type AgendaItem = CommunityActivity | NeighborhoodEvent;

/** "Hoy" del prototipo. TODO: usar la fecha real cuando haya API. */
export const AGENDA_TODAY = "2026-10-14";

const laura: Person & { leader: boolean } = { name: "Laura", tower: "A", leader: true };
const camila: Person = { name: "Camila", tower: "B", avatar: "/images/vecinos/camila.png" };
const vecinas: Person[] = [
  { name: "Camila", avatar: "/images/vecinos/vecina-1.png" },
  { name: "Juan", avatar: "/images/vecinos/vecina-2.png" },
  { name: "Paula", avatar: "/images/vecinos/vecina-3.png" },
];

export const agendaItems: AgendaItem[] = [
  {
    kind: "barrio",
    id: "cuentos-y-pintura",
    title: "Tarde de cuentos y pintura para niños",
    date: "2026-10-14",
    start: "16:30",
    end: "18:00",
    place: "C. C. Mirador del Sur, piso 2",
    categories: ["ninos", "cultura"],
    distanceLabel: "a 3 cuadras",
    sharedBy: camila,
    sharedByQuote: "Lo hacen cada mes y a mis hijos les encanta. Los cupos son pocos, toca llegar temprano.",
    costLabel: "Gratis",
    audienceLabel: "niños de 4 a 10 años",
    goingFromBuilding: [vecinas[0], { name: "Andrés", avatar: "/images/vecinos/vecina-2.png" }, { name: "Marta Lozano" }],
    goingSummary: "Camila, Andrés y Marta van con sus hijos",
    goingCountLabel: "Van 3 familias de tu conjunto",
    organizerNote: "Lo organiza el centro comercial, no Puerta Abierta. La entrada es en el lugar.",
  },
  {
    kind: "actividad",
    id: "yoga-al-atardecer",
    title: "Yoga al atardecer",
    date: "2026-10-14",
    start: "18:30",
    end: "19:30",
    place: "Terraza, Torre A",
    categories: ["deporte"],
    image: "/images/actividades/yoga-atardecer.jpg",
    imageAlt: "Vecinos haciendo yoga en la terraza al atardecer",
    organizer: laura,
    capacity: 20,
    enrolled: 16,
    description:
      "Clase para todos los niveles. Trae tu mat y una botella de agua. Laura es instructora certificada y vive en la Torre A; organiza esta clase cada miércoles desde hace tres meses.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 14 vecinos más",
  },
  {
    kind: "actividad",
    id: "cata-de-cafe",
    title: "Cata de café valluno",
    date: "2026-10-14",
    start: "19:30",
    end: "21:00",
    place: "Salón social, Torre A",
    categories: ["comida"],
    image: "/images/actividades/cata-cafe.jpg",
    imageAlt: "Vecinos en una cata de café en el salón social",
    organizer: { name: "Andrés", tower: "C" },
    capacity: 12,
    enrolled: 12,
    description: "Andrés trae cafés de cuatro fincas del Valle y explica cómo catarlos. Incluye pan artesanal.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 10 vecinos más",
  },
  {
    kind: "actividad",
    id: "caminata-con-perros",
    title: "Caminata con perros",
    date: "2026-10-12",
    start: "07:00",
    end: "08:00",
    place: "Portería principal",
    categories: ["mascotas", "deporte"],
    organizer: { name: "Hernán", tower: "B" },
    capacity: 15,
    enrolled: 6,
    description: "Vuelta de una hora por el parque del barrio. Trae bolsas y agua para tu perro.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 4 vecinos más",
  },
  {
    kind: "actividad",
    id: "futbol-5",
    title: "Fútbol 5 vecinal",
    date: "2026-10-13",
    start: "19:00",
    end: "20:30",
    place: "Cancha sintética",
    categories: ["deporte"],
    organizer: { name: "Juan", tower: "D" },
    capacity: 10,
    enrolled: 7,
    description: "Partido amistoso entre torres. Hay petos para todos.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 5 vecinos más",
  },
  {
    kind: "actividad",
    id: "club-de-lectura",
    title: "Club de lectura",
    date: "2026-10-15",
    start: "19:00",
    end: "20:30",
    place: "Biblioteca, Torre C",
    categories: ["cultura"],
    organizer: laura,
    capacity: 12,
    enrolled: 5,
    description: "Este mes leemos «Cien años de soledad». No importa si no has terminado el libro.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 3 vecinos más",
  },
  {
    kind: "actividad",
    id: "huerta-urbana",
    title: "Taller de huerta urbana",
    date: "2026-10-17",
    start: "09:00",
    end: "11:00",
    place: "Terraza, Torre B",
    categories: ["aprender", "ninos"],
    organizer: { name: "Marta", tower: "E" },
    capacity: 16,
    enrolled: 9,
    description: "Aprende a sembrar aromáticas en materas recicladas. Los niños son bienvenidos.",
    attendees: vecinas,
    attendeesLabel: "Camila, Juan y 7 vecinos más",
  },
];

export function getAgendaItem(id: string) {
  return agendaItems.find((i) => i.id === id) ?? null;
}

export const commonAreas = ["Salón social, Torre A", "Terraza, Torre A", "Terraza, Torre B", "Piscina", "Zona BBQ"];
