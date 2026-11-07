"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { SuccessBanner } from "@/components/app/cards";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenActions, ScreenBody, ScreenHeader, ScreenTitle } from "@/components/app/screen";

const PASSWORD_HINT = "Mínimo 8 caracteres, con al menos un número.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"name" | "email" | "password", string>>;

function validate(values: { name: string; email: string; password: string }): Errors {
  const errors: Errors = {};
  if (values.name.trim().split(/\s+/).length < 2) errors.name = "Escribe tu nombre y tu apellido.";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Revisa el correo, parece incompleto.";
  if (values.password.length < 8 || !/\d/.test(values.password)) errors.password = PASSWORD_HINT;
  return errors;
}

export function CrearCuentaForm({ unitLabel }: { unitLabel: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = React.useState<Errors>({});

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) router.push("/registro/normas");
  }

  return (
    <Screen>
      <ScreenHeader />
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={18}>
          <SuccessBanner>Código válido · {unitLabel}</SuccessBanner>
          <ScreenTitle>Crea tu cuenta</ScreenTitle>

          <FormField id="nombre" label="Nombre y apellido" error={errors.name}>
            {(aria) => <Input {...aria} value={values.name} onChange={set("name")} autoComplete="name" />}
          </FormField>

          <FormField id="correo" label="Correo electrónico" error={errors.email}>
            {(aria) => (
              <Input {...aria} type="email" inputMode="email" value={values.email} onChange={set("email")} autoComplete="email" />
            )}
          </FormField>

          <FormField id="contrasena" label="Contraseña" hint={PASSWORD_HINT} error={errors.password}>
            {(aria) => (
              <PasswordInput {...aria} value={values.password} onChange={set("password")} autoComplete="new-password" />
            )}
          </FormField>
        </ScreenBody>

        <ScreenActions>
          <Button type="submit">Continuar</Button>
        </ScreenActions>
      </form>
    </Screen>
  );
}
