import Link from "next/link";
import { notFound } from "next/navigation";
import { Building, Calendar, Clock, MapPin, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/app/badge";
import { Screen, ScreenActions, ScreenBody, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ShareNotice } from "@/components/app/share-notice";
import { formatTimeAgo } from "@/lib/mock-data";
import { getNotice } from "@/lib/notices/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const notice = await getNotice(id);
  return { title: notice ? `${notice.title} · Puerta Abierta` : "Aviso · Puerta Abierta" };
}

/** I2 · Detalle del aviso (484:2330) · el botón "Compartir aviso" abre I3 (484:5023). */
export default async function AvisoPage({ params }: Props) {
  const { id } = await params;
  const now = new Date();
  const notice = await getNotice(id);
  if (!notice) notFound();

  return (
    <Screen>
      <ScreenHeader backHref="/inicio" />
      <ScreenBody gap={14}>
        <Badge icon={Building}>{notice.source.long}</Badge>
        <ScreenTitle>{notice.title}</ScreenTitle>
        <p className="max-w-[312px] text-caption text-text-tertiary">
          Publicado por {notice.author} ·{" "}
          <span className="text-overline">{formatTimeAgo(notice.publishedAt, now)}</span>
        </p>

        <dl className="flex w-full flex-col gap-3 rounded-[20px] bg-surface p-4 shadow-card">
          <InfoRow icon={Calendar} label="Fecha" value={notice.dateLabel} />
          {notice.timeLabel && <InfoRow icon={Clock} label="Horario" value={notice.timeLabel} />}
          {notice.placeLabel && <InfoRow icon={MapPin} label="Lugar" value={notice.placeLabel} />}
        </dl>

        <p className="text-body text-text-secondary">{notice.body}</p>
      </ScreenBody>

      {/* 25px sobre la barra inferior (64 + 22) */}
      <ScreenActions className="pb-[calc(var(--tabbar-offset)+89px)]">
        <ShareNotice notice={notice} variant="block" />
        <Button asChild className="rounded-[77px]">
          <Link href="/inicio">Entendido</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}

/** Fila del bloque de datos: icono 18 azul + texto 15/22, gap 10. */
function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <dt className="contents">
        <Icon className="size-[18px] shrink-0 text-brand" strokeWidth={2} aria-hidden />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="text-body text-text">{value}</dd>
    </div>
  );
}
