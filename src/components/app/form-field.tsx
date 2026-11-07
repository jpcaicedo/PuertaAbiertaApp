import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  /** id del control; enlaza label, ayuda y error. */
  id: string;
  label: string;
  /** Texto de ayuda gris bajo la caja (se oculta si hay error). */
  hint?: string;
  /** Mensaje de error rojo con icono de alerta. */
  error?: string;
  className?: string;
  /** Recibe los atributos aria que debe llevar el input. */
  children: (aria: { id: string; "aria-describedby"?: string; invalid: boolean }) => React.ReactNode;
};

/**
 * Campo de formulario (Figma "Campo · …"): etiqueta 13/18 SemiBold, gap 6,
 * caja de 52px y nota 13/18 o error con icono de 16px.
 */
export function FormField({ id, label, hint, error, className, children }: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("flex w-full flex-col items-start gap-1.5", className)}>
      <label htmlFor={id} className="text-caption font-semibold text-text">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} role="alert" className="flex w-full items-start gap-1.5 text-caption text-error">
          <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="w-full text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
