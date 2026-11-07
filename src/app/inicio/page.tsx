import Link from "next/link";
import { Screen, ScreenBody, ScreenDescription, ScreenTitle } from "@/components/app/screen";

/** Placeholder: el flujo "2 · Inicio" (I1–I4) se implementa en la siguiente entrega. */
export default function InicioPage() {
  return (
    <Screen>
      <ScreenBody className="pt-24">
        <ScreenTitle>Inicio</ScreenTitle>
        <ScreenDescription>Esta pantalla llega en el siguiente flujo (I1 · Inicio).</ScreenDescription>
        <Link href="/" className="text-caption font-semibold text-brand hover:underline">
          Volver a la bienvenida
        </Link>
      </ScreenBody>
    </Screen>
  );
}
