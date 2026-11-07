"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type CheckboxFieldProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

/** Casilla + texto 13/18 (R5 "Casilla · …"), gap 12. Toda la fila es clicable. */
export function CheckboxField({ id, checked, onCheckedChange, children, className }: CheckboxFieldProps) {
  return (
    <div className={cn("flex w-full items-start gap-3", className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      <label htmlFor={id} className="cursor-pointer text-caption text-text">
        {children}
      </label>
    </div>
  );
}

/** Lista de interruptores (R6 "Qué muestro"): blanca, radio 16, padding 4/16. */
export function ToggleList({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex w-full flex-col rounded-card bg-surface px-4 py-1", className)} {...props}>
      {children}
    </ul>
  );
}

type ToggleRowProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** Fila con texto 15/22 y switch, padding vertical 12. */
export function ToggleRow({ id, label, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <li className="flex w-full items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="cursor-pointer text-body text-text">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </li>
  );
}
