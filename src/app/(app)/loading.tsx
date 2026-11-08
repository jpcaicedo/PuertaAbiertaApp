import { PageSkeleton } from "@/components/app/page-skeleton";

/** Se muestra al instante al cambiar de pestaña, mientras llegan los datos. */
export default function Loading() {
  return <PageSkeleton variant="home" />;
}
