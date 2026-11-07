"use client";

import * as React from "react";

/**
 * Datos del registro mientras se pasa de R2 a R5. Viven solo en memoria (no se guardan en el
 * navegador), así la contraseña nunca queda escrita. Si se recarga la página, se vuelve a R2.
 */
export type RegistrationDraft = { code: string; unitLabel: string; name: string; email: string; password: string };

type Ctx = {
  draft: Partial<RegistrationDraft>;
  update: (patch: Partial<RegistrationDraft>) => void;
  clear: () => void;
};

const RegistrationContext = React.createContext<Ctx | null>(null);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<Partial<RegistrationDraft>>({});
  const value = React.useMemo<Ctx>(
    () => ({
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      clear: () => setDraft({}),
    }),
    [draft],
  );
  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const ctx = React.useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration debe usarse dentro de /registro");
  return ctx;
}

export const isCompleteDraft = (d: Partial<RegistrationDraft>): d is RegistrationDraft =>
  Boolean(d.code && d.name && d.email && d.password);
