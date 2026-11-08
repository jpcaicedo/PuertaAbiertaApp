"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { FieldIcon } from "@/components/agenda/fields";
import { ChoiceChips } from "@/components/directorio/ui";
import { pqrsKinds, type PqrsKind } from "@/lib/pqrs/data";
import { createPqrs } from "@/lib/pqrs/actions";
import { uploadPqrsPhoto } from "@/lib/pqrs/photo";
import { pqrsDemoActions } from "@/lib/pqrs/store";
import { shrink } from "@/lib/profile/avatar";

type Errors = Partial<Record<"kind" | "title" | "description" | "photo" | "form", string>>;

const placeholders: Record<PqrsKind, { title: string; description: string }> = {
  dano: { title: "Se dañó la luz del parqueadero", description: "La lámpara del fondo no prende desde anoche y queda muy oscuro." },
  peticion: { title: "Poner una banca en el parque infantil", description: "Cuéntale a la administración qué pides y por qué." },
  queja: { title: "Ruido en las noches", description: "Cuenta qué pasa, desde cuándo y a qué horas." },
  reclamo: { title: "Cobro de administración repetido", description: "Cuenta qué pasó y qué esperas que se corrija." },
  sugerencia: { title: "Horario más largo del gimnasio", description: "Cuéntanos tu idea para mejorar el conjunto." },
};

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/** Nuevo reporte: tipo, qué pasó, dónde, detalles y una foto opcional. */
export function NewPqrs({ remote }: { remote: boolean }) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [kind, setKind] = React.useState<PqrsKind | "">("dano");
  const [title, setTitle] = React.useState("");
  const [place, setPlace] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [photo, setPhoto] = React.useState<{ file: File; url: string }>();
  const [errors, setErrors] = React.useState<Errors>({});
  const [sending, startSend] = React.useTransition();
  const hint = placeholders[kind || "dano"];

  React.useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((x) => ({ ...x, photo: "Elige una foto." }));
    setErrors((x) => ({ ...x, photo: undefined }));
    setPhoto({ file, url: URL.createObjectURL(file) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!kind) found.kind = "Elige el tipo de reporte.";
    if (title.trim().length < 4) found.title = "Cuenta en pocas palabras qué pasó.";
    setErrors(found);
    if (Object.keys(found).length || !kind) return;

    startSend(async () => {
      const input = { kind, title: title.trim(), place: place.trim(), description: description.trim() };
      if (!remote) {
        const preview = photo ? await toDataUrl(await shrink(photo.file, 800)).catch(() => undefined) : undefined;
        const id = pqrsDemoActions.create({ ...input, photoPreview: preview });
        return router.replace(`/pqrs/${id}?nuevo=1`);
      }
      let path: string | undefined;
      if (photo) {
        path = (await uploadPqrsPhoto(photo.file)) ?? undefined;
        if (!path) return setErrors({ photo: "No pudimos subir la foto. Inténtalo de nuevo o envía el reporte sin foto." });
      }
      const r = await createPqrs({ ...input, photo: path });
      if (!r.ok) return setErrors({ form: r.error });
      router.replace(`/pqrs/${r.id}?nuevo=1`);
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/pqrs" />
      <form id="nuevo-pqrs" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Nuevo reporte</ScreenTitle>
          <ScreenDescription size="sm">Le llega a la administración y te avisamos cada vez que cambie el estado.</ScreenDescription>

          <FormField id="tipo" label="Tipo" error={errors.kind}>
            {({ id }) => (
              <ChoiceChips<PqrsKind>
                id={id}
                label="Tipo"
                options={pqrsKinds}
                value={kind}
                onChange={(v) => {
                  setKind(v);
                  setErrors((x) => ({ ...x, kind: undefined }));
                }}
              />
            )}
          </FormField>

          <FormField id="que-paso" label={kind === "dano" ? "¿Qué se dañó?" : "Asunto"} error={errors.title}>
            {(aria) => (
              <Input
                {...aria}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((x) => ({ ...x, title: undefined }));
                }}
                placeholder={hint.title}
                maxLength={80}
              />
            )}
          </FormField>

          <FormField id="lugar" label="Lugar (opcional)">
            {(aria) => (
              <Input
                {...aria}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Sótano 2, cerca de la rampa"
                maxLength={80}
                startAdornment={<FieldIcon icon={MapPin} />}
              />
            )}
          </FormField>

          <FormField id="detalles" label="Detalles (opcional)">
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[96px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={hint.description}
                maxLength={1000}
              />
            )}
          </FormField>

          <div className="flex w-full flex-col gap-2">
            <p className="text-label font-semibold text-text">Foto (opcional)</p>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={pick} aria-label="Elegir foto" />
            {photo ? (
              <div className="relative w-full overflow-hidden rounded-[18px] border border-option-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Foto del reporte" className="max-h-[260px] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  aria-label="Quitar foto"
                  className="absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="size-5" strokeWidth={2} aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-[18px] border border-dashed border-border bg-surface px-4 py-6 text-center transition-colors hover:border-brand/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-option-blue text-brand">
                  <Camera className="size-5" strokeWidth={2} />
                </span>
                <span className="text-callout font-semibold text-brand">Tomar o elegir foto</span>
                <span className="text-caption text-text-tertiary">Ayuda a que lo arreglen más rápido</span>
              </button>
            )}
            {errors.photo && (
              <p role="alert" className="text-caption text-error">
                {errors.photo}
              </p>
            )}
          </div>
        </ScreenBody>

        <ActionBar>
          {errors.form && (
            <p role="alert" className="text-caption text-error">
              {errors.form}
            </p>
          )}
          <Button type="submit" form="nuevo-pqrs" className="rounded-[80px]" disabled={sending}>
            {sending ? "Enviando…" : "Enviar a la administración"}
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
