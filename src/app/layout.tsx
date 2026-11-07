import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/app/theme-provider";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://puertaabierta.app"),
  title: "Puerta Abierta · Skema",
  description: "Conoce a tus vecinos, descubre lo mejor de tu barrio y participa en lo que pasa en tu edificio.",
  /**
   * I4 · Así le llega a un vecino sin la app (Figma 484:5115):
   * WhatsApp, iMessage y los correos arman la vista previa del enlace con estas etiquetas Open Graph.
   */
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Puerta Abierta",
    title: "Puerta Abierta",
    description: "Los avisos y planes de tu conjunto, en una app.",
    images: [{ url: "/og-puerta-abierta.png", width: 1200, height: 630, alt: "Puerta Abierta" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Color de la barra del navegador según el tema del sistema (mismo valor que --pa-bg).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes agrega la clase `dark` antes de hidratar.
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
