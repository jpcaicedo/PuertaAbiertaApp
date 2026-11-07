"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Info, Link as LinkIcon, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar, Note } from "@/components/agenda/primitives";
import { FieldIcon, TimeRangeField } from "@/components/agenda/fields";

type Errors = Partial<Record<"what" | "where" | "when" | "link", string>>;

/** A11 · Compartir un evento del barrio (484:4824) → A12. */
export default function CompartirEventoPage() {
  const router = useRouter();
  const [what, setWhat] = React.useState("");
  const [where, setWhere] = React.useState("");
  const [time, setTime] = React.useState({ start: "", end: "" });
  const [cost, setCost] = React.useState("");
  const [why, setWhy] = React.useState("");
  const [link, setLink] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (what.trim().length < 3) found.what = "Cuéntales qué es.";
    if (!where.trim()) found.where = "Indica dónde es.";
    if (!time.start || !time.end) found.when = "Elige la hora de inicio y de fin.";
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) found.link = "El enlace debe empezar por https://";
    setErrors(found);
    if (Object.keys(found).length) return;
    // TODO: POST /api/eventos-barrio
    router.push("/agenda/compartir/listo");
  }

  return (
    <Screen>
      <ScreenHeader backHref="/agenda" />
      <form id="compartir" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Invita a algo que pasa cerca</ScreenTitle>
          <ScreenDescription size="sm">Cuéntales a tus vecinos de algo que pasa cerca.</ScreenDescription>

          <FormField id="que" label="Qué es" error={errors.what}>
            {(aria) => <Input {...aria} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Tarde de cuentos y pintura para niños" maxLength={70} />}
          </FormField>
          <FormField id="donde" label="Dónde" error={errors.where}>
            {(aria) => (
              <Input {...aria} value={where} onChange={(e) => setWhere(e.target.value)} placeholder="C. C. Mirador del Sur, piso 2" startAdornment={<FieldIcon icon={MapPin} />} />
            )}
          </FormField>
          <FormField id="cuando" label="Cuándo" error={errors.when}>
            {({ id, invalid }) => (
              <TimeRangeField id={id} icon={Calendar} prefix="Hoy," start={time.start} end={time.end} onChange={setTime} invalid={invalid} />
            )}
          </FormField>
          <FormField id="costo" label="Costo">
            {(aria) => <Input {...aria} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Gratis" startAdornment={<FieldIcon icon={Tag} />} />}
          </FormField>
          <FormField id="por-que" label="¿Por qué vale la pena?">
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[84px]"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Lo hacen cada mes y a mis hijos les encanta. Los cupos son pocos, toca llegar temprano."
                maxLength={200}
              />
            )}
          </FormField>
          <FormField id="enlace" label="Enlace (opcional)" error={errors.link}>
            {(aria) => (
              <Input
                {...aria}
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Página o Instagram del evento"
                startAdornment={<FieldIcon icon={LinkIcon} />}
              />
            )}
          </FormField>
          <Note icon={Info}>Solo eventos abiertos al público. Si es de tu negocio, publícalo en el Directorio.</Note>
        </ScreenBody>

        <ActionBar>
          <Button type="submit" form="compartir" className="rounded-[80px]">
            Compartir con mis vecinos
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
