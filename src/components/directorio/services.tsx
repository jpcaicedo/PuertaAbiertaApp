"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Phone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/app/home-header";
import { Screen } from "@/components/app/screen";
import { reviewsLabel, searchServices, services, type NeighborService, type ServiceCategory } from "@/lib/directory/data";
import { useCurrentUser } from "@/components/app/current-user";
import { Avatar, DirectoryTabs, FilterChips, Rating, SearchBar, SearchLink, VerifiedMark } from "./ui";

/* ───────────────────────── Cabecera común D1 / D8 ───────────────────────── */

export function DirectoryHeader({
  active,
  action,
  children,
}: {
  active: "servicios" | "marketplace";
  action: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <Screen className="pb-tabbar">
      <div className="pt-[max(40px,env(safe-area-inset-top))]">
        <HomeHeader />
      </div>
      <div className="flex flex-col items-start gap-3.5 px-5 pt-3">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-title font-bold text-text">Directorio</h1>
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 rounded-[20px] bg-brand py-2 pr-3.5 pl-3 text-caption font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
            {action.label}
          </Link>
        </div>
        <DirectoryTabs active={active} />
        {children}
      </div>
    </Screen>
  );
}

/* ───────────────────────── D1 · Vecinos y servicios ───────────────────────── */

const serviceFilters: { id: "todos" | ServiceCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "mascotas", label: "Mascotas" },
  { id: "clases", label: "Clases" },
  { id: "hogar", label: "Hogar" },
];

export function ServicesScreen({ services: all = services }: { services?: NeighborService[] }) {
  const [filter, setFilter] = React.useState<"todos" | ServiceCategory>("todos");
  const list = all.filter((s) => filter === "todos" || s.category === filter);

  return (
    <DirectoryHeader active="servicios" action={{ label: "Ofrecer servicio", href: "/directorio/ofrecer" }}>
      <SearchLink href="/directorio/buscar" label="Buscar vecinos o servicios" />
      <FilterChips label="Tipo de servicio" options={serviceFilters} value={filter} onChange={setFilter} />
      {list.length ? (
        <ul className="flex w-full flex-col gap-3.5">
          {list.map((s) => (
            <li key={s.id}>
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="w-full py-10 text-center text-body text-text-secondary">
          Todavía ningún vecino ofrece servicios de esta categoría.
        </p>
      )}
    </DirectoryHeader>
  );
}

/** Tarjeta de servicio (Figma "Vecino · Camila"): blanca, radio 20, padding 16, gap 10. */
function ServiceCard({ service: s }: { service: NeighborService }) {
  const me = useCurrentUser();
  // No tiene sentido escribirse a uno mismo: en su propio servicio, el vecino ve sus mensajes.
  const isMine = !!s.ownerId && s.ownerId === me.id;
  return (
    <article className="relative flex w-full flex-col items-start gap-2.5 rounded-[20px] bg-surface p-4 has-[a.stretched:focus-visible]:ring-2 has-[a.stretched:focus-visible]:ring-brand">
      <div className="flex items-center gap-3">
        <Avatar name={s.neighbor.name} src={s.neighbor.avatar} size={48} />
        <div className="flex flex-col gap-0.5">
          <p className="flex items-center gap-1.5 text-body font-semibold text-text">
            {s.neighbor.name}
            {s.neighbor.verified && <VerifiedMark />}
          </p>
          <p className="text-caption text-text-secondary">
            {s.neighbor.apartment ? `Apto ${s.neighbor.apartment} · ` : ""}Torre {s.neighbor.tower}
          </p>
        </div>
      </div>
      <h2 className="text-heading font-semibold text-text">
        <Link href={`/directorio/${s.id}`} className="stretched outline-none after:absolute after:inset-0">
          {s.title}
        </Link>
      </h2>
      {s.rating && <Rating rating={s.rating} label={reviewsLabel(s.reviewCount, true)} />}
      <p className="text-caption text-text-secondary">{s.description}</p>
      <div className="relative z-10 flex w-full items-center gap-2">
        {isMine ? (
          <Button asChild variant="secondary" className="h-[46px] flex-1">
            <Link href={`/directorio/${s.id}`}>Tu servicio · Ver o eliminar</Link>
          </Button>
        ) : (
          <Button asChild className="h-[46px] flex-1">
            <Link href={`/directorio/${s.id}/mensaje`}>Enviar mensaje</Link>
          </Button>
        )}
        {!isMine && s.callHours && s.phone && (
          <a
            href={`tel:${s.phone}`}
            aria-label={`Llamar a ${s.neighbor.firstName}`}
            className="grid size-[46px] shrink-0 place-items-center rounded-full bg-success-soft text-success transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Phone className="size-5" strokeWidth={2} aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}

/* ───────────────────────── D2 · Buscar vecinos / D2b · Sin resultados ───────────────────────── */

export function ServiceSearchScreen({
  initialQuery,
  services: all = services,
}: {
  initialQuery: string;
  services?: NeighborService[];
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const term = query.trim();
  const results = searchServices(query, all);

  return (
    <Screen className="pb-tabbar">
      <SearchBar backHref="/directorio" value={query} onChange={setQuery} placeholder="Buscar vecinos o servicios" />
      <div className="flex flex-col items-start gap-3 px-5 pt-4">
        {results.length > 0 ? (
          <>
            <p aria-live="polite" className="text-caption font-semibold text-text-secondary">
              {term
                ? `${results.length} ${results.length === 1 ? "vecino ofrece" : "vecinos ofrecen"} este servicio`
                : `${results.length} vecinos ofrecen servicios`}
            </p>
            <ul className="flex w-full flex-col gap-3">
              {results.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/directorio/${s.id}`}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-3.5 transition-shadow hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <Avatar name={s.neighbor.name} src={s.neighbor.avatar} size={48} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-body font-semibold text-text">{s.title}</span>
                      <span className="text-caption text-text-secondary">
                        {s.neighbor.name} · Torre {s.neighbor.tower}
                      </span>
                      {s.rating && <Rating rating={s.rating} label={reviewsLabel(s.reviewCount)} />}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div aria-live="polite" className="flex w-full flex-col items-center gap-2.5 px-2.5 pt-[60px] pb-5 text-center">
            <span aria-hidden className="inline-flex rounded-[40px] bg-brand-soft p-[18px] text-brand">
              <Users className="size-[30px]" strokeWidth={2} />
            </span>
            <p className="max-w-[320px] text-heading font-semibold text-text">Ningún vecino ofrece &quot;{term}&quot; todavía</p>
            <p className="max-w-[320px] text-body text-text-secondary">
              Prueba con otra palabra o revisa los proveedores recomendados en el Mapa. Si tú ofreces algo, publícalo para tus vecinos.
            </p>
            <Button className="h-[52px]" onClick={() => setQuery("")}>
              Ver todo el directorio
            </Button>
            <Button asChild variant="link">
              <Link href="/directorio/ofrecer">Ofrecer un servicio</Link>
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}
