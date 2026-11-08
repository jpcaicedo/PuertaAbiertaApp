"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { signIn } from "@/lib/auth/actions";

const LOGIN_ERROR = "El correo o la contraseña no coinciden. Revisa los datos o recupera tu contraseña.";

/** Solo rutas internas: evita que ?siguiente= lleve a otro sitio. */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio");

/** R7 · Iniciar sesión (484:2168) y R7b · Datos incorrectos (484:2190) */
export default function IngresarPage() {
  return (
    <React.Suspense>
      <IngresarForm />
    </React.Suspense>
  );
}

function IngresarForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("siguiente"));
  const [loading, startLogin] = React.useTransition();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [failed, setFailed] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (failed) {
      // "Intentar de nuevo": limpia el error y la contraseña.
      setFailed(false);
      setPassword("");
      emailRef.current?.focus();
      return;
    }
    startLogin(async () => {
      const { ok, admin } = await signIn(email, password);
      if (!ok) {
        setFailed(true);
        return;
      }
      router.replace(admin && next === "/inicio" ? "/admin" : next);
      router.refresh();
    });
  }

  const clearError = () => failed && setFailed(false);

  return (
    <Screen>
      <ScreenHeader backHref="/" />
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={18}>
          <ScreenTitle>Hola de nuevo</ScreenTitle>
          <ScreenDescription>Entra con el correo que usaste al registrarte.</ScreenDescription>

          <FormField id="correo" label="Correo electrónico" error={failed ? LOGIN_ERROR : undefined}>
            {(aria) => (
              <Input
                ref={emailRef}
                {...aria}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
              />
            )}
          </FormField>

          <FormField id="contrasena" label="Contraseña">
            {(aria) => (
              <PasswordInput
                {...aria}
                invalid={failed}
                aria-describedby={failed ? "correo-error" : undefined}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
              />
            )}
          </FormField>

          <Link
            href={`/recuperar${email ? `?correo=${encodeURIComponent(email)}` : ""}`}
            className="rounded-sm text-caption font-semibold text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </ScreenBody>

        <ScreenActions>
          <Button type="submit" disabled={loading || (!failed && (!email || !password))}>
            {loading ? "Entrando…" : failed ? "Intentar de nuevo" : "Entrar"}
          </Button>
        </ScreenActions>
      </form>
    </Screen>
  );
}
