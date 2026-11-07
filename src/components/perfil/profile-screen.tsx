"use client";

import * as React from "react";
import Image from "next/image";
import { Bell, Book, Calendar, Eye, LogOut, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { RuleCard } from "@/components/app/cards";
import { Screen } from "@/components/app/screen";
import { communityRules } from "@/lib/community";
import { currentResident } from "@/lib/mock-data";
import { useDirectoryState } from "@/lib/directory/store";
import { activitySummary, useMyActivity } from "@/lib/profile/activity";
import { useProfileState } from "@/lib/profile/store";
import { ListGroup, NavRow, SectionLabel } from "./ui";

/** Lo que ven los vecinos según P3: "Sandra, Torre E" (+ ", apto 204"). */
export function useVisibleName() {
  const { privacy } = useProfileState();
  const r = currentResident;
  return `${r.firstName}, Torre ${r.tower}${privacy.showApartment ? `, apto ${r.apartment}` : ""}`;
}

/** P1 · Perfil (484:5360) */
export function ProfileScreen() {
  const r = currentResident;
  const visibleName = useVisibleName();
  const { upcoming } = useMyActivity();
  const { listings } = useDirectoryState();
  const onSale = listings.filter((l) => !l.soldAt).length;
  const [rulesOpen, setRulesOpen] = React.useState(false);

  return (
    <Screen className="pb-[calc(max(22px,env(safe-area-inset-bottom))+104px)]">
      <div className="flex flex-col items-start gap-4 px-5 pt-[max(72px,calc(env(safe-area-inset-top)+24px))]">
        <h1 className="text-headline font-bold text-text">Perfil</h1>

        {/* Tarjeta de perfil */}
        <section
          aria-label="Tu perfil"
          className="flex w-full items-center gap-3.5 rounded-[18px] border border-option-border bg-surface p-4"
        >
          <Image src={r.avatar} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <p className="text-subtitle font-bold text-text">{r.fullName}</p>
            <p className="text-label text-text-tertiary">
              Torre {r.tower}, apto {r.apartment}
            </p>
            <p className="inline-flex items-center gap-1.5 rounded-[12px] bg-option-blue py-1 pr-2.5 pl-2 text-overline font-semibold text-brand">
              <Eye className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Tus vecinos ven: {visibleName}
            </p>
          </div>
        </section>

        <SectionLabel id="mi-actividad">Mi actividad</SectionLabel>
        <ListGroup label="Mi actividad">
          <NavRow
            href="/perfil/inscripciones"
            icon={Calendar}
            title="Mis reservas y actividades"
            subtitle={activitySummary(upcoming)}
          />
          <NavRow
            href="/directorio/mis-publicaciones"
            icon={Tag}
            title="Mis publicaciones"
            subtitle={
              onSale ? `${onSale} ${onSale === 1 ? "producto" : "productos"} a la venta` : "Nada a la venta por ahora"
            }
          />
        </ListGroup>

        <SectionLabel id="configuracion">Configuración</SectionLabel>
        <ListGroup label="Configuración">
          <NavRow
            href="/perfil/privacidad"
            icon={Eye}
            tone="neutral"
            title="Privacidad"
            subtitle="Qué ven tus vecinos de ti"
          />
          <NavRow
            href="/perfil/notificaciones"
            icon={Bell}
            tone="neutral"
            title="Notificaciones"
            subtitle="Elige qué te avisamos"
          />
          <NavRow
            onClick={() => setRulesOpen(true)}
            icon={Book}
            tone="neutral"
            title="Normas de la comunidad"
            subtitle="Las que aceptaste al registrarte"
          />
        </ListGroup>

        <ListGroup label="Sesión">
          {/* TODO: POST /api/auth/logout antes de volver a la bienvenida. */}
          <NavRow href="/" icon={LogOut} tone="neutral" title="Cerrar sesión" />
        </ListGroup>
      </div>

      <BottomSheet open={rulesOpen} onOpenChange={setRulesOpen}>
        <BottomSheetContent className="gap-3.5 pt-6 pb-[max(36px,env(safe-area-inset-bottom))]">
          <BottomSheetTitle className="text-title font-bold">Normas de la comunidad</BottomSheetTitle>
          <BottomSheetDescription>
            Las aceptaste al registrarte y aplican a todo lo que haces en la app.
          </BottomSheetDescription>
          <ul className="flex w-full flex-col gap-3">
            {communityRules.map((rule) => (
              <RuleCard key={rule.title} {...rule} />
            ))}
          </ul>
          <BottomSheetClose asChild>
            <Button>Entendido</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>
    </Screen>
  );
}
