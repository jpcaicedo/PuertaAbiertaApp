"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { deleteReview, reviewService } from "@/lib/directory/actions";
import { demoReviewActions, useDemoReview } from "@/lib/directory/reviews-store";
import { Avatar } from "./ui";
import { StarPicker } from "./reviews";

type Props = {
  slug: string;
  dbId?: string;
  name: string;
  firstName: string;
  avatar?: string;
  serviceTitle: string;
  mine?: { stars: number; text: string };
  remote: boolean;
};

/** Dejar o editar mi reseña de un servicio: estrellas y comentario. */
export function ReviewForm({ slug, dbId, name, firstName, avatar, serviceTitle, mine: serverMine, remote }: Props) {
  const router = useRouter();
  const demo = useDemoReview(slug);
  const mine = remote ? serverMine : demo;
  const [stars, setStars] = React.useState(mine?.stars ?? 0);
  const [text, setText] = React.useState(mine?.text ?? "");
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();
  const back = `/directorio/${slug}#resenas`;

  // En modo demo la reseña guardada llega después de cargar el navegador.
  React.useEffect(() => {
    if (!remote && demo) {
      setStars(demo.stars);
      setText(demo.text);
    }
  }, [remote, demo]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return setError("Elige de 1 a 5 estrellas.");
    setError(undefined);
    startSave(async () => {
      if (!remote || !dbId) {
        demoReviewActions.save(slug, stars, text);
      } else {
        const r = await reviewService(dbId, slug, stars, text);
        if (!r.ok) return setError(r.error);
      }
      router.replace(back);
      router.refresh();
    });
  }

  function remove() {
    startSave(async () => {
      if (!remote || !dbId) demoReviewActions.remove(slug);
      else {
        const r = await deleteReview(dbId, slug);
        if (!r.ok) return setError("No pudimos borrar la reseña. Inténtalo de nuevo.");
      }
      router.replace(back);
      router.refresh();
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref={back} />
      <form id="resena" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="flex flex-col items-center gap-2 px-5 pt-1 text-center">
          <Avatar name={name} src={avatar} size={88} />
          <h1 className="pt-2 text-headline font-bold text-text">
            {mine ? "Edita tu reseña" : `¿Cómo te fue con ${firstName}?`}
          </h1>
          <p className="text-body text-text-tertiary">{serviceTitle}</p>
        </div>

        <div className="flex flex-col items-stretch gap-5 px-5 pt-6">
          <StarPicker value={stars} onChange={(v) => {
              setStars(v);
              setError(undefined);
            }} />

          <FormField id="comentario" label="Comentario (opcional)" hint="Lo verán tus vecinos con tu nombre y tu torre.">
            {(aria) => (
              <Textarea
                {...aria}
                boxClassName="min-h-[110px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`¿Qué tal fue el servicio? ¿Se lo recomendarías a tus vecinos?`}
                maxLength={500}
              />
            )}
          </FormField>

          {mine && (
            <Button type="button" variant="link" onClick={remove} disabled={saving} className="text-error hover:text-error">
              Borrar mi reseña
            </Button>
          )}
        </div>

        <ActionBar className="flex-col">
          {error && (
            <p role="alert" className="w-full text-caption text-error">
              {error}
            </p>
          )}
          <Button type="submit" form="resena" className="rounded-[80px]" disabled={saving}>
            {saving ? "Guardando…" : mine ? "Guardar cambios" : "Publicar reseña"}
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
