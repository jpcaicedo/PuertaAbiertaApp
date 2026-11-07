import { Coffee, PawPrint, ShoppingBag, Store, type LucideIcon } from "lucide-react";
import type { PlaceIcon } from "@/lib/places/data";

/** Icono de cada tipo de lugar (pines, resultados y cabecera sin foto). */
export const placeIcons: Record<PlaceIcon, LucideIcon> = { coffee: Coffee, store: Store, bag: ShoppingBag, paw: PawPrint };
