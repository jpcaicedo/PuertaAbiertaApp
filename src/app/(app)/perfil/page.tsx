import { ProfileScreen } from "@/components/perfil/profile-screen";
import { getMyAgenda } from "@/lib/agenda/queries";
import { MyAgendaProvider } from "@/lib/profile/activity";

export const metadata = { title: "Perfil · Puerta Abierta" };

/** P1 · Perfil */
export default async function Page() {
  const mine = await getMyAgenda();
  if (!mine) return <ProfileScreen />;
  return (
    <MyAgendaProvider value={mine}>
      <ProfileScreen />
    </MyAgendaProvider>
  );
}
