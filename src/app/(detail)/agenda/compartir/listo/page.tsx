import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";
import { StatusCircle } from "@/components/agenda/primitives";

export const metadata = { title: "Evento compartido · Agenda" };

/** A12 · Evento compartido (484:4878) */
export default function EventoCompartidoPage() {
  return (
    <Screen>
      <div className="flex flex-col items-center gap-4 px-5 pt-[240px] text-center">
        <StatusCircle icon={Check} tone="success" size="lg" />
        <h1 className="w-full text-title font-bold text-text">Lo compartiste con tus vecinos</h1>
        <p className="w-full text-body text-text-secondary">
          Aparece en la Agenda como &quot;En el barrio&quot;, con tu nombre. Te avisamos cuando un vecino marque que va.
        </p>
      </div>
      <ScreenActions>
        <Button asChild className="rounded-[80px]">
          <Link href="/agenda">Volver a la agenda</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}
