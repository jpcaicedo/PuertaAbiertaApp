import { Screen } from "./screen";

/** Bloque gris que late mientras carga. */
function Bone({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[14px] bg-surface-muted ${className}`} />;
}

/**
 * Esqueleto que se ve al instante al tocar un enlace, mientras el servidor trae los datos.
 * `variant="home"` imita las pestañas (encabezado con avatar y tarjetas); `detail`, las pantallas de detalle.
 */
export function PageSkeleton({ variant }: { variant: "home" | "detail" }) {
  return (
    <Screen className={variant === "home" ? "pb-tabbar" : undefined} aria-busy="true">
      <span className="sr-only" role="status">
        Cargando…
      </span>
      {variant === "home" ? (
        <div className="flex h-16 items-center gap-2.5 px-5 pt-[max(40px,env(safe-area-inset-top))] box-content">
          <Bone className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Bone className="h-3.5 w-20" />
            <Bone className="h-3 w-28" />
          </div>
        </div>
      ) : (
        <div className="h-[92px] shrink-0 pt-[max(48px,env(safe-area-inset-top))] pl-3">
          <Bone className="size-10 rounded-full" />
        </div>
      )}
      <div className="flex flex-col gap-4 px-5 pt-3">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-64" />
        <Bone className="h-28 w-full rounded-[20px]" />
        <Bone className="h-44 w-full rounded-[20px]" />
        <Bone className="h-28 w-full rounded-[20px]" />
      </div>
    </Screen>
  );
}
