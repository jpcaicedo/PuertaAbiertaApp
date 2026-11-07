"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { IconTile } from "@/components/app/icon-tile";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RecuperarForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState(defaultEmail);
  const [error, setError] = React.useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Revisa el correo, parece incompleto.");
      return;
    }
    // TODO: llamar al endpoint de recuperación.
    router.push(`/recuperar/enviado?correo=${encodeURIComponent(email)}`);
  }

  return (
    <Screen>
      <ScreenHeader backHref="/ingresar" />
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={18}>
          <IconTile icon={Lock} size="lg" tone="plainBrand" />
          <ScreenTitle>Recupera tu contraseña</ScreenTitle>
          <ScreenDescription>
            Te enviamos un enlace para crear una nueva. Revisa también la carpeta de spam.
          </ScreenDescription>
          <FormField id="correo" label="Correo electrónico" error={error}>
            {(aria) => (
              <Input
                {...aria}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(undefined);
                }}
              />
            )}
          </FormField>
        </ScreenBody>

        <ScreenActions>
          <Button type="submit" disabled={!email}>
            Enviar enlace
          </Button>
        </ScreenActions>
      </form>
    </Screen>
  );
}
