import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";

/** R1 · Bienvenida (Figma 484:1910) */
export default function BienvenidaPage() {
  return (
    <Screen>
      {/* Foto 390×470 */}
      <div className="relative h-[470px] w-full shrink-0">
        <Image
          src="/images/bienvenida.jpg"
          alt="Vecinos escuchando un concierto acústico en la sala de un apartamento"
          fill
          priority
          sizes="720px"
          quality={90}
          className="object-cover object-[70%_center]"
        />
        {/* Logo: chip blanco, radio 14, padding 8/12, 20px del borde, 52px arriba */}
        <div className="absolute top-[max(52px,calc(env(safe-area-inset-top)+8px))] left-5 rounded-chip bg-surface px-3 py-2">
          <Image src="/images/logo-skema.svg" alt="Skema Promotora" width={48} height={32} unoptimized className="h-8 w-12 object-contain" />
        </div>
      </div>

      {/* Hoja: sube 50px sobre la foto, radio superior 28 */}
      <div className="relative -mt-[50px] flex flex-1 flex-col rounded-t-sheet bg-bg">
        <div className="flex flex-col items-start gap-3 px-5 pt-8">
          <p className="text-overline font-semibold tracking-normal text-brand uppercase">Puerta Abierta</p>
          <h1 className="text-display font-bold text-text">Tu edificio también es tu comunidad</h1>
          <p className="text-body text-text-secondary">
            Conoce a tus vecinos, descubre lo mejor de tu barrio y participa en lo que pasa en tu edificio.
          </p>
        </div>

        <ScreenActions className="pb-[max(44px,env(safe-area-inset-bottom))]">
          <Button asChild>
            <Link href="/registro/codigo">Crear cuenta con mi código</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ingresar">Ya tengo cuenta</Link>
          </Button>
          <p className="text-caption text-text-tertiary">Solo para residentes de proyectos Skema</p>
        </ScreenActions>
      </div>
    </Screen>
  );
}
