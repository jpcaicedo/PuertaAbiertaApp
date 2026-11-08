"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { ListGroup, PageHeading, SettingRow } from "@/components/perfil/ui";
import { audiences, type AudienceId } from "@/lib/admin/data";
import { adminActions } from "@/lib/admin/store";
import { publishNotice } from "@/lib/notices/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { AdminActionBar } from "./ui";

/** Caja de X5: borde #E3E7EE, radio 14, padding 12/14 y texto 16/24. */
const box = "rounded-chip border-option-border px-3.5";
const boxText = "text-callout";

type Errors = Partial<Record<"title" | "message" | "when", string>>;

/** X5 · Publicar aviso (484:5870) → X6 */
export function PublishNotice() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [audience, setAudience] = React.useState<AudienceId>("todos");
  const [shareable, setShareable] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  const [errors, setErrors] = React.useState<Errors>({});
  const [sendError, setSendError] = React.useState<string>();
  const [publishing, startPublish] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (title.trim().length < 4) found.title = "Ponle un título corto y claro.";
    if (message.trim().length < 10) found.message = "Cuéntales a los residentes qué va a pasar.";
    if (!when.trim()) found.when = "Indica la fecha y la hora.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const done = () => router.push(`/admin/avisos/publicado?para=${audience}`);
    if (!isSupabaseConfigured) {
      // Modo demo: queda en el navegador.
      adminActions.publish({ id: `aviso-${Date.now()}`, title: title.trim(), when: when.trim(), shareable });
      return done();
    }
    setSendError(undefined);
    startPublish(async () => {
      const result = await publishNotice({ title, message, when, audience, shareable, notify });
      if (!result.ok) return setSendError(result.error);
      done();
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/admin" />
      <form id="aviso" onSubmit={submit} noValidate className="flex flex-col items-start gap-4 px-5 pt-3">
        <PageHeading
          title="Publicar aviso"
          description="Lo verán los residentes en Inicio, firmado por la administración."
        />

        <FormField id="titulo" label="Título" error={errors.title} className="gap-2 [&>label]:text-label">
          {(aria) => (
            <Input
              {...aria}
              boxClassName={cn(box, "h-[50px]")}
              className={boxText}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Corte de agua, Torre C"
              maxLength={60}
            />
          )}
        </FormField>

        <FormField id="mensaje" label="Mensaje" error={errors.message} className="gap-2 [&>label]:text-label">
          {(aria) => (
            <Textarea
              {...aria}
              boxClassName={cn(box, "min-h-[114px] pt-3 pb-7")}
              className={boxText}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Emcali hará trabajos en la red. No habrá agua de 9:00 a. m. a 1:00 p. m."
              maxLength={400}
            />
          )}
        </FormField>

        <FormField id="cuando" label="Fecha y hora" error={errors.when} className="gap-2 [&>label]:text-label">
          {(aria) => (
            <Input
              {...aria}
              boxClassName={cn(box, "h-[50px]")}
              className={boxText}
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="Martes 17, de 9:00 a. m. a 1:00 p. m."
              maxLength={80}
            />
          )}
        </FormField>

        <div className="flex w-full flex-col gap-2">
          <p id="para-quien" className="text-label font-semibold text-text">
            Para quién
          </p>
          <div
            role="radiogroup"
            aria-labelledby="para-quien"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]"
          >
            {audiences.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={audience === a.id}
                onClick={() => setAudience(a.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-[18px] border px-3 py-[7px] text-label whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  audience === a.id
                    ? "border-brand bg-option-blue font-semibold text-brand"
                    : "border-option-border bg-surface font-medium text-text hover:border-brand/40",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <ListGroup label="Opciones del aviso">
          <SettingRow
            id="compartible"
            title="Se puede compartir por WhatsApp"
            description="Apágalo si el aviso tiene información sensible del conjunto."
            control={
              <Switch
                size="lg"
                checked={shareable}
                onCheckedChange={setShareable}
                aria-labelledby="compartible-label"
                aria-describedby="compartible-desc"
              />
            }
          />
          <SettingRow
            id="notificar"
            title="Enviar notificación"
            description="Llega aunque el residente no abra la app."
            control={
              <Switch
                size="lg"
                checked={notify}
                onCheckedChange={setNotify}
                aria-labelledby="notificar-label"
                aria-describedby="notificar-desc"
              />
            }
          />
        </ListGroup>
      </form>

      <AdminActionBar>
        {sendError && (
          <p role="alert" className="text-caption text-error">
            {sendError}
          </p>
        )}
        <Button type="submit" form="aviso" disabled={publishing}>
          {publishing ? "Publicando…" : "Publicar aviso"}
        </Button>
      </AdminActionBar>
    </Screen>
  );
}
