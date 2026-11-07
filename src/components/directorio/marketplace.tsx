"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Armchair, Baby, ChevronRight, Flag, MessageCircle, Package, Shirt, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { formatTimeAgo } from "@/lib/mock-data";
import { formatPrice, productCategories, products, reportReasons, type Product, type ProductCategory } from "@/lib/directory/data";
import { directoryActions, useDirectoryState, type MyListing } from "@/lib/directory/store";
import { cn } from "@/lib/utils";
import { DirectoryHeader } from "./services";
import { FilterChips, SearchLink, Toast } from "./ui";

/* ───────────────────────── D8 · Marketplace ───────────────────────── */

const productFilters: { id: "todos" | ProductCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...productCategories.filter((c) => c.id !== "otro"),
];

export function MarketplaceScreen() {
  const [filter, setFilter] = React.useState<"todos" | ProductCategory>("todos");
  const { listings } = useDirectoryState();
  const active = listings.filter((l) => !l.soldAt).length;
  const sold = listings.length - active;
  const list = products.filter((p) => filter === "todos" || p.category === filter);

  return (
    <DirectoryHeader active="marketplace" action={{ label: "Vender", href: "/directorio/marketplace/vender" }}>
      <SearchLink href="/directorio/buscar" label="Buscar productos" />

      {/* Mis publicaciones: blanca, radio 16, padding 14, tile 40 */}
      <Link
        href="/directorio/mis-publicaciones"
        className="flex w-full items-center gap-3 rounded-card border border-option-border bg-surface p-3.5 transition-shadow hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span aria-hidden className="inline-flex shrink-0 rounded-field bg-brand-soft p-2.5 text-brand">
          <Tag className="size-5" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body font-semibold text-text">Mis publicaciones</span>
          <span className="text-caption text-text-secondary">
            {active} a la venta, {sold} {sold === 1 ? "vendido" : "vendidos"}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
      </Link>

      <FilterChips label="Categoría" options={productFilters} value={filter} onChange={setFilter} />

      <ul className="grid w-full grid-cols-2 gap-x-2 gap-y-4">
        {list.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </DirectoryHeader>
  );
}

/** Producto: foto cuadrada radio 16, precio 17/24 Bold, título 13/18, vendedor 12/16. */
function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/directorio/marketplace/${p.id}`} className="group flex flex-col gap-1 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-bg">
      <span className="relative mb-1.5 block aspect-square w-full overflow-hidden rounded-card bg-note">
        <Image src={p.image} alt="" fill sizes="(max-width: 430px) 50vw, 200px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[17px] leading-6 font-bold text-text">{formatPrice(p.price)}</span>
        {p.previousPrice && (
          <span className="text-caption text-text-tertiary line-through">
            <span className="sr-only">Antes </span>
            {formatPrice(p.previousPrice)}
          </span>
        )}
      </span>
      <span className="text-caption text-text">{p.title}</span>
      <span className="text-overline text-text-tertiary">
        {p.seller.firstName} · Torre {p.seller.tower}
      </span>
    </Link>
  );
}

/* ───────────────────────── D14 · Reportar publicación ───────────────────────── */

export function ReportButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string>("");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-1 flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-label text-text-secondary hover:text-text outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Flag className="size-[18px]" strokeWidth={2} aria-hidden />
        Reportar publicación
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="gap-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <div className="flex w-full flex-col gap-1.5 px-1">
            <BottomSheetTitle className="text-headline font-bold">¿Qué pasa con esta publicación?</BottomSheetTitle>
            <BottomSheetDescription className="text-text-tertiary">
              La administración la revisa. El vendedor no sabrá quién la reportó.
            </BottomSheetDescription>
          </div>

          <fieldset className="w-full overflow-hidden rounded-card border border-option-border bg-surface">
            <legend className="sr-only">Motivo del reporte</legend>
            {reportReasons.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-option-border px-4 py-3.5 text-body text-text last:border-0 transition-colors has-[:focus-visible]:bg-brand-soft/40",
                  reason === r && "bg-brand-soft/60 font-semibold",
                )}
              >
                <input type="radio" name="motivo" value={r} checked={reason === r} onChange={() => setReason(r)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={cn(
                    "grid size-[22px] shrink-0 place-items-center rounded-full border-2 bg-surface transition-colors",
                    reason === r ? "border-brand" : "border-border",
                  )}
                >
                  {reason === r && <span className="size-2.5 rounded-full bg-brand" />}
                </span>
                {r}
              </label>
            ))}
          </fieldset>

          <Button
            disabled={!reason}
            onClick={() => {
              // TODO: POST /api/productos/:id/reportes { motivo }
              setOpen(false);
              router.push(`/directorio/marketplace/${productId}/reportado`);
            }}
          >
            Enviar reporte
          </Button>
          <BottomSheetClose asChild>
            <Button variant="link">Cancelar</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}

/* ───────────────────────── D12 · Mis publicaciones (+ D12b y D13) ───────────────────────── */

const listingIcon: Record<ProductCategory, typeof Armchair> = { hogar: Armchair, ropa: Shirt, ninos: Baby, otro: Package };

export function MyListingsScreen() {
  const { listings } = useDirectoryState();
  const [confirming, setConfirming] = React.useState<MyListing | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const clearToast = React.useCallback(() => setToast(null), []);

  const active = listings.filter((l) => !l.soldAt);
  const sold = listings.filter((l) => l.soldAt).sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""));
  const shortName = (t: string) => t.split(" ").slice(0, 1).join(" ").toLowerCase();

  return (
    <>
      <section aria-labelledby="a-la-venta" className="flex w-full flex-col gap-3">
        <h2 id="a-la-venta" className="text-heading font-semibold text-text">
          A la venta
        </h2>
        {active.length ? (
          active.map((l) => (
            <article key={l.id} className="flex w-full flex-col gap-3.5 rounded-[18px] border border-option-border bg-surface p-3.5">
              <ListingSummary listing={l} />
              <p className="flex items-center gap-2 rounded-[10px] bg-note px-3 py-2.5 text-label text-text">
                <MessageCircle className="size-[18px] shrink-0 text-brand" strokeWidth={2} aria-hidden />
                {l.messages === 0 ? "Todavía nadie te ha escrito" : `${l.messages} ${l.messages === 1 ? "vecino te escribió" : "vecinos te escribieron"}`}
              </p>
              <div className="flex w-full gap-2">
                <Button asChild variant="secondary" className="w-auto flex-1">
                  <Link href="/directorio/marketplace/vender">Editar</Link>
                </Button>
                <Button className="w-auto flex-[1.7]" onClick={() => setConfirming(l)}>
                  Marcar como vendido
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="flex w-full flex-col gap-3 rounded-[18px] border-[1.5px] border-dashed border-option-border p-4">
            <p className="text-label text-text-secondary">No tienes nada a la venta. ¿Te sobra algo en casa? Un vecino puede necesitarlo.</p>
            <Button asChild variant="secondary">
              <Link href="/directorio/marketplace/vender">Vender algo</Link>
            </Button>
          </div>
        )}
      </section>

      {sold.length > 0 && (
        <section aria-labelledby="vendidos" className="flex w-full flex-col gap-3 pt-3">
          <h2 id="vendidos" className="text-heading font-semibold text-text">
            Vendidos
          </h2>
          {sold.map((l) => (
            <article key={l.id} className="w-full rounded-[18px] border border-option-border bg-surface p-3.5">
              <ListingSummary listing={l} />
            </article>
          ))}
        </section>
      )}

      {/* D13 · ¿Ya lo vendiste? */}
      <BottomSheet open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <BottomSheetContent className="gap-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <div className="flex w-full flex-col gap-1.5 px-1">
            <BottomSheetTitle className="text-headline font-bold">
              ¿Ya vendiste {confirming ? `la ${shortName(confirming.title)}` : "el producto"}?
            </BottomSheetTitle>
            <BottomSheetDescription className="text-text-tertiary">
              Dejará de aparecer en el Marketplace
              {confirming?.messages ? ` y les avisaremos a los ${confirming.messages} vecinos que te escribieron` : ""}.
            </BottomSheetDescription>
          </div>
          <Button
            onClick={() => {
              if (!confirming) return;
              directoryActions.markSold(confirming.id);
              setToast(`Listo. La ${shortName(confirming.title)} ya no aparece en el Marketplace.`);
              setConfirming(null);
            }}
          >
            Sí, ya la vendí
          </Button>
          <BottomSheetClose asChild>
            <Button variant="link">Todavía no</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>

      <Toast message={toast} onDone={clearToast} />
    </>
  );
}

/** Tile 72 + título 15/22 + precio 17 Bold + fecha 12/16 (+ "Vendido"). */
function ListingSummary({ listing: l }: { listing: MyListing }) {
  const Icon = l.title.toLowerCase().includes("carrito") ? ShoppingCart : listingIcon[l.category];
  const isSold = Boolean(l.soldAt);
  const soldToday = l.soldAt && new Date(l.soldAt).toDateString() === new Date().toDateString();
  const soldLabel = l.soldAt
    ? soldToday
      ? "Vendida hoy"
      : `Vendido el ${new Date(l.soldAt).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`
    : `Publicada ${formatTimeAgo(new Date(l.publishedAt)).toLowerCase()}`;

  return (
    <div className="flex items-center gap-3.5">
      <span aria-hidden className={cn("grid size-[72px] shrink-0 place-items-center rounded-field", isSold ? "bg-note text-text-tertiary" : "bg-brand-soft text-brand")}>
        <Icon className="size-6" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <h3 className="text-body font-semibold text-text">{l.title}</h3>
        <p className="text-[17px] leading-6 font-bold text-text">{formatPrice(l.price)}</p>
        <p className="text-overline text-text-tertiary">{soldLabel}</p>
        {isSold && <span className="mt-1 rounded-[8px] bg-success-soft px-2 py-0.5 text-overline font-semibold text-success">Vendido</span>}
      </div>
    </div>
  );
}
