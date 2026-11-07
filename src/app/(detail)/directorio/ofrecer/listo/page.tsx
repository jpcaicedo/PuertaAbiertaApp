import { Confirmation } from "@/components/directorio/confirmation";

export const metadata = { title: "Servicio publicado · Directorio" };

/** D7 · Servicio publicado (484:3950) */
export default function ServicioPublicadoPage() {
  return (
    <Confirmation
      title="Tu servicio ya está en el Directorio"
      description="Te avisamos cuando un vecino te escriba. Puedes pausarlo o editarlo cuando quieras desde Perfil, en Mis publicaciones."
      primary={{ label: "Volver al Directorio", href: "/directorio" }}
    />
  );
}
