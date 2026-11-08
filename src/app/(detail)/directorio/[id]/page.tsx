import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MessageCircle, Phone, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { ActionBar, InfoList, InfoRow } from "@/components/agenda/primitives";
import { Avatar } from "@/components/directorio/ui";
import { DeleteServiceButton } from "@/components/directorio/delete-service";
import { ServiceRating, ServiceReviews } from "@/components/directorio/reviews";
import { getServiceBySlug, getServiceReviews } from "@/lib/directory/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth/current-user";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const s = await getServiceBySlug((await params).id);
  return { title: s ? `${s.neighbor.name} · Directorio` : "Directorio" };
}

/** D3 · Perfil del vecino (484:3699) */
export default async function PerfilVecinoPage({ params }: Props) {
  const [s, me] = await Promise.all([getServiceBySlug((await params).id), getCurrentUser()]);
  if (!s) notFound();
  const n = s.neighbor;
  const isMine = !!s.ownerId && s.ownerId === me?.id;
  const { reviews: real, mine, access } = await getServiceReviews(s.dbId);

  return (
    <Screen>
      <ScreenHeader backHref="/directorio" />
      <div className="flex flex-col items-center gap-2 px-5 pt-1">
        <Avatar name={n.name} src={n.avatarLarge ?? n.avatar} size={88} />
        <h1 className="pt-1 text-headline font-bold text-text">{n.name}</h1>
        {n.verified && (
          <span className="inline-flex items-center gap-[5px] rounded-[20px] bg-brand-soft py-1 pr-2.5 pl-2 text-overline font-medium text-brand">
            <ShieldCheck className="size-3.5" strokeWidth={2} aria-hidden />
            {n.feminine === true ? "Vecina verificada" : n.feminine === false ? "Vecino verificado" : "Identidad verificada"} · {n.apartment ? `Apto ${n.apartment}, ` : ""}Torre{" "}
            {n.tower}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-3.5 px-5 pt-4">
        <section className="flex w-full flex-col gap-2.5 rounded-[20px] bg-surface p-4">
          <h2 className="text-heading font-semibold text-text">{s.title}</h2>
          <ServiceRating slug={s.id} rating={s.rating} count={s.reviewCount} remote={isSupabaseConfigured} />
          <p className="text-caption text-text-secondary">{s.longDescription}</p>
          <InfoList className="gap-2.5 rounded-none bg-transparent p-0">
            <InfoRow icon={Tag}>{s.price}</InfoRow>
            <InfoRow icon={Clock}>{s.schedule}</InfoRow>
            {s.callHours ? (
              <InfoRow icon={Phone}>Acepta llamadas de {s.callHours}</InfoRow>
            ) : (
              <InfoRow icon={MessageCircle}>Solo mensajes en la app</InfoRow>
            )}
          </InfoList>
        </section>

        <ServiceReviews
          slug={s.id}
          firstName={n.firstName}
          real={real}
          samples={s.reviews}
          hasMine={!!mine}
          access={access}
          isMine={isMine}
          remote={isSupabaseConfigured}
        />
      </div>

      <ActionBar>
        {isMine ? (
          <>
            <Button asChild variant="secondary" className="flex-1 rounded-[80px]">
              <Link href="/mensajes">Tu servicio · Ver mensajes</Link>
            </Button>
            <DeleteServiceButton slug={s.id} title={s.title} />
          </>
        ) : (
          <Button asChild className="flex-1 rounded-[80px]">
            <Link href={`/directorio/${s.id}/mensaje`}>Enviar mensaje</Link>
          </Button>
        )}
        {!isMine && s.callHours && s.phone && (
          <a
            href={`tel:${s.phone}`}
            aria-label={`Llamar a ${n.firstName}`}
            className="grid size-[52px] shrink-0 place-items-center rounded-card bg-success-soft text-success transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Phone className="size-5" strokeWidth={2} aria-hidden />
          </a>
        )}
      </ActionBar>
    </Screen>
  );
}
