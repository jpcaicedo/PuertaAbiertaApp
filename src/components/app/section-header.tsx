import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  id: string;
  title: string;
  action?: { label: string; href: string };
  className?: string;
};

/** Título de sección: 18/24 SemiBold + enlace 13/18 SemiBold azul a la derecha. */
export function SectionHeader({ id, title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <h2 id={id} className="text-heading font-semibold text-text">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="-m-2 rounded-md p-2 text-caption font-semibold text-brand underline-offset-2 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
