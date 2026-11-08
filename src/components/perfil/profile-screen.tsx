"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Book, Building2, Calendar, Camera, Eye, LogOut, MessageCircle, Tag, Wrench } from "lucide-react";
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
import { signOut } from "@/lib/auth/actions";
import { useCurrentUser, UserAvatar } from "@/components/app/current-user";
import { useDirectoryState } from "@/lib/directory/store";
import { activitySummary, useMyActivity } from "@/lib/profile/activity";
import { useProfileState } from "@/lib/profile/store";
import { uploadAvatar } from "@/lib/profile/avatar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ThemeRow } from "./theme-row";
import { NotificationsRow } from "./notifications-row";
import { ListGroup, NavRow, SectionLabel } from "./ui";

/** Lo que ven los vecinos según P3: "Sandra, Torre E" (+ ", apto 204"). */
export function useVisibleName() {
  const { privacy } = useProfileState();
  const r = useCurrentUser();
  return `${r.firstName}, Torre ${r.tower}${privacy.showApartment ? `, apto ${r.apartment}` : ""}`;
}

/** P1 · Perfil (484:5360) */
export function ProfileScreen({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const r = useCurrentUser();
  const [signingOut, startSignOut] = React.useTransition();
  const visibleName = useVisibleName();
  const { upcoming } = useMyActivity();
  const { listings } = useDirectoryState();
  const onSale = listings.filter((l) => !l.soldAt && !l.removed).length;
  const [rulesOpen, setRulesOpen] = React.useState(false);

  return (
    <Screen className="pb-tabbar">
      <div className="flex flex-col items-start gap-4 px-5 pt-[max(72px,calc(env(safe-area-inset-top)+24px))]">
        <h1 className="text-headline font-bold text-text">Perfil</h1>

        {/* Tarjeta de perfil */}
        <section
          aria-label="Tu perfil"
          className="flex w-full items-center gap-3.5 rounded-[18px] border border-option-border bg-surface p-4"
        >
          {isSupabaseConfigured ? <AvatarButton /> : <UserAvatar user={r} size={64} />}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <p className="text-subtitle font-bold text-text">{r.fullName}</p>
            <p className="text-label text-text-tertiary">
              {r.role === "administracion" ? "Administración" : `Torre ${r.tower}, apto ${r.apartment}`}
            </p>
            <p className="inline-flex items-center gap-1.5 rounded-[12px] bg-option-blue py-1 pr-2.5 pl-2 text-overline font-semibold text-brand">
              <Eye className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Tus vecinos ven: {visibleName}
            </p>
          </div>
        </section>

        {r.role === "administracion" && (
          <ListGroup label="Administración">
            <NavRow
              href="/admin"
              icon={Building2}
              title="Panel de administración"
              subtitle="Solicitudes, avisos y reportes"
            />
          </ListGroup>
        )}

        <SectionLabel id="mi-actividad">Mi actividad</SectionLabel>
        <ListGroup label="Mi actividad">
          <NavRow
            href="/perfil/inscripciones"
            icon={Calendar}
            title="Mis reservas y actividades"
            subtitle={activitySummary(upcoming)}
          />
          {isSupabaseConfigured && (
            <NavRow
              href="/mensajes"
              icon={MessageCircle}
              title="Mensajes"
              subtitle={
                unreadMessages
                  ? `${unreadMessages} sin leer`
                  : "Tus conversaciones con vecinos"
              }
            />
          )}
          <NavRow
            href="/pqrs"
            icon={Wrench}
            title="Reportes y PQRS"
            subtitle="Daños, peticiones y quejas a la administración"
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
          <NotificationsRow />
          <ThemeRow />
          <NavRow
            onClick={() => setRulesOpen(true)}
            icon={Book}
            tone="neutral"
            title="Normas de la comunidad"
            subtitle="Las que aceptaste al registrarte"
          />
        </ListGroup>

        <ListGroup label="Sesión">
          <NavRow
            onClick={() => startSignOut(() => signOut())}
            icon={LogOut}
            tone="neutral"
            title={signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          />
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

/** Foto de perfil con botón de cámara: la sube a Supabase y actualiza la pantalla. */
function AvatarButton() {
  const r = useCurrentUser();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = React.useTransition();
  const [error, setError] = React.useState<string>();

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    startUpload(async () => {
      const result = await uploadAvatar(file);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={r.avatar ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
        className="relative block cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <UserAvatar user={r} size={64} className={uploading ? "opacity-50" : undefined} />
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-brand text-white"
        >
          <Camera className="size-3" strokeWidth={2.5} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={pick} />
      {(error || uploading) && (
        <p role={error ? "alert" : "status"} className="absolute top-full left-0 mt-1 w-40 text-overline text-text-tertiary">
          {error ?? "Subiendo foto…"}
        </p>
      )}
    </div>
  );
}
