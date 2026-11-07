import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/** Plus Jakarta Sans variable (200–800), self-hosted: sin dependencia de Google Fonts en runtime. */
const jakarta = localFont({
  src: "../fonts/PlusJakartaSans-Variable.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Puerta Abierta · Skema",
  description: "Conoce a tus vecinos, descubre lo mejor de tu barrio y participa en lo que pasa en tu edificio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f9fb",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
