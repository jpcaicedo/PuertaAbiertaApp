"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { RuleCard } from "@/components/app/cards";
import { CheckboxField } from "@/components/app/controls";
import { IconTile } from "@/components/app/icon-tile";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { communityRules } from "@/lib/community";

/** R5 · Normas y datos personales (484:2036) + R5b · No acepta (484:2080) */
export default function NormasPage() {
  const router = useRouter();
  const [acceptsRules, setAcceptsRules] = React.useState(false);
  const [acceptsData, setAcceptsData] = React.useState(false);
  const [declineOpen, setDeclineOpen] = React.useState(false);
  const canContinue = acceptsRules && acceptsData;

  return (
    <Screen>
      <ScreenHeader />
      <ScreenBody gap={14} className="pt-3">
        <ScreenTitle>Antes de entrar a tu comunidad</ScreenTitle>
        <ScreenDescription size="sm">Lo aceptas una sola vez y aplica a todo lo que hagas en la app.</ScreenDescription>

        <ul className="flex w-full flex-col gap-3.5">
          {communityRules.map((rule) => (
            <RuleCard key={rule.title} {...rule} />
          ))}
        </ul>

        <CheckboxField id="acepta-normas" checked={acceptsRules} onCheckedChange={setAcceptsRules}>
          Acepto las normas de la comunidad.
        </CheckboxField>
        <CheckboxField id="acepta-datos" checked={acceptsData} onCheckedChange={setAcceptsData}>
          Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012.{" "}
          <Link href="/politica-de-datos" className="text-brand underline-offset-2 hover:underline">
            Ver política de datos
          </Link>
        </CheckboxField>
      </ScreenBody>

      <ScreenActions>
        <Button disabled={!canContinue} onClick={() => router.push("/registro/perfil")}>
          Aceptar y continuar
        </Button>
        <Button variant="link" onClick={() => setDeclineOpen(true)}>
          No acepto
        </Button>
      </ScreenActions>

      <BottomSheet open={declineOpen} onOpenChange={setDeclineOpen}>
        <BottomSheetContent>
          <IconTile icon={Lock} size="lg" tone="warning" iconSize={24} />
          <BottomSheetTitle>Sin aceptar no podemos crear tu cuenta</BottomSheetTitle>
          <BottomSheetDescription>
            Las normas y la autorización de datos protegen a todos los vecinos. Puedes volver a registrarte cuando
            quieras con tu mismo código.
          </BottomSheetDescription>
          <BottomSheetClose asChild>
            <Button>Revisar de nuevo</Button>
          </BottomSheetClose>
          <Button asChild variant="secondary">
            <Link href="/">Salir</Link>
          </Button>
        </BottomSheetContent>
      </BottomSheet>
    </Screen>
  );
}
