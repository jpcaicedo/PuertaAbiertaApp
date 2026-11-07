import * as React from "react";
import { CircleCheck, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTile } from "./icon-tile";

/** Banner de éxito (R4 "Código válido"): fondo #DDF3E6, radio 14, padding 12/14, icono 20. */
export function SuccessBanner({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex w-full items-center gap-2.5 rounded-chip bg-success-soft px-3.5 py-3 text-success", className)}
    >
      <CircleCheck className="size-5 shrink-0" strokeWidth={2} aria-hidden />
      <p className="text-caption font-semibold">{children}</p>
    </div>
  );
}

type RuleCardProps = { icon: LucideIcon; title: string; description: string };

/** Tarjeta de norma (R5): blanca, radio 16, padding 14, gap 12, tile pequeño. */
export function RuleCard({ icon, title, description }: RuleCardProps) {
  return (
    <li className="flex w-full items-start gap-3 rounded-card bg-surface p-3.5">
      <IconTile icon={icon} size="sm" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body font-semibold text-text">{title}</p>
        <p className="w-[258px] max-w-full text-caption text-text-secondary">{description}</p>
      </div>
    </li>
  );
}

type ContactCardProps = {
  icon: LucideIcon;
  name: string;
  location: string;
  schedule: string;
};

/** Tarjeta de la administración (R3): blanca, radio 20, padding 18, gap 14. */
export function ContactCard({ icon, name, location, schedule }: ContactCardProps) {
  return (
    <section aria-label={name} className="flex w-full flex-col items-start gap-3.5 rounded-panel bg-surface p-[18px]">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} size="md" />
        <div className="flex flex-col gap-0.5">
          <p className="text-body font-semibold text-text">{name}</p>
          <p className="text-caption text-text-secondary">{location}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-caption text-text-secondary">
        <Clock className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
        {schedule}
      </p>
    </section>
  );
}
