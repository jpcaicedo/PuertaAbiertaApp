import { HomeHeader } from "@/components/app/home-header";
import { ActivityCard, NoticeCard, PlaceCard } from "@/components/app/home-cards";
import { SectionHeader } from "@/components/app/section-header";
import { Screen } from "@/components/app/screen";
import { getNotices, nextActivity, recommendedPlace } from "@/lib/mock-data";

// Los avisos muestran "Hace 2 h": se calcula en cada visita, no en el build.
export const dynamic = "force-dynamic";

/** I1 · Inicio (Figma 484:2249) */
export default function InicioPage() {
  const now = new Date();
  const [latestNotice] = getNotices(now);

  return (
    <Screen className="pb-tabbar">
      {/* 40px de barra de estado + encabezado de 64 */}
      <div className="pt-[max(40px,env(safe-area-inset-top))]">
        <HomeHeader />
      </div>

      <div className="flex flex-col items-start px-5 pt-3">
        <section aria-labelledby="avisos" className="flex w-full flex-col gap-3 pb-3">
          <SectionHeader id="avisos" title="Avisos" action={{ label: "Ver todos", href: "/avisos" }} />
          {latestNotice && <NoticeCard notice={latestNotice} now={now} />}
        </section>

        <section aria-labelledby="actividad" className="mt-[26px] flex w-full flex-col gap-[26px]">
          <SectionHeader id="actividad" title="Próxima actividad" action={{ label: "Ver agenda", href: "/agenda" }} />
          <ActivityCard activity={nextActivity} />
        </section>

        <section aria-labelledby="recomendado" className="mt-[26px] flex w-full flex-col gap-[26px]">
          <SectionHeader id="recomendado" title="Recomendado por tus vecinos" action={{ label: "Ver mapa", href: "/mapa" }} />
          <PlaceCard place={recommendedPlace} />
        </section>
      </div>
    </Screen>
  );
}
