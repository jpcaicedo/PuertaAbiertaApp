import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Contenedor cuadrado para iconos.
 *  size  sm: padding 8, radio 10, icono 20  (tarjetas de normas)
 *        md: padding 10, radio 12, icono 22 (tarjeta administración)
 *        lg: padding 12, radio 16, icono 26 (encabezado de pantalla) · 24 en hojas
 *        xl: padding 20, radio 40, icono 36 (confirmaciones)
 */
const tileVariants = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      sm: "p-2 rounded-[10px] [&_svg]:size-5",
      md: "p-2.5 rounded-field [&_svg]:size-[22px]",
      lg: "p-3 rounded-card [&_svg]:size-[26px]",
      xl: "p-5 rounded-[40px] [&_svg]:size-9",
    },
    tone: {
      brand: "bg-brand-soft text-brand",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      /** Sin fondo: así están R8 (candado) y R8b (sobre) en Figma. */
      plainBrand: "text-brand",
      plainSuccess: "text-success",
    },
  },
  defaultVariants: { size: "lg", tone: "brand" },
});

type IconTileProps = VariantProps<typeof tileVariants> & {
  icon: LucideIcon;
  className?: string;
  /** Tamaño del icono en px si difiere del de la variante (p. ej. 24 en la hoja R5b). */
  iconSize?: number;
};

export function IconTile({ icon: Icon, size, tone, className, iconSize }: IconTileProps) {
  return (
    <div className={cn(tileVariants({ size, tone }), className)} aria-hidden>
      <Icon strokeWidth={2} style={iconSize ? { width: iconSize, height: iconSize } : undefined} />
    </div>
  );
}
