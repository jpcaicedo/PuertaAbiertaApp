import { PageSkeleton } from "@/components/app/page-skeleton";

/** Se muestra al instante al abrir un detalle, mientras llegan los datos. */
export default function Loading() {
  return <PageSkeleton variant="detail" />;
}
