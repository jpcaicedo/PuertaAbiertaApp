"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Info, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar, Note } from "@/components/agenda/primitives";
import { DateField, FieldIcon, SelectField, TimeRangeField } from "@/components/agenda/fields";
import { commonAreas } from "@/lib/agenda/data";
import { proposeActivity } from "@/lib/agenda/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Errors = Partial<Record<"name" | "date" | "time" | "capacity" | "place", string>>;

/** A6 · Crear actividad (484:3111) → A7 (con zona común) o A8 (sin zona común). */
export default function CrearActividadPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState({ start: "", end: "" });
  const [capacity, setCapacity] = React.useState("");
  const [usesArea, setUsesArea] = React.useState(true);
  const [area, setArea] = React.useState(commonAreas[0]);
  const [freePlace, setFreePlace] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [sendError, setSendError] = React.useState<string>();
  const [sending, startSend] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (name.trim().length < 3) found.name = "Ponle un nombre a tu actividad.";
    if (!date) found.date = "Elige la fecha.";
    if (!time.start || !time.end) found.time = "Elige la hora de inicio y de fin.";
    else if (time.end <= time.start) found.time = "La hora de fin debe ser después del inicio.";
    if (!(Number(capacity) > 0)) found.capacity = "Indica cuántas personas pueden ir.";
    if (!usesArea && !freePlace.trim()) found.place = "Indica dónde se encuentran.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const place = usesArea ? area : freePlace.trim();
    const q = new URLSearchParams({
      nombre: name.trim(),
      fecha: date,
      inicio: time.start,
      fin: time.end,
      lugar: place,
      cupos: capacity,
    });
    const next = `/agenda/crear/${usesArea ? "enviada" : "publicada"}?${q}`;
    if (!isSupabaseConfigured) return router.push(next);

    setSendError(undefined);
    startSend(async () => {
      const result = await proposeActivity({
        name: name.trim(),
        description: description.trim(),
        date,
        start: time.start,
        end: time.end,
        place,
        capacity: Number(capacity),
        usesArea,
      });
      if (!result.ok) return setSendError(result.error);
      router.push(next);
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/agenda" />
      <form id="crear" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Crear actividad</ScreenTitle>
          <ScreenDescription size="sm">Tus vecinos la verán en la Agenda apenas se publique.</ScreenDescription>

          <FormField id="nombre" label="Nombre" error={errors.name}>
            {(aria) => <Input {...aria} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarde de juegos de mesa" maxLength={60} />}
          </FormField>

          <FormField id="descripcion" label="Descripción">
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[84px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Trae tu juego favorito. Habrá café y galletas. Para grandes y niños."
                maxLength={280}
              />
            )}
          </FormField>

          <FormField id="fecha" label="Fecha" error={errors.date}>
            {({ invalid, ...aria }) => <DateField {...aria} value={date} onChange={setDate} invalid={invalid} />}
          </FormField>

          <FormField id="hora" label="Hora" error={errors.time}>
            {({ id, invalid }) => <TimeRangeField id={id} icon={Clock} start={time.start} end={time.end} onChange={setTime} invalid={invalid} />}
          </FormField>

          <FormField id="cupos" label="Cupos" error={errors.capacity}>
            {(aria) => (
              <Input
                {...aria}
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="15"
                startAdornment={<FieldIcon icon={Users} />}
                endAdornment={<span className="flex-1 text-body text-text">personas</span>}
                className="field-sizing-content min-w-[2ch] flex-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
          </FormField>

          {/* Zona común: blanca, radio 18, padding 16, gap 12 */}
          <section className="flex w-full flex-col gap-3 rounded-[18px] bg-surface p-4">
            <div className="flex w-full items-center justify-between gap-4">
              <label htmlFor="usa-zona" className="flex cursor-pointer flex-col gap-0.5">
                <span className="text-body font-semibold text-text">¿Usa una zona común?</span>
                <span className="text-caption text-text-secondary">Salón social, terraza, piscina, BBQ</span>
              </label>
              <Switch id="usa-zona" checked={usesArea} onCheckedChange={setUsesArea} />
            </div>

            {usesArea ? (
              <>
                <FormField id="lugar" label="Lugar">
                  {({ id }) => <SelectField id={id} icon={MapPin} value={area} onChange={setArea} options={commonAreas} />}
                </FormField>
                <Note icon={Info}>La administración debe aprobar el uso de la zona. Suele responder en menos de 24 horas.</Note>
              </>
            ) : (
              <FormField id="lugar-libre" label="Lugar" error={errors.place}>
                {(aria) => (
                  <Input
                    {...aria}
                    value={freePlace}
                    onChange={(e) => setFreePlace(e.target.value)}
                    placeholder="Portería principal"
                    startAdornment={<FieldIcon icon={MapPin} />}
                  />
                )}
              </FormField>
            )}
          </section>
        </ScreenBody>

        <ActionBar className="flex-col">
          {sendError && (
            <p role="alert" className="w-full text-caption text-error">
              {sendError}
            </p>
          )}
          <Button type="submit" form="crear" className="rounded-[80px]" disabled={sending}>
            {sending ? "Enviando…" : usesArea ? "Enviar solicitud a la administración" : "Publicar actividad"}
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
