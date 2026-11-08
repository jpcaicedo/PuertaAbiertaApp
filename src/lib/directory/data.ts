/**
 * Datos de ejemplo del flujo 5 · Directorio. Reemplazar por la API.
 */

export type ServiceCategory = "mascotas" | "clases" | "hogar" | "comida" | "belleza" | "otro";

export const serviceCategories: { id: ServiceCategory; label: string }[] = [
  { id: "mascotas", label: "Mascotas" },
  { id: "clases", label: "Clases" },
  { id: "hogar", label: "Hogar" },
  { id: "comida", label: "Comida" },
  { id: "belleza", label: "Belleza" },
  { id: "otro", label: "Otro" },
];

/** `fullName` solo se usa para las iniciales del avatar. */
export type Review = { name: string; fullName: string; tower: string; text: string };

export type Neighbor = {
  id: string;
  name: string;
  /** Primer nombre para botones y chat. */
  firstName: string;
  apartment: string;
  tower: string;
  avatar?: string;
  avatarLarge?: string;
  verified: boolean;
  /** "Vecina verificada" / "Vecino verificado". Sin dato (vecinos reales): "Identidad verificada". */
  feminine?: boolean;
};

export type NeighborService = {
  id: string;
  neighbor: Neighbor;
  title: string;
  /** Rol corto para la cabecera del chat ("Paseadora de mascotas"). */
  shortRole: string;
  category: ServiceCategory;
  rating?: number;
  reviewCount: number;
  description: string;
  /** Descripción ampliada del perfil (D3). */
  longDescription: string;
  price: string;
  schedule: string;
  /** null = no acepta llamadas, solo mensajes en la app. */
  callHours: string | null;
  phone?: string;
  reviews: Review[];
  keywords: string[];
  /** Con Supabase: cuenta del vecino que lo ofrece (null = vecino de ejemplo, sin cuenta). */
  ownerId?: string | null;
  /** Con Supabase: si el vecino acepta mensajes por la app. */
  acceptsMessages?: boolean;
};

const camila: Neighbor = {
  id: "camila",
  name: "Camila Restrepo",
  firstName: "Camila",
  apartment: "402",
  tower: "B",
  avatar: "/images/vecinos/camila.jpg",
  avatarLarge: "/images/vecinos/camila.jpg",
  verified: true,
  feminine: true,
};

export const services: NeighborService[] = [
  {
    id: "camila",
    neighbor: camila,
    title: "Paseadora y entrenadora de mascotas",
    shortRole: "Paseadora de mascotas",
    category: "mascotas",
    rating: 5,
    reviewCount: 28,
    description: "Estudiante de veterinaria y entrenadora canina certificada. Paseos grupales en la mañana y en la tarde.",
    longDescription:
      "Estudiante de veterinaria y entrenadora canina certificada. Paseos grupales de máximo 4 perros dentro del conjunto y en el parque de la esquina.",
    price: "Paseo grupal de 1 hora: $15.000",
    schedule: "Lunes a viernes, 7:00 a. m. y 6:00 p. m.",
    callHours: "8:00 a. m. a 7:00 p. m.",
    phone: "+573000000010",
    reviews: [
      { name: "Sandra", fullName: "Sandra Rojas", tower: "E", text: "Toby vuelve feliz y cansado. Siempre manda fotos del paseo." },
      { name: "Andrés", fullName: "Andrés Pardo", tower: "C", text: "Muy puntual. Le ayudó a mi perro a dejar de jalar la correa." },
    ],
    keywords: ["perros", "perro", "mascotas", "paseo", "paseadora", "entrenadora", "gatos"],
  },
  {
    id: "juan",
    neighbor: { id: "juan", name: "Juan Gaviria", firstName: "Juan", apartment: "101", tower: "A", verified: true, feminine: false },
    title: "Clases de inglés",
    shortRole: "Profesor de inglés",
    category: "clases",
    rating: 4.6,
    reviewCount: 11,
    description:
      "Licenciado en idiomas con 8 años de experiencia. Clases para niños y adultos en tu apartamento o en el salón de estudio.",
    longDescription:
      "Licenciado en idiomas con 8 años de experiencia. Clases para niños y adultos en tu apartamento o en el salón de estudio. Preparación para exámenes internacionales.",
    price: "Clase de 1 hora: $45.000",
    schedule: "Lunes a sábado, 2:00 p. m. a 8:00 p. m.",
    callHours: null,
    reviews: [{ name: "Laura", fullName: "Laura Gómez", tower: "A", text: "Mi hija pasó de odiar el inglés a pedir más clases." }],
    keywords: ["inglés", "ingles", "idiomas", "clases", "tareas", "profesor"],
  },
  {
    id: "marta",
    neighbor: { id: "marta", name: "Marta Lucía Ospina", firstName: "Marta", apartment: "703", tower: "C", verified: true, feminine: true },
    title: "Postres y tortas por encargo",
    shortRole: "Repostera",
    category: "comida",
    rating: 4.9,
    reviewCount: 19,
    description: "Tortas de cumpleaños, cheesecake y postres sin azúcar. Pide con dos días de anticipación.",
    longDescription:
      "Tortas de cumpleaños, cheesecake y postres sin azúcar. Pide con dos días de anticipación. Entrego en la portería de tu torre.",
    price: "Torta para 12 personas: desde $85.000",
    schedule: "Pedidos de lunes a jueves; entregas hasta el domingo",
    callHours: null,
    reviews: [{ name: "Hernán", fullName: "Hernán Vélez", tower: "B", text: "La torta de zanahoria es la mejor que he probado." }],
    keywords: ["tortas", "postres", "comida", "cumpleaños", "cheesecake", "repostería"],
  },
];

export function getService(id: string) {
  return services.find((s) => s.id === id) ?? null;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function searchServices(query: string, list: NeighborService[] = services) {
  const q = fold(query);
  if (!q) return list;
  return list.filter((s) => [s.title, s.neighbor.name, s.description, ...s.keywords].some((t) => fold(t).includes(q)));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatRating(n: number) {
  return n.toFixed(1).replace(".", ",");
}

/* ───────────────────────────── Marketplace ───────────────────────────── */

export type ProductCategory = "ropa" | "hogar" | "ninos" | "otro";
export type ProductCondition = "nuevo" | "como-nuevo" | "usado";

export const productCategories: { id: ProductCategory; label: string }[] = [
  { id: "ropa", label: "Ropa" },
  { id: "hogar", label: "Hogar" },
  { id: "ninos", label: "Niños" },
  { id: "otro", label: "Otro" },
];

export const productConditions: { id: ProductCondition; label: string }[] = [
  { id: "nuevo", label: "Nuevo" },
  { id: "como-nuevo", label: "Como nuevo" },
  { id: "usado", label: "Usado" },
];

export type Product = {
  id: string;
  title: string;
  price: number;
  previousPrice?: number;
  image: string;
  category: ProductCategory;
  conditionLabel: string;
  description: string;
  delivery: string;
  seller: Neighbor;
  /** Con Supabase: id del producto, fotos y cuenta del vendedor (null = vendedor de ejemplo). */
  dbId?: string;
  images?: string[];
  ownerId?: string | null;
  acceptsMessages?: boolean;
};

const seller = (id: string, name: string, tower: string): Neighbor => ({
  id,
  name,
  firstName: name.split(" ")[0],
  apartment: "",
  tower,
  verified: true,
});

export const products: Product[] = [
  {
    id: "buso-talla-m",
    title: "Buso Nike talla M",
    price: 90000,
    image: "/images/marketplace/buso.jpg",
    category: "ropa",
    conditionLabel: "Usado · como nuevo",
    description: "Lo usé dos veces, me quedó grande. Algodón perizado, color negro.",
    delivery: "Entrega en portería, sin salir del conjunto",
    seller: seller("mateo", "Mateo Rincón", "D"),
  },
  {
    id: "sudadera-deportiva",
    title: "Sudadera deportiva",
    price: 120000,
    image: "/images/marketplace/sudadera.jpg",
    category: "ropa",
    conditionLabel: "Usado · buen estado",
    description: "Conjunto de buso y pantalón, talla S. Lavado a mano.",
    delivery: "Entrega en portería, sin salir del conjunto",
    seller: seller("valeria", "Valeria Muñoz", "A"),
  },
  {
    id: "chaqueta-verde-oliva",
    title: "Chaqueta verde oliva",
    price: 80000,
    image: "/images/marketplace/chaqueta.jpg",
    category: "ropa",
    conditionLabel: "Usado · como nuevo",
    description: "Chaqueta de paño, talla 38. Ideal para disfraces o colección.",
    delivery: "Entrega en portería, sin salir del conjunto",
    seller: seller("andres", "Andrés Salazar", "C"),
  },
  {
    id: "balon-autografiado",
    title: "Balón autografiado",
    price: 500000,
    previousPrice: 700000,
    image: "/images/marketplace/balon.jpg",
    category: "otro",
    conditionLabel: "Colección",
    description: "Balón firmado por el plantel campeón. Incluye certificado.",
    delivery: "Entrega en portería, sin salir del conjunto",
    seller: seller("felipe", "Felipe Arango", "B"),
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id) ?? null;
}

/** "$90.000" */
export function formatPrice(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

/* ───────────────────────────── Chats de ejemplo ───────────────────────────── */

export type ChatMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  /** Texto (por defecto), foto o audio. */
  kind?: "text" | "photo" | "audio";
  /** Enlace temporal a la foto o el audio (carpeta privada "chat"). */
  media?: string;
  /** Ruta del archivo en Storage, para borrarlo con "Eliminar para todos". */
  path?: string;
  /** Duración del audio en segundos. */
  duration?: number;
  /** Onda del audio: niveles de volumen de 0 a 100 (para dibujar las barras). */
  wave?: number[];
  /** Subiéndose todavía. */
  sending?: boolean;
  /** Solo en los propios: el otro vecino ya lo vio (doble chulo azul). */
  read?: boolean;
};

export const sampleChats: Record<string, ChatMessage[]> = {
  camila: [
    { id: "1", mine: true, text: "Hola Camila, soy Sandra del 204 de la Torre E. ¿Tienes cupo para pasear a Toby en las tardes?", time: "5:12 p. m." },
    { id: "2", mine: false, text: "¡Hola Sandra! Sí, el grupo de las 6:00 p. m. tiene un cupo. ¿Toby se lleva bien con otros perros?", time: "5:15 p. m." },
    { id: "3", mine: true, text: "Sí, es muy sociable. ¿Podemos empezar el lunes?", time: "5:16 p. m." },
  ],
  "buso-talla-m": [
    { id: "1", mine: true, text: "Hola Mateo, ¿todavía tienes el buso Nike? ¿Me lo puedes dejar en portería?", time: "5:12 p. m." },
    { id: "2", mine: false, text: "¡Hola! Sí, lo tengo. Te lo dejo hoy a las 7:00 p. m. en la portería de la Torre E.", time: "5:15 p. m." },
    { id: "3", mine: true, text: "Perfecto, te transfiero apenas lo reciba. ¡Gracias!", time: "5:16 p. m." },
  ],
};

export const reportReasons = [
  "No parece de un vecino del conjunto",
  "Producto prohibido o peligroso",
  "Precio o información engañosa",
  "Otro motivo",
] as const;
