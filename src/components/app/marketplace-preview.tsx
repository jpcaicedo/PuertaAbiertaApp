import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/app/section-header";
import { formatPrice, type Product } from "@/lib/directory/data";

/**
 * Inicio · Marketplace: lo último que publicaron los vecinos, en una fila que se desliza,
 * y al final un acceso para vender. "Ver todo" lleva a la sección completa.
 */
export function MarketplacePreview({ products }: { products: Product[] }) {
  const latest = products.slice(0, 6);
  return (
    <section aria-labelledby="marketplace" className="mt-[26px] flex w-full flex-col gap-3">
      <SectionHeader id="marketplace" title="Marketplace" action={{ label: "Ver todos", href: "/marketplace" }} />
      <p className="-mt-2 text-caption text-text-secondary">Compra y vende entre vecinos del conjunto.</p>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 [scrollbar-width:none]">
        {latest.map((p) => (
          <li key={p.id} className="w-[136px] shrink-0 snap-start">
            <Link
              href={`/marketplace/${p.id}`}
              className="group flex flex-col gap-1 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span className="relative mb-1 block aspect-square w-full overflow-hidden rounded-card bg-note">
                <Image src={p.image} alt="" fill sizes="136px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </span>
              <span className="text-body font-bold text-text">{formatPrice(p.price)}</span>
              <span className="line-clamp-2 text-caption text-text">{p.title}</span>
            </Link>
          </li>
        ))}
        <li className="w-[136px] shrink-0 snap-start">
          <Link
            href="/marketplace/vender"
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface px-3 text-center transition-colors hover:border-brand/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span aria-hidden className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
              <Plus className="size-5" strokeWidth={2.25} />
            </span>
            <span className="text-caption font-semibold text-brand">Vender algo</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
