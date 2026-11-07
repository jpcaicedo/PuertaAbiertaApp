"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 30;

/** "No me llegó, reenviar": tras reenviar se bloquea 30 s para evitar envíos repetidos. */
export function ResendButton({ email }: { email: string }) {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function resend() {
    // TODO: volver a llamar al endpoint de recuperación con `email`.
    void email;
    setSeconds(COOLDOWN_SECONDS);
  }

  return (
    <Button variant="link" onClick={resend} disabled={seconds > 0} aria-live="polite">
      {seconds > 0 ? `Enlace reenviado · espera ${seconds} s` : "No me llegó, reenviar"}
    </Button>
  );
}
