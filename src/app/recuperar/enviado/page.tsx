import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/app/icon-tile";
import { Screen, ScreenActions } from "@/components/app/screen";
import { ResendButton } from "./resend-button";

type Props = { searchParams: Promise<{ correo?: string }> };

/** R8b · Enlace enviado (484:2236) */
export default async function EnlaceEnviadoPage({ searchParams }: Props) {
  const { correo } = await searchParams;
  return (
    <Screen>
      {/* Bloque centrado a 250px del borde superior, gap 16 */}
      <div className="flex flex-col items-center gap-4 px-5 pt-[250px] text-center">
        <IconTile icon={Mail} size="xl" tone="plainSuccess" />
        <h1 className="w-full text-title font-bold text-text">Revisa tu correo</h1>
        <p className="w-full text-body text-pretty text-text-secondary">
          Enviamos un enlace a {correo || "tu correo"}. Vence en 30 minutos.
        </p>
      </div>

      <ScreenActions>
        <Button asChild>
          <Link href="/ingresar">Volver a iniciar sesión</Link>
        </Button>
        <ResendButton email={correo ?? ""} />
      </ScreenActions>
    </Screen>
  );
}
