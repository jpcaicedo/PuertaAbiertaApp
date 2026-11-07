"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AvatarPicker } from "@/components/app/avatar-picker";
import { ToggleList, ToggleRow } from "@/components/app/controls";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { saveProfileSetup } from "@/lib/auth/actions";

type Visibility = { apartment: boolean; phone: boolean; directory: boolean };

/** R6 · Perfil (opcional) (484:2134) */
export default function PerfilPage() {
  const router = useRouter();
  const [bio, setBio] = React.useState("");
  const [visibility, setVisibility] = React.useState<Visibility>({ apartment: true, phone: false, directory: true });
  const toggle = (key: keyof Visibility) => (checked: boolean) => setVisibility((v) => ({ ...v, [key]: checked }));
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();

  function enter() {
    router.replace("/inicio");
    router.refresh();
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startSave(async () => {
      // TODO (bloque 3): subir la foto a Supabase Storage.
      const result = await saveProfileSetup({
        bio,
        showApartment: visibility.apartment,
        showPhone: visibility.phone,
        inDirectory: visibility.directory,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      enter();
    });
  }

  return (
    <Screen>
      <ScreenHeader />
      <form onSubmit={save} className="flex flex-1 flex-col">
        <ScreenBody gap={16} className="pt-3">
          <ScreenTitle>Tu perfil en la comunidad</ScreenTitle>
          <ScreenDescription size="sm">Es opcional y puedes cambiarlo cuando quieras desde Perfil.</ScreenDescription>

          <AvatarPicker />

          <FormField id="bio" label="Cuéntale a tus vecinos algo de ti">
            {(aria) => (
              <Textarea
                {...aria}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={2}
                placeholder="Me encanta el yoga y tengo un beagle que se llama Toby."
              />
            )}
          </FormField>

          <ToggleList aria-label="Qué muestro a mis vecinos">
            <ToggleRow id="ver-apto" label="Mostrar mi apartamento" checked={visibility.apartment} onCheckedChange={toggle("apartment")} />
            <ToggleRow id="ver-tel" label="Mostrar mi teléfono" checked={visibility.phone} onCheckedChange={toggle("phone")} />
            <ToggleRow id="ver-dir" label="Aparecer en el directorio" checked={visibility.directory} onCheckedChange={toggle("directory")} />
          </ToggleList>
        </ScreenBody>

        <ScreenActions>
          {error && (
            <p role="alert" className="text-caption text-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar y entrar"}
          </Button>
          <Button type="button" variant="link" onClick={enter}>
            Omitir por ahora
          </Button>
        </ScreenActions>
      </form>
    </Screen>
  );
}
