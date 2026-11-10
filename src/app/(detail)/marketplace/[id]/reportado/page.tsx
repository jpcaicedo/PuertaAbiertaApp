import { Confirmation } from "@/components/directorio/confirmation";

export const metadata = { title: "Reporte enviado · Marketplace" };

/** D15 · Reporte enviado (484:5350) */
export default function ReporteEnviadoPage() {
  return (
    <Confirmation
      title="Gracias por avisar"
      description="La administración revisará la publicación en las próximas 24 horas. Si no cumple las normas de la comunidad, la retirará."
      primary={{ label: "Volver al Marketplace", href: "/marketplace" }}
    />
  );
}
