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
