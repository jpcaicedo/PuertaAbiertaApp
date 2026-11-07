"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, UserRound } from "lucide-react";

type AvatarPickerProps = {
  /** URL inicial de la foto (opcional). */
  defaultSrc?: string;
  onChange?: (file: File) => void;
};

/** Foto de perfil 64px + botón cámara (borde #C6C6CD, radio 12, padding 8/12, icono 18), gap 14. */
export function AvatarPicker({ defaultSrc, onChange }: AvatarPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState(defaultSrc);

  React.useEffect(() => {
    return () => {
      if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    };
  }, [src]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    onChange?.(file);
  }

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-brand-soft">
        {src ? (
          <Image src={src} alt="Tu foto de perfil" fill sizes="64px" className="object-cover" unoptimized={src.startsWith("blob:")} />
        ) : (
          <UserRound className="absolute inset-0 m-auto size-8 text-brand" aria-hidden />
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={src ? "Cambiar foto" : "Agregar foto"}
        className="inline-flex cursor-pointer items-center rounded-field border border-border bg-surface px-3 py-2 text-text transition-colors hover:bg-brand-soft/50 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Camera className="size-[18px]" strokeWidth={2} aria-hidden />
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} />
    </div>
  );
}
