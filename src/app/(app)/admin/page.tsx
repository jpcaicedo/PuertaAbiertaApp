import { AdminHome } from "@/components/admin/admin-home";
import { getNotices } from "@/lib/notices/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Administración · Puerta Abierta" };

/** X1 · Inicio de la administración */
export default async function AdminPage() {
  if (!isSupabaseConfigured) return <AdminHome />;
  const notices = (await getNotices()).map((n) => ({
    id: n.id,
    title: n.title,
    when: n.cardSummary,
    shareable: n.shareable !== false,
  }));
  return <AdminHome notices={notices} />;
}
