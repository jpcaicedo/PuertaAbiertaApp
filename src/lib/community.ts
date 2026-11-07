import { Eye, Heart, ShieldCheck } from "lucide-react";

/** Normas que el vecino acepta al registrarse (R5) y que puede releer desde Perfil (P1). */
export const communityRules = [
  {
    icon: ShieldCheck,
    title: "Solo vecinos verificados",
    description: "Todos entran con el código de su apartamento.",
  },
  { icon: Heart, title: "Trato respetuoso", description: "Nada de acoso, discriminación ni ventas engañosas." },
  { icon: Eye, title: "Tú decides qué se ve", description: "Puedes ocultar tu teléfono, tu apartamento o tu perfil." },
] as const;
