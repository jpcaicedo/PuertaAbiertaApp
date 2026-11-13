import { Screen, ScreenBody, ScreenDescription, ScreenTitle } from "@/components/app/screen";
import { ZonesBackHeader } from "@/components/zonas/zones-back";
import { ZoneCard } from "@/components/zonas/ui";
import { zones } from "@/lib/zones/data";

export const metadata = { title: "Zonas comunes · Puerta Abierta" };

/** Z1 · Zonas comunes (484:4186). Se llega desde Inicio o desde Agenda («Reservar un espacio»): la pestaña activa y la flecha siguen a la de origen. */
export default function ZonasComunesPage() {
  return (
    <Screen className="pb-tabbar">
      <ZonesBackHeader />
      <ScreenBody gap={12} className="pt-3">
        <ScreenTitle>Zonas comunes</ScreenTitle>
        <ScreenDescription size="sm">Horarios, normas y reservas de Residencial Samán.</ScreenDescription>
        <ul className="flex w-full flex-col gap-3">
          {zones.map((z) => (
            <ZoneCard key={z.id} zone={z} />
          ))}
        </ul>
      </ScreenBody>
    </Screen>
  );
}
