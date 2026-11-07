"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { IconTile } from "@/components/app/icon-tile";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { checkResidenceCode } from "@/lib/auth/actions";
import { useRegistration } from "../registration-context";

const INVALID_MESSAGE = "Este código no existe o ya fue usado. Revisa letras y números, por ejemplo la O y el 0.";

/** Pone en mayúsculas y agrega los guiones mientras se escribe: SAM-E204-K7Q */
function formatCode(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return [clean.slice(0, 3), clean.slice(3, 7), clean.slice(7, 10)].filter(Boolean).join("-");
}

/** R2 · Código de residencia (484:1924) y R2b · Código inválido (484:1945) */
export default function CodigoPage() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [code, setCode] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const [checking, startCheck] = React.useTransition();
  const { update } = useRegistration();

  function validate(e: React.FormEvent) {
    e.preventDefault();
    startCheck(async () => {
      const result = await checkResidenceCode(code);
      if (!result.ok) {
        setInvalid(true);
        return;
      }
      update({ code, unitLabel: result.unitLabel });
      router.push(`/registro/cuenta?codigo=${encodeURIComponent(code)}`);
    });
  }

  function retry() {
    setInvalid(false);
    inputRef.current?.select();
  }

  return (
    <Screen>
      <ScreenHeader backHref="/" />
      <form onSubmit={validate} className="flex flex-1 flex-col" noValidate>
        <ScreenBody gap={20}>
          <IconTile icon={Key} size="lg" />
          <ScreenTitle>Ingresa tu código de residencia</ScreenTitle>
          <ScreenDescription>
            Lo entrega la administración de tu edificio, o Skema cuando recibes tu apartamento. Identifica tu unidad y
            garantiza que solo entren vecinos.
          </ScreenDescription>
          <FormField
            id="codigo"
            label="Código"
            hint="Formato: 3 letras, tu apartamento y 3 caracteres."
            error={invalid ? INVALID_MESSAGE : undefined}
          >
            {(aria) => (
              <Input
                ref={inputRef}
                {...aria}
                value={code}
                onChange={(e) => {
                  setCode(formatCode(e.target.value));
                  if (invalid) setInvalid(false);
                }}
                placeholder="SAM-E204-K7Q"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                className="uppercase"
              />
            )}
          </FormField>
        </ScreenBody>

        <ScreenActions className={invalid ? "pb-[max(44px,env(safe-area-inset-bottom))]" : undefined}>
          {invalid ? (
            <>
              <Button onClick={retry}>Intentar de nuevo</Button>
              <Button asChild variant="secondary">
                <Link href="/registro/ayuda">Pedir ayuda a la administración</Link>
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" disabled={code.length < 12 || checking}>
                {checking ? "Validando…" : "Validar código"}
              </Button>
              <Button asChild variant="link">
                <Link href="/registro/ayuda">No tengo código</Link>
              </Button>
            </>
          )}
        </ScreenActions>
      </form>
    </Screen>
  );
}
