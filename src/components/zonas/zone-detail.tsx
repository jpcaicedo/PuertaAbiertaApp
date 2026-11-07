import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { ActionBar, DetailHero, DetailSheet, InfoList, InfoRow } from "@/components/agenda/primitives";
import type { ApprovalZone, FreeZone } from "@/lib/zones/data";
import { RulesCard, ZoneTag } from "./ui";

/**
 * Z2 · Salón social (484:4273) y Z8 · Piscina (484:4322).
 * Foto o cabecera azul de 240, hoja que sube 24, etiqueta, nombre 28/34, datos y normas.
 * Solo las zonas con aprobación llevan la barra «Reservar».
 */
export function ZoneDetail({ zone }: { zone: ApprovalZone | FreeZone }) {
  const capacity = <InfoRow icon={Users}>Aforo máximo: {zone.capacity} personas</InfoRow>;
  const hours = <InfoRow icon={Clock}>{zone.hours}</InfoRow>;

  return (
    <Screen>
      <DetailHero
        backHref="/zonas-comunes"
        image={zone.image}
        imageAlt={zone.name}
        illustration={zone.icon}
        illustrationTone="brand"
        photoHeight={240}
      />
      <DetailSheet className="pb-8">
        <ZoneTag mode={zone.booking} />
        <h1 className="text-display font-bold text-text">{zone.name}</h1>
        <InfoList size="md">
          {/* El diseño ordena distinto: aforo primero en las que se reservan, horario primero en las libres. */}
          {zone.booking === "approval" ? (
            <>
              {capacity}
              {hours}
            </>
          ) : (
            <>
              {hours}
              {capacity}
            </>
          )}
          <InfoRow icon={MapPin}>{zone.location}</InfoRow>
        </InfoList>
        <RulesCard rules={zone.rules} />
      </DetailSheet>

      {zone.booking === "approval" && (
        <ActionBar>
          <Button asChild className="flex-1">
            <Link href={`/zonas-comunes/${zone.id}/reservar`}>Reservar</Link>
          </Button>
        </ActionBar>
      )}
    </Screen>
  );
}
