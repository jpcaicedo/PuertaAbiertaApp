import { Confirmation } from "@/components/directorio/confirmation";

export const metadata = { title: "Producto publicado · Marketplace" };

/** D11 · Producto publicado (484:4174) */
export default function ProductoPublicadoPage() {
  return (
    <Confirmation
      title="Tu producto ya está en el Marketplace"
      description="Te avisamos cuando un vecino te escriba. Cuando lo vendas, márcalo como vendido en Mis publicaciones."
      primary={{ label: "Volver al Marketplace", href: "/directorio/marketplace" }}
      secondary={{ label: "Ver mis publicaciones", href: "/directorio/mis-publicaciones" }}
    />
  );
}
