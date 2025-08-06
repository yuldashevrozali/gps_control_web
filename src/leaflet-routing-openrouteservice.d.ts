// types/leaflet-routing-openrouteservice.d.ts

import "leaflet-routing-machine";

declare module "leaflet-routing-machine" {
  namespace L {
    namespace Routing {
      interface OpenRouteServiceOptions {
        serviceUrl?: string;
        apiKey: string;
        profile?: string;
      }

      class OpenRouteService implements IRouter {
        constructor(options: OpenRouteServiceOptions);
      }

      function openrouteservice(options: OpenRouteServiceOptions): OpenRouteService;
    }
  }
}
