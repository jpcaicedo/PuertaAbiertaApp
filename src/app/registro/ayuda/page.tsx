import Link from "next/link";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactCard } from "@/components/app/cards";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { administration } from "@/lib/mock-data";

/** R3 · Ayuda de la administración (484:1971) */
export default function AyudaPage() {
  const waText = encodeURIComponent("Hola, necesito mi código de residencia para Puerta Abierta.");
  return (
    <Screen>
      <ScreenHeader backHref="/registro/codigo" />
      <ScreenBody gap={20}>
        <ScreenTitle>Pide tu código a la administración</ScreenTitle>
        <ScreenDescription>
          Cada apartamento tiene un código personal. Si no lo recibiste o lo perdiste, la administración te lo envía de
          nuevo.
        </ScreenDescription>
        <ContactCard
          icon={Building}
          name={administration.name}
          location={administration.location}
          schedule={administration.schedule}
        />
      </ScreenBody>

      <ScreenActions className="pb-[max(44px,env(safe-area-inset-bottom))]">
        <Button asChild>
          <a href={`https://wa.me/${administration.whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a href={`tel:${administration.phone}`}>Llamar a la administración</a>
        </Button>
        <Button asChild variant="link">
          <Link href="/registro/codigo">Volver a ingresar el código</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}
