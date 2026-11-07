import { RegistrationProvider } from "./registration-context";

/** Mantiene en memoria los datos del registro mientras se pasa por R2 → R4 → R5 → R6. */
export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return <RegistrationProvider>{children}</RegistrationProvider>;
}
