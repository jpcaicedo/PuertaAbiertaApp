"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Caja de texto (Figma "Caja"): alto 52, radio 12, padding horizontal 16.
 * Reposo: borde 1px #C6C6CD · Foco: 2px azul · Error: 2px rojo.
 * El segundo pixel del borde se pinta con un box-shadow inset para que el
 * texto no se desplace al cambiar de estado (igual que el stroke "inside" de Figma).
 */
export const boxBase = [
  "flex w-full items-center gap-2.5 bg-surface px-4",
  "rounded-field border border-border transition-[border-color,box-shadow] duration-150",
  "focus-within:border-brand focus-within:shadow-[inset_0_0_0_1px_var(--pa-brand)]",
  "has-[input:disabled]:opacity-50 has-[textarea:disabled]:opacity-50",
];
export const boxError = "border-error shadow-[inset_0_0_0_1px_var(--pa-error)] focus-within:border-error focus-within:shadow-[inset_0_0_0_1px_var(--pa-error)]";
export const fieldText =
  "w-full min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Elemento al inicio de la caja (icono de 20px). */
  startAdornment?: React.ReactNode;
  /** Elemento al final de la caja (icono, botón). */
  endAdornment?: React.ReactNode;
  boxClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, boxClassName, invalid, startAdornment, endAdornment, ...props }, ref) => (
    <div className={cn(boxBase, "h-[52px]", invalid && boxError, boxClassName)}>
      {startAdornment}
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(fieldText, className)} {...props} />
      {endAdornment}
    </div>
  ),
);
Input.displayName = "Input";

export type PasswordInputProps = Omit<InputProps, "type" | "endAdornment" | "startAdornment">;

/** Input de contraseña con botón de mostrar/ocultar (icono eye 20px, #45464D). */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="-m-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-text-secondary transition-colors hover:bg-brand-soft/60 hover:text-text focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = "PasswordInput";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  boxClassName?: string;
}

/** Área de texto: misma caja, alto 76 y padding superior 14. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, boxClassName, invalid, ...props }, ref) => (
    <div className={cn(boxBase, "min-h-[76px] items-start pt-3.5 pb-2", invalid && boxError, boxClassName)}>
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldText, "field-sizing-content min-h-[44px] resize-none", className)}
        {...props}
      />
    </div>
  ),
);
Textarea.displayName = "Textarea";
