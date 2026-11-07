import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";
import { StatusCircle } from "@/components/agenda/primitives";

type Action = { label: string; href: string };

/**
 * Confirmación centrada (D7, D11, D15 y A12): círculo verde de 70 a 240px del borde,
 * título 22/28 centrado, texto 15/22 y uno o dos botones al fondo.
 */
export function Confirmation({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: Action;
  secondary?: Action;
}) {
  return (
    <Screen>
      <div className="flex flex-col items-center gap-4 px-5 pt-[240px] text-center">
        <StatusCircle icon={Check} tone="success" size="lg" />
        <h1 className="w-full text-title font-bold text-text">{title}</h1>
        <p className="w-full text-body text-text-secondary">{description}</p>
      </div>
      <ScreenActions className={secondary ? "pb-[max(44px,env(safe-area-inset-bottom))]" : undefined}>
        <Button asChild className="rounded-[80px]">
          <Link href={primary.href}>{primary.label}</Link>
        </Button>
        {secondary && (
          <Button asChild variant="secondary" className="rounded-[80px]">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        )}
      </ScreenActions>
    </Screen>
  );
}
