import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { MyListingsScreen } from "@/components/directorio/marketplace";
import { community } from "@/lib/mock-data";

export const metadata = { title: "Mis publicaciones · Marketplace" };

/** D12 · Mis publicaciones (484:5149) · D12b · Producto vendido · D13 · ¿Ya lo vendiste? */
export default function MisPublicacionesPage() {
  return (
    <Screen className="pb-24">
      <ScreenHeader backHref="/directorio/marketplace" />
      <ScreenBody gap={12} className="pt-3">
        <div className="flex flex-col gap-1 pb-3">
          <ScreenTitle>Mis publicaciones</ScreenTitle>
          <ScreenDescription>Lo que tienes a la venta en {community.name}.</ScreenDescription>
        </div>
        <MyListingsScreen />
      </ScreenBody>
    </Screen>
  );
}
