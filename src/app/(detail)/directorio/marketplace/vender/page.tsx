"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Check, Info, Package, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar, Note } from "@/components/agenda/primitives";
import { FieldIcon } from "@/components/agenda/fields";
import { ChoiceChips } from "@/components/directorio/ui";
import { community, currentResident } from "@/lib/mock-data";
import { productCategories, productConditions, type ProductCategory, type ProductCondition } from "@/lib/directory/data";
import { directoryActions } from "@/lib/directory/store";

const MAX_PHOTOS = 5;
type Errors = Partial<Record<"photos" | "title" | "price" | "category" | "condition", string>>;

/** "150000" → "$150.000" mientras se escribe. */
const formatMoney = (digits: string) => (digits ? `$${Number(digits).toLocaleString("es-CO")}` : "");

/** D10 · Vender un producto (484:4099) → D11. */
export default function VenderProductoPage() {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory | "">("");
  const [condition, setCondition] = React.useState<ProductCondition | "">("");
  const [delivery, setDelivery] = React.useState(`En la portería de la ${currentResident.unitLabel.split(" · ")[0]}`);
  const [errors, setErrors] = React.useState<Errors>({});

  React.useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p)), [photos]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files)
      .slice(0, MAX_PHOTOS - photos.length)
      .map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls]);
    setErrors((e) => ({ ...e, photos: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!photos.length) found.photos = "Agrega al menos una foto.";
    if (title.trim().length < 3) found.title = "Escribe qué vendes.";
    if (!(Number(price) > 0)) found.price = "Indica el precio.";
    if (!category) found.category = "Elige una categoría.";
    if (!condition) found.condition = "Elige el estado.";
    setErrors(found);
    if (Object.keys(found).length) return;
    // TODO: subir fotos y POST /api/productos
    directoryActions.addListing({ title: title.trim(), price: Number(price), category: category as ProductCategory, condition: condition as ProductCondition });
    router.push("/directorio/marketplace/vender/listo");
  }

  const slots = Math.max(3, Math.min(MAX_PHOTOS, photos.length + 1));

  return (
    <Screen>
      <ScreenHeader backHref="/directorio/marketplace" />
      <form id="vender" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Vender un producto</ScreenTitle>
          <ScreenDescription size="sm">Solo lo ven los vecinos de {community.name}.</ScreenDescription>

          {/* Fotos: tiles de 96, radio 14 */}
          <div className="flex w-full flex-col gap-2">
            <ul aria-label="Fotos del producto" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {Array.from({ length: slots }, (_, i) => {
                const src = photos[i];
                return (
                  <li key={i} className="shrink-0">
                    {src ? (
                      <div className="relative size-24 overflow-hidden rounded-chip bg-brand-soft">
                        <Image src={src} alt={`Foto ${i + 1}`} fill unoptimized className="object-cover" />
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-brand/85 py-1 text-overline font-medium text-white">
                          <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                          Foto {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                          aria-label={`Quitar foto ${i + 1}`}
                          className="absolute top-1 right-1 grid size-6 cursor-pointer place-items-center rounded-full bg-ink/70 text-white"
                        >
                          <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex size-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-chip border-[1.5px] border-dashed border-border text-caption text-text transition-colors hover:border-brand hover:bg-brand-soft/30 outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        <Camera className="size-5" strokeWidth={2} aria-hidden />
                        Agregar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => addPhotos(e.target.files)} />
            <p className={errors.photos ? "text-caption text-error" : "text-overline text-text-secondary"}>
              {errors.photos ?? `Agrega hasta ${MAX_PHOTOS} fotos con buena luz.`}
            </p>
          </div>

          <FormField id="que-vendes" label="Qué vendes" error={errors.title}>
            {(aria) => <Input {...aria} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Silla de escritorio ergonómica" maxLength={60} />}
          </FormField>

          <FormField id="descripcion" label="Descripción">
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[84px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tiene soporte lumbar y se le ajusta la altura. La uso poco desde que volví a la oficina."
                maxLength={280}
              />
            )}
          </FormField>

          <FormField id="precio" label="Precio" error={errors.price}>
            {(aria) => (
              <Input
                {...aria}
                inputMode="numeric"
                value={formatMoney(price)}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="$150.000"
                startAdornment={<FieldIcon icon={Tag} />}
              />
            )}
          </FormField>

          <FormField id="categoria" label="Categoría" error={errors.category}>
            {({ id }) => <ChoiceChips id={id} label="Categoría" options={productCategories} value={category} onChange={setCategory} />}
          </FormField>

          <FormField id="estado" label="Estado" error={errors.condition}>
            {({ id }) => <ChoiceChips id={id} label="Estado" options={productConditions} value={condition} onChange={setCondition} />}
          </FormField>

          <FormField id="entrega" label="Entrega">
            {(aria) => <Input {...aria} value={delivery} onChange={(e) => setDelivery(e.target.value)} startAdornment={<FieldIcon icon={Package} />} />}
          </FormField>

          <Note icon={Info} tone="neutral">
            Al publicar, tu producto queda sujeto a las normas de la comunidad que aceptaste al registrarte.
          </Note>
        </ScreenBody>

        <ActionBar>
          <Button type="submit" form="vender" className="rounded-[80px]">
            Publicar producto
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
