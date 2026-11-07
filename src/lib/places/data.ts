/**
 * Lugares del barrio (flujo 4 · Mapa). Datos de ejemplo; reemplazar por la API.
 * `pin` es la posición en el plano ilustrado de 390×644 (Figma "Plano").
 */

export type PlaceCategory = "comida" | "mascotas" | "mercado";
export type PlaceIcon = "coffee" | "store" | "bag" | "paw";

export type Review = { name: string; tower: string; avatar?: string; text: string };

export type NeighborhoodPlace = {
  id: string;
  name: string;
  /** Nombre corto en el pin. */
  pinLabel: string;
  icon: PlaceIcon;
  categories: PlaceCategory[];
  kind: string;
  distanceM: number;
  recommendations: number;
  openUntil?: string;
  benefit?: { title: string; detail: string; short: string };
  address: string;
  image?: string;
  cover?: string;
  reviews: Review[];
  whatsapp?: string;
  keywords: string[];
  /** Sin `pin` el lugar sale en la búsqueda pero no en el encuadre del plano. */
  pin?: { x: number; y: number };
};

export const places: NeighborhoodPlace[] = [
  {
    id: "cafe-saman-artesanal",
    name: "Café Samán Artesanal",
    pinLabel: "Café Samán",
    icon: "coffee",
    categories: ["comida"],
    kind: "Café de especialidad y repostería",
    distanceM: 200,
    recommendations: 34,
    openUntil: "9:00 p. m.",
    benefit: { title: "10 % para residentes", detail: "Muestra tu perfil de Puerta Abierta en la caja.", short: "10 %" },
    address: "Carrera 105 # 14-20",
    image: "/images/lugares/cafe-saman.png",
    cover: "/images/lugares/cafe-saman-portada.jpg",
    reviews: [
      { name: "Camila", tower: "B", avatar: "/images/vecinos/camila.png", text: "El mejor lugar para trabajar en la tarde. Tienen enchufes en todas las mesas." },
      { name: "Juan", tower: "A", avatar: "/images/vecinos/juan.png", text: "Los sábados hay pan sin gluten. Llega antes de las 10." },
    ],
    whatsapp: "573000000001",
    keywords: ["café", "cafe", "cafetería", "repostería", "panadería", "trabajar", "wifi"],
    pin: { x: 209, y: 236 },
  },
  {
    id: "tostadores-del-valle",
    name: "Tostadores del Valle",
    pinLabel: "Tostadores del Valle",
    icon: "coffee",
    categories: ["comida"],
    kind: "Tostadora y tienda de café",
    distanceM: 650,
    recommendations: 12,
    openUntil: "7:00 p. m.",
    address: "Calle 16 # 100-35",
    image: "/images/actividades/cata-cafe.jpg",
    cover: "/images/actividades/cata-cafe.jpg",
    reviews: [{ name: "Andrés", tower: "C", text: "Venden café en grano de fincas del Valle. Te lo muelen al momento." }],
    whatsapp: "573000000002",
    keywords: ["café", "cafe", "tostadora", "grano"],
  },
  {
    id: "panaderia-valle-dulce",
    name: "Panadería Valle Dulce",
    pinLabel: "Panadería Valle Dulce",
    icon: "store",
    categories: ["comida"],
    kind: "Panadería y pastelería",
    distanceM: 350,
    recommendations: 21,
    openUntil: "8:00 p. m.",
    address: "Carrera 98 # 16-10",
    reviews: [{ name: "Marta", tower: "E", text: "El pandebono sale a las 4 p. m. y se acaba rápido." }],
    whatsapp: "573000000003",
    keywords: ["pan", "panadería", "pastelería", "pandebono", "desayuno"],
    pin: { x: 200, y: 40 },
  },
  {
    id: "mercado-la-flora",
    name: "Mercado La Flora",
    pinLabel: "Mercado La Flora",
    icon: "bag",
    categories: ["mercado", "comida"],
    kind: "Frutas, verduras y abarrotes",
    distanceM: 500,
    recommendations: 18,
    openUntil: "9:00 p. m.",
    address: "Calle 25 # 103-08",
    reviews: [{ name: "Hernán", tower: "B", text: "Hacen domicilios al conjunto sin costo desde $40.000." }],
    whatsapp: "573000000004",
    keywords: ["mercado", "frutas", "verduras", "supermercado", "domicilio"],
    pin: { x: 24, y: 96 },
  },
  {
    id: "veterinaria-patitas",
    name: "Veterinaria Patitas",
    pinLabel: "Veterinaria Patitas",
    icon: "paw",
    categories: ["mascotas"],
    kind: "Veterinaria y peluquería canina",
    distanceM: 450,
    recommendations: 27,
    openUntil: "6:00 p. m.",
    benefit: { title: "Baño con 15 % de descuento", detail: "Para mascotas de residentes, de lunes a jueves.", short: "15 %" },
    address: "Carrera 105 # 18-44",
    reviews: [{ name: "Laura", tower: "A", text: "Atienden urgencias los sábados en la mañana." }],
    whatsapp: "573000000005",
    keywords: ["veterinaria", "perro", "gato", "mascota", "peluquería"],
    pin: { x: 28, y: 270 },
  },
];

export const RESIDENCE = { label: "Residencial Samán", pin: { x: 128, y: 150 } };

export const placeFilters: { id: "todos" | "beneficio" | PlaceCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "beneficio", label: "Con beneficio" },
  { id: "comida", label: "Comida" },
  { id: "mascotas", label: "Mascotas" },
];

export function getPlace(id: string) {
  return places.find((p) => p.id === id) ?? null;
}

export function formatDistance(m: number) {
  return m < 1000 ? `a ${m} m` : `a ${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/** Búsqueda sin tildes ni mayúsculas en nombre, tipo y palabras clave. */
export function searchPlaces(query: string) {
  const q = fold(query);
  if (!q) return [...places].sort((a, b) => a.distanceM - b.distanceM);
  return places
    .filter((p) => [p.name, p.kind, ...p.keywords].some((t) => fold(t).includes(q)))
    .sort((a, b) => a.distanceM - b.distanceM);
}
