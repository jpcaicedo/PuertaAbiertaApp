"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown, CircleAlert, Clock, type LucideIcon } from "lucide-react";
import { boxBase, boxError } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatLongDate, formatTime } from "@/lib/agenda/format";

/** Icono de campo: 20px azul (Figma icono/calendar, clock, users, pin…). */
export function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-5 shrink-0 text-brand" strokeWidth={2} aria-hidden />;
}

type NativePickerProps = {
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  format: (v: string) => string;
  min?: string;
  className?: string;
  "aria-describedby"?: string;
};

/**
 * Muestra el valor con el formato del diseño ("Sábado 24 de octubre", "4:00 p. m.")
 * y abre el selector nativo del sistema al tocarlo: en el celular es la rueda/calendario de iOS o Android.
 */
function NativePicker({ type, value, onChange, label, placeholder, format, min, className, ...aria }: NativePickerProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <span className={cn("relative inline-flex min-w-0 items-center", className)}>
      <span aria-hidden className={cn("truncate text-body", value ? "text-text" : "text-text-tertiary")}>
        {value ? format(value) : placeholder}
      </span>
      <input
        ref={ref}
        type={type}
        value={value}
        min={min}
        aria-label={label}
        {...aria}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => {
          try {
            ref.current?.showPicker();
          } catch {
            /* navegadores sin showPicker abren el selector igual al enfocar */
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </span>
  );
}

export function DateField({
  id,
  value,
  onChange,
  invalid,
  ...aria
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <div id={id} className={cn(boxBase, "h-[52px] focus-within:border-brand", invalid && boxError)}>
      <FieldIcon icon={CalendarIcon} />
      <NativePicker
        type="date"
        value={value}
        onChange={onChange}
        label="Fecha"
        placeholder="Elige una fecha"
        format={(v) => formatLongDate(v, "")}
        className="flex-1"
        {...aria}
      />
    </div>
  );
}

/** Suma una hora a "HH:MM" (sin pasar de las 23:59). */
function plusOneHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return h >= 23 ? "23:59" : `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Hora de inicio y hora de fin, cada una en su propio campo con su etiqueta (lado a lado).
 * Al elegir el inicio, si el fin está vacío se propone una hora después (se puede cambiar).
 */
export function TimeRangeField({
  id,
  start,
  end,
  onChange,
  invalid,
  error,
  legend = "Hora",
  hint,
}: {
  id: string;
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
  /** Qué campo marcar en rojo. */
  invalid?: "start" | "end" | "both";
  error?: string;
  /** Título del grupo, p. ej. "Hora" o "Hoy". */
  legend?: string;
  hint?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const fields = [
    { key: "start" as const, label: "Hora de inicio", value: start, placeholder: "Elige hora" },
    { key: "end" as const, label: "Hora de fin", value: end, placeholder: "Elige hora" },
  ];

  return (
    <fieldset id={id} className="flex w-full min-w-0 flex-col gap-1.5">
      <legend className="sr-only">{legend}</legend>
      <div className="grid w-full grid-cols-2 gap-3">
        {fields.map((f) => {
          const bad = invalid === "both" || invalid === f.key;
          return (
            <div key={f.key} className="flex min-w-0 flex-col gap-1.5">
              <span id={`${id}-${f.key}-label`} className="text-caption font-semibold text-text">
                {f.label}
              </span>
              <div className={cn(boxBase, "h-[52px] gap-2 px-3.5 focus-within:border-brand", bad && boxError)}>
                <FieldIcon icon={Clock} />
                <NativePicker
                  type="time"
                  value={f.value}
                  onChange={(v) =>
                    f.key === "start"
                      ? onChange({ start: v, end: end || (v ? plusOneHour(v) : "") })
                      : onChange({ start, end: v })
                  }
                  label={`${f.label}${legend !== "Hora" ? ` (${legend.toLowerCase()})` : ""}`}
                  placeholder={f.placeholder}
                  format={formatTime}
                  className="flex-1"
                  aria-describedby={describedBy}
                />
              </div>
            </div>
          );
        })}
      </div>
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
    </fieldset>
  );
}

/** Lista desplegable con icono y chevron (Figma "Campo · Lugar"). */
export function SelectField({
  id,
  icon,
  value,
  onChange,
  options,
}: {
  id: string;
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className={cn(boxBase, "relative h-[52px]")}>
      <FieldIcon icon={icon} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-body text-text outline-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-5 text-text-tertiary" strokeWidth={2} aria-hidden />
    </div>
  );
}
