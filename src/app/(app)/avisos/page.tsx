import { NoticeCard } from "@/components/app/home-cards";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { getNotices } from "@/lib/notices/queries";

export const metadata = { title: "Avisos · Puerta Abierta" };
export const dynamic = "force-dynamic";

/** Todos los avisos de la administración ("Ver todos" en Inicio), con las mismas tarjetas de I1. */
export default async function AvisosPage() {
  const now = new Date();
  const notices = await getNotices();

  return (
    <Screen className="pb-tabbar">
      <ScreenHeader backHref="/inicio" />
      <ScreenBody gap={14}>
        <ScreenTitle>Avisos</ScreenTitle>
        <ScreenDescription>Lo que publica la administración para el conjunto y tu torre.</ScreenDescription>
        {notices.length ? (
          <ul className="flex w-full flex-col gap-3">
            {notices.map((n) => (
              <li key={n.id}>
                <NoticeCard notice={n} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-text-secondary">Aún no hay avisos publicados.</p>
        )}
      </ScreenBody>
    </Screen>
  );
}
