"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import * as React from "react";
import { useTheme } from "next-themes";
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from "react-map-gl/mapbox";
import {
  MAP_DEFAULT_ZOOM,
  RESIDENCE,
  type LngLat,
  type NeighborhoodPlace,
} from "@/lib/places/data";
import { MapPin, ResidencePin } from "./map-pin";

export type NeighborhoodMapProps = {
  places: NeighborhoodPlace[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Cambia `key` para volar a `to` (p. ej. al tocar "Centrar"). */
  focus?: { key: number; to: LngLat };
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const LABELS_MIN_ZOOM = 15;

/**
 * Mapa real de Mapbox que reemplaza al plano ilustrado.
 * Ocupa todo su contenedor (absolute inset-0) y deja que el zoom y el arrastre funcionen;
 * los pines son <Marker> anclados a coordenadas, así se mueven con el mapa.
 */
export default function NeighborhoodMap({
  places,
  selectedId,
  onSelect,
  focus,
}: NeighborhoodMapProps) {
  const mapRef = React.useRef<MapRef>(null);
  const [zoom, setZoom] = React.useState(MAP_DEFAULT_ZOOM);
  // En modo oscuro se usa el estilo oscuro de Mapbox.
  const { resolvedTheme } = useTheme();
  // Lejos, los nombres de los pines se tapan entre sí: se muestran solo los iconos (salvo el seleccionado).
  const showLabels = zoom >= LABELS_MIN_ZOOM;

  // Vuela al lugar seleccionado o al conjunto al pulsar "Centrar".
  React.useEffect(() => {
    if (!focus) return;
    mapRef.current?.flyTo({
      center: [focus.to.lng, focus.to.lat],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      duration: 800,
      // El pin crece hacia la derecha y abajo está la tarjeta: se deja el punto a la izquierda y arriba del centro.
      offset: [-70, -90],
    });
  }, [focus]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: RESIDENCE.coords.lng,
        latitude: RESIDENCE.coords.lat,
        zoom: MAP_DEFAULT_ZOOM,
      }}
      mapStyle={resolvedTheme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
      style={{ position: "absolute", inset: 0 }}
      // Mapa de barrio: sin rotación ni inclinación, que en el celular confunden.
      dragRotate={false}
      touchPitch={false}
      pitchWithRotate={false}
      attributionControl={false}
      // El logo y los créditos de Mapbox deben verse: abajo los tapan la tarjeta y la barra inferior.
      logoPosition="top-left"
      reuseMaps
      onZoom={(e) => setZoom(e.viewState.zoom)}
    >
      <AttributionControl
        compact
        position="top-right"
        style={{ marginTop: 64 }}
      />
      <Marker
        longitude={RESIDENCE.coords.lng}
        latitude={RESIDENCE.coords.lat}
        anchor="top"
      >
        <div className="-mt-[11px]">
          <ResidencePin label={RESIDENCE.label} />
        </div>
      </Marker>

      {places.map((p) => {
        const selected = p.id === selectedId;
        return (
          <Marker
            key={p.id}
            longitude={p.coords.lng}
            latitude={p.coords.lat}
            // El centro del icono queda sobre la coordenada.
            anchor="left"
            offset={[-19, 0]}
            style={{ zIndex: selected ? 2 : 1 }}
          >
            <MapPin
              place={p}
              selected={selected}
              compact={!showLabels && !selected}
              onSelect={() => onSelect(p.id)}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
