import { ProfileScreen } from "@/components/perfil/profile-screen";
import { getMyAgenda } from "@/lib/agenda/queries";
import { getUnreadCount } from "@/lib/messages/queries";
import { MyAgendaProvider } from "@/lib/profile/activity";
import { getMyListings } from "@/lib/directory/queries";
import { DirectoryListingsProvider } from "@/lib/directory/store";

export const metadata = { title: "Perfil · Puerta Abierta" };

/** P1 · Perfil */
export default async function Page() {
  const [mine, unread, listings] = await Promise.all([getMyAgenda(), getUnreadCount(), getMyListings()]);
  if (!mine || !listings) return <ProfileScreen />;
  return (
    <MyAgendaProvider value={mine}>
      <DirectoryListingsProvider value={listings}>
        <ProfileScreen unreadMessages={unread} />
      </DirectoryListingsProvider>
    </MyAgendaProvider>
  );
}
