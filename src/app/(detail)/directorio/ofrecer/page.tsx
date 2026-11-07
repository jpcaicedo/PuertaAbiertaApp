"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { FieldIcon } from "@/components/agenda/fields";
import { ChoiceChips } from "@/components/directorio/ui";
import { useCurrentUser } from "@/components/app/current-user";
import { serviceCategories, type ServiceCategory } from "@/lib/directory/data";
import { directoryActions, useDirectoryState, type ServiceDraft } from "@/lib/directory/store";

type Errors = Partial<Record<"category" | "title" | "description" | "price" | "availability", string>>;

const empty: ServiceDraft = {
  category: "",
  title: "",
  description: "",
  price: "",
  availability: "",
  showApartment: true,
  acceptCalls: false,
};

/** D5 · Publicar servicio (484:3846) → D6 vista previa. */
export default function OfrecerServicioPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const { serviceDraft } = useDirectoryState();
  const [form, setForm] = React.useState<ServiceDraft>(empty);
  const [errors, setErrors] = React.useState<Errors>({});

  // Al volver desde "Editar" se recupera el borrador.
  React.useEffect(() => {
    if (serviceDraft) setForm(serviceDraft);
  }, [serviceDraft]);

  const set = <K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!form.category) found.category = "Elige una categoría.";
    if (form.title.trim().length < 4) found.title = "Cuéntales qué ofreces.";
    if (form.description.trim().length < 20) found.description = "Escribe al menos dos líneas para que tus vecinos sepan qué incluye.";
    if (!form.price.trim()) found.price = "Indica el precio o escribe «A convenir».";
    if (!form.availability.trim()) found.availability = "Indica cuándo estás disponible.";
    setErrors(found);
    if (Object.keys(found).length) return;
    directoryActions.saveServiceDraft(form);
    router.push("/directorio/ofrecer/vista-previa");
  }

  return (
    <Screen>
      <ScreenHeader backHref="/directorio" />
      <form id="ofrecer" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Ofrecer un servicio</ScreenTitle>
          <ScreenDescription size="sm">Tus vecinos lo verán en el Directorio.</ScreenDescription>

          <FormField id="categoria" label="Categoría" error={errors.category}>
            {({ id }) => (
              <ChoiceChips<ServiceCategory>
                id={id}
                label="Categoría"
                options={serviceCategories}
                value={form.category as ServiceCategory | ""}
                onChange={(v) => set("category", v)}
              />
            )}
          </FormField>

          <FormField id="que-ofreces" label="¿Qué ofreces?" error={errors.title}>
            {(aria) => <Input {...aria} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Clases de fotografía con celular" maxLength={60} />}
          </FormField>

          <FormField id="descripcion" label="Descripción" error={errors.description}>
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[96px]"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Aprende a tomar mejores fotos con tu celular: luz, encuadre y edición básica. Grupos de máximo 4 personas."
                maxLength={280}
              />
            )}
          </FormField>

          <FormField id="precio" label="Precio" error={errors.price}>
            {(aria) => (
              <Input {...aria} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="$40.000 por clase de 2 horas" startAdornment={<FieldIcon icon={Tag} />} />
            )}
          </FormField>

          <FormField id="disponibilidad" label="Disponibilidad" error={errors.availability}>
            {(aria) => (
              <Input
                {...aria}
                value={form.availability}
                onChange={(e) => set("availability", e.target.value)}
                placeholder="Sábados, 10:00 a. m."
                startAdornment={<FieldIcon icon={Clock} />}
              />
            )}
          </FormField>

          <ul className="flex w-full flex-col rounded-[18px] bg-surface px-4 py-1">
            <ToggleItem
              id="mostrar-apto"
              title="Mostrar mi apartamento"
              hint={user.unitLabel}
              checked={form.showApartment}
              onChange={(v) => set("showApartment", v)}
            />
            <ToggleItem
              id="llamadas"
              title="Aceptar llamadas"
              hint="Si está apagado, solo te escriben por la app"
              checked={form.acceptCalls}
              onChange={(v) => set("acceptCalls", v)}
            />
          </ul>
        </ScreenBody>

        <ActionBar>
          <Button type="submit" form="ofrecer" className="rounded-[80px]">
            Ver vista previa
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}

function ToggleItem({ id, title, hint, checked, onChange }: { id: string; title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex w-full items-center justify-between gap-4 border-b border-option-border py-3 last:border-0">
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-body text-text">{title}</span>
        <span className="text-caption text-text-secondary">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </li>
  );
}
