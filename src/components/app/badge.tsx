import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Insignia (Figma "Insignia · …"): radio 20, padding 4 / 10 / 4 / 8, gap 5,
 * icono 14 y texto 12/16 Medium.
 */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-[5px] rounded-[20px] py-1 pr-2.5 pl-2 text-overline font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        brand: "bg-brand-soft text-brand",
        success: "bg-success-soft text-success",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function Badge({ icon: Icon, tone, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {Icon && <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}
