"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { currentResident } from "@/lib/mock-data";
import { notifyOptions, privacyOptions } from "@/lib/profile/data";
import { profileActions, useProfileState } from "@/lib/profile/store";
import { useVisibleName } from "./profile-screen";
import { ListGroup, PageHeading, SettingRow } from "./ui";

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      size="lg"
      checked={checked}
      onCheckedChange={onChange}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-desc`}
    />
  );
}

/** P3 · Qué ven tus vecinos (484:5500) */
export function PrivacyScreen() {
  const { privacy } = useProfileState();
  const visibleName = useVisibleName();

  return (
    <Screen>
      <ScreenHeader backHref="/perfil" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <PageHeading
          title="Qué ven tus vecinos"
          description="Por defecto solo ven tu nombre y tu torre. Tú decides si muestras algo más."
        />

        {/* Vista previa: radio 16, padding 14/16, avatar 44 */}
        <div aria-live="polite" className="flex w-full items-center gap-3 rounded-card bg-option-blue px-4 py-3.5">
          <Image
            src={currentResident.avatar}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <span className="flex min-w-0 flex-col">
            <span className="text-caption font-medium text-brand">Así te ven ahora</span>
            <span className="text-callout font-bold text-text">{visibleName}</span>
          </span>
        </div>

        <ListGroup label="Datos visibles">
          {privacyOptions.map((o) => (
            <SettingRow
              key={o.key}
              id={o.key}
              title={o.title}
              description={o.description}
              control={
                <Toggle id={o.key} checked={privacy[o.key]} onChange={(v) => profileActions.setPrivacy(o.key, v)} />
              }
            />
          ))}
        </ListGroup>

        <p className="flex w-full items-start gap-2 px-1 text-caption text-text-tertiary">
          <Lock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Nunca compartimos tus datos con comercios ni con terceros. Así lo exige la Ley 1581 de 2012.</span>
        </p>
      </div>
    </Screen>
  );
}

/** P4 · Notificaciones (484:5547) */
export function NotificationSettingsScreen() {
  const { notify } = useProfileState();

  return (
    <Screen>
      <ScreenHeader backHref="/perfil" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <PageHeading
          title="Notificaciones"
          description="Elige qué te avisamos. Los avisos de la administración siempre llegan."
        />
        <ListGroup label="Notificaciones">
          <SettingRow
            id="avisos"
            title="Avisos de la administración"
            description="Mantenimientos, cortes de agua y asambleas."
            control={
              <span className="inline-flex shrink-0 items-center gap-1 rounded-[10px] bg-surface-muted px-2 py-[3px] text-overline font-semibold text-text-tertiary">
                <Lock className="size-3" strokeWidth={2} aria-hidden />
                Siempre
              </span>
            }
          />
          {notifyOptions.map((o) => (
            <SettingRow
              key={o.key}
              id={o.key}
              title={o.title}
              description={o.description}
              control={
                <Toggle id={o.key} checked={notify[o.key]} onChange={(v) => profileActions.setNotify(o.key, v)} />
              }
            />
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}
