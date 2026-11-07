"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown, type LucideIcon } from "lucide-react";
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

export function TimeRangeField({
  id,
  start,
  end,
  onChange,
  invalid,
  icon,
  prefix,
}: {
  id: string;
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
  invalid?: boolean;
  icon: LucideIcon;
  /** Texto antes de la hora, p. ej. "Hoy," en A11. */
  prefix?: string;
}) {
  return (
    <div id={id} className={cn(boxBase, "h-[52px]", invalid && boxError)}>
      <FieldIcon icon={icon} />
      <span className="flex min-w-0 flex-1 items-center gap-1 text-body text-text">
        {prefix && <span>{prefix}</span>}
        <NativePicker
          type="time"
          value={start}
          onChange={(v) => onChange({ start: v, end })}
          label="Hora de inicio"
          placeholder="Inicio"
          format={formatTime}
        />
        <span aria-hidden>a</span>
        <NativePicker
          type="time"
          value={end}
          onChange={(v) => onChange({ start, end: v })}
          label="Hora de fin"
          placeholder="Fin"
          format={formatTime}
        />
      </span>
    </div>
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
