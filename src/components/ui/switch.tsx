"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Interruptor 46×28 (registro) o 48×28 (`size="lg"`, Perfil).
 * Encendido: pista azul · Apagado: pista #C6C6CD (md) o #D5DAE3 (lg). Perilla blanca de 22px.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { size?: "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full p-[3px]",
      "transition-colors duration-200 data-[state=checked]:bg-brand",
      "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      "disabled:cursor-not-allowed disabled:opacity-40",
      size === "md" ? "w-[46px] data-[state=unchecked]:bg-border" : "w-12 data-[state=unchecked]:bg-handle",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-[22px] rounded-full bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.15)]",
        "transition-transform duration-200 data-[state=unchecked]:translate-x-0",
        size === "md" ? "data-[state=checked]:translate-x-[18px]" : "data-[state=checked]:translate-x-5",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
