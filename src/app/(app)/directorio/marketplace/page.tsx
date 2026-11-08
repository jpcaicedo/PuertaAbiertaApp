import { MarketplaceScreen } from "@/components/directorio/marketplace";
import { getMyListings, getProducts } from "@/lib/directory/queries";
import { DirectoryListingsProvider } from "@/lib/directory/store";

export const metadata = { title: "Marketplace · Directorio" };

/** D8 · Directorio · Marketplace */
export default async function MarketplacePage() {
  const [products, mine] = await Promise.all([getProducts(), getMyListings()]);
  if (!mine) return <MarketplaceScreen products={products} />;
  return (
    <DirectoryListingsProvider value={mine}>
      <MarketplaceScreen products={products} />
    </DirectoryListingsProvider>
  );
}
