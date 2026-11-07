import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón (componente Figma "Botón", 476:1123).
 * - primary   → negro, pill (radio 48), alto 47
 * - secondary → blanco con borde #F1F1F1 y sombra suave (radio 43), alto 47
 * - link      → solo texto azul, alto 52, radio 16
 */
const buttonVariants = cva(
  [
    "inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "text-label font-medium select-none cursor-pointer",
    "transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-5",
  ],
  {
    variants: {
      variant: {
        primary: "h-[47px] rounded-[48px] bg-ink text-text-on-dark hover:bg-ink-hover",
        secondary:
          "h-[47px] rounded-[43px] border border-border-subtle bg-surface text-text shadow-button hover:bg-[#f4f5f7] dark:hover:bg-surface-muted",
        link: "h-[52px] rounded-card text-brand hover:text-brand-hover hover:bg-brand-soft/40",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renderiza el hijo (p. ej. `<Link>` o `<a>`) con los estilos del botón. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
