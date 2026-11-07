import Link from "next/link";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { PageHeading, SectionLabel } from "@/components/perfil/ui";
import { community } from "@/lib/mock-data";

export const metadata = { title: "Política de datos · Puerta Abierta" };

/**
 * Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013,
 * compilado en el Decreto 1074 de 2015). No tiene frame en Figma: se enlaza desde R5.
 *
 * TODO: BORRADOR. Antes de publicar la app, que un abogado revise el texto y completar
 * la razón social, el NIT y el canal oficial de contacto del responsable.
 */
const CONTACT_EMAIL = "datos@puertaabierta.app";
const UPDATED = "noviembre de 2026";

const sections: { title: string; body?: string; items?: string[] }[] = [
  {
    title: "Quién es responsable",
    body: `Puerta Abierta trata tus datos junto con la administración de ${community.name}, que verifica quién vive en el conjunto. Puedes escribirnos a ${CONTACT_EMAIL}.`,
  },
  {
    title: "Qué datos recogemos",
    items: [
      "Tu nombre, torre y apartamento, y el código de residencia con el que entraste.",
      "Tu correo y, si lo das, tu teléfono.",
      "Tu foto y tu descripción, si decides agregarlas.",
      "Lo que publicas: planes, servicios, productos, mensajes y reportes.",
      "Tus reservas de zonas comunes e inscripciones en la Agenda.",
    ],
  },
  {
    title: "Para qué los usamos",
    items: [
      "Verificar que vives en el conjunto antes de darte acceso.",
      "Mostrarte a tus vecinos solo con lo que elijas en Privacidad.",
      "Gestionar con la administración tus reservas y solicitudes.",
      "Enviarte los avisos de la administración y las notificaciones que actives.",
      "Cuidar la convivencia: revisar reportes y hacer cumplir las normas.",
    ],
  },
  {
    title: "Lo que no hacemos",
    body: "No vendemos tus datos ni los compartimos con comercios o terceros para publicidad. Quien te reporta, y lo que reportas, no se le muestra al vendedor ni a otros vecinos.",
  },
  {
    title: "Tus derechos",
    items: [
      "Conocer, actualizar y corregir tus datos.",
      "Pedir prueba de la autorización que nos diste.",
      "Saber para qué hemos usado tus datos.",
      "Revocar la autorización o pedir que borremos tus datos, cuando no haya un deber legal de conservarlos.",
      "Consultar tus datos gratis.",
      "Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber hecho tu consulta o reclamo con nosotros.",
    ],
  },
  {
    title: "Cómo ejercerlos",
    body: `Escríbenos a ${CONTACT_EMAIL} desde el correo de tu cuenta. Respondemos las consultas en máximo 10 días hábiles (prorrogables 5 más) y los reclamos en máximo 15 días hábiles (prorrogables 8 más); si necesitamos más tiempo, te avisamos el motivo. También puedes cambiar lo que ven tus vecinos en Perfil › Privacidad.`,
  },
  {
    title: "Cuánto tiempo los guardamos",
    body: "Mientras tengas una cuenta activa en el conjunto. Si cierras tu cuenta o dejas de vivir ahí, borramos tus datos, salvo los que la ley nos obligue a conservar.",
  },
  {
    title: "Cambios a esta política",
    body: "Si la cambiamos, te avisamos en la app antes de que empiece a aplicar.",
  },
];

/** Política de datos personales (enlazada desde R5 · Normas y datos). */
export default function PoliticaDeDatosPage() {
  return (
    <Screen>
      <ScreenHeader />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-12">
        <PageHeading
          title="Política de datos personales"
          description="Cómo cuidamos tu información, según la Ley 1581 de 2012."
        />
        {sections.map((s) => (
          <section key={s.title} className="flex w-full flex-col gap-1.5">
            <SectionLabel>{s.title}</SectionLabel>
            {s.body && <p className="text-body text-text-secondary">{s.body}</p>}
            {s.items && (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-text-secondary marker:text-text-muted">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="text-caption text-text-tertiary">Última actualización: {UPDATED}.</p>
        <Link href="/perfil/privacidad" className="text-label font-semibold text-brand underline-offset-2 hover:underline">
          Cambiar lo que ven mis vecinos
        </Link>
      </div>
    </Screen>
  );
}
