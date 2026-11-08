import { NotificationsScreen } from "@/components/perfil/notifications-screen";
import { getNotifications } from "@/lib/notifications/queries";

export const metadata = { title: "Notificaciones · Puerta Abierta" };
export const dynamic = "force-dynamic";

/** N1 · Notificaciones */
export default async function Page() {
  const items = await getNotifications();
  return items ? <NotificationsScreen items={items} /> : <NotificationsScreen />;
}
