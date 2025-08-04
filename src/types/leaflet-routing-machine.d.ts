declare module "leaflet" {
  namespace Routing {
    interface RoutingControlOptions {
      waypoints?: L.LatLng[];
      lineOptions?: {
        styles?: Array<{
          color?: string;
          weight?: number;
          opacity?: number;
        }>;
      };
      routeWhileDragging?: boolean;
      addWaypoints?: boolean;
      show?: boolean;
      fitSelectedRoutes?: boolean;
      draggableWaypoints?: boolean;
      createMarker?: () => L.Marker | null;
    }

    function control(options: RoutingControlOptions): L.Control;
  }
}


import type * as L from "leaflet";

declare module "leaflet" {
  // Misol uchun
  const myIcon: L.Icon;
}
