import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { ActionBar, DetailHero, DetailSheet } from "@/components/agenda/primitives";
import { ReportButton } from "@/components/directorio/marketplace";
import { Avatar, VerifiedMark } from "@/components/directorio/ui";
import { formatPrice, getProduct, products } from "@/lib/directory/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const p = getProduct((await params).id);
  return { title: p ? `${p.title} · Marketplace` : "Marketplace" };
}

/** D9 · Detalle del producto (484:4027) · el reporte abre D14 */
export default async function ProductoPage({ params }: Props) {
  const p = getProduct((await params).id);
  if (!p) notFound();

  return (
    <Screen>
      <DetailHero backHref="/directorio/marketplace" image={p.image} imageAlt={p.title} photoHeight={360} />
      <DetailSheet>
        <p className="text-display font-bold text-text">
          {formatPrice(p.price)}
          {p.previousPrice && (
            <span className="ml-2 align-middle text-body font-normal text-text-tertiary line-through">
              <span className="sr-only">Antes </span>
              {formatPrice(p.previousPrice)}
            </span>
          )}
        </p>
        <h1 className="-mt-1 text-heading font-semibold text-text">{p.title}</h1>
        <span className="rounded-[20px] bg-success-soft px-2.5 py-1 text-overline font-medium text-success">{p.conditionLabel}</span>
        <p className="text-body text-text-secondary">{p.description}</p>
        <p className="flex items-center gap-2 text-caption text-text">
          <Package className="size-[18px] shrink-0 text-brand" strokeWidth={2} aria-hidden />
          {p.delivery}
        </p>

        <div className="flex w-full items-center gap-3 rounded-card bg-surface p-3">
          <Avatar name={p.seller.name} src={p.seller.avatar} size={40} />
          <div className="flex flex-col">
            <p className="flex items-center gap-1.5 text-body font-semibold text-text">
              {p.seller.name}
              {p.seller.verified && <VerifiedMark />}
            </p>
            <p className="text-caption text-text-secondary">Vecino verificado, Torre {p.seller.tower}</p>
          </div>
        </div>

        <ReportButton productId={p.id} />
      </DetailSheet>

      <ActionBar>
        <Button asChild className="rounded-[80px]">
          <Link href={`/directorio/marketplace/${p.id}/mensaje`}>Escribir al vendedor</Link>
        </Button>
      </ActionBar>
    </Screen>
  );
}
