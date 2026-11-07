import { TabBar } from "@/components/app/tab-bar";

/** Pantallas autenticadas: todas llevan la barra inferior flotante. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
