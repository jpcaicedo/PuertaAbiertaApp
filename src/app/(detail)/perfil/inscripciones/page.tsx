import { ActivityScreen } from "@/components/perfil/activity-screen";
import { getMyAgenda } from "@/lib/agenda/queries";
import { MyAgendaProvider } from "@/lib/profile/activity";

export const metadata = { title: "Mis reservas y actividades · Puerta Abierta" };

/** P2 · Mis reservas y actividades */
export default async function Page() {
  const mine = await getMyAgenda();
  if (!mine) return <ActivityScreen />;
  return (
    <MyAgendaProvider value={mine}>
      <ActivityScreen />
    </MyAgendaProvider>
  );
}
