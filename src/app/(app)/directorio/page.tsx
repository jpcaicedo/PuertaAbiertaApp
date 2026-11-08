import { ServicesScreen } from "@/components/directorio/services";
import { getServices } from "@/lib/directory/queries";

export const metadata = { title: "Directorio · Puerta Abierta" };

/** D1 · Directorio · Vecinos y servicios */
export default async function DirectorioPage() {
  return <ServicesScreen services={await getServices()} />;
}
