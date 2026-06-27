import { GeocoderProvider, RoutingProvider, RouteResponse, GeocodeResponse, AutocompleteSuggestion } from '../types/providers.types';

class OpenSourceMapsService implements GeocoderProvider, RoutingProvider {
  private reverseCache = new Map<string, GeocodeResponse>();
  private autocompleteCache = new Map<string, AutocompleteSuggestion[]>();
  private activeAbortController: AbortController | null = null;

  // Haversine formula
  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    roadFactor = 1.35,
    avgSpeedKmh = 30
  ): Promise<RouteResponse> {
    const haversineDist = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const estimatedDistance = haversineDist * roadFactor;
    const estimatedDuration = Math.max(3, Math.ceil((estimatedDistance / avgSpeedKmh) * 60));

    // Generate polyline with winding route points
    const polyline: [number, number][] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = origin.lat + (destination.lat - origin.lat) * ratio;
      const lng = origin.lng + (destination.lng - origin.lng) * ratio;
      
      if (i > 0 && i < steps) {
        // Add realistic wiggles to mock a winding street route
        const wiggleLat = (Math.sin(i * 1.5) + Math.cos(i * 0.7)) * 0.0006;
        const wiggleLng = (Math.cos(i * 1.3) + Math.sin(i * 0.9)) * 0.0006;
        polyline.push([lat + wiggleLat, lng + wiggleLng]);
      } else {
        polyline.push([lat, lng]);
      }
    }

    return {
      distanceKm: Number(estimatedDistance.toFixed(2)),
      durationMins: estimatedDuration,
      polyline
    };
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse> {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (this.reverseCache.has(cacheKey)) {
      return this.reverseCache.get(cacheKey)!;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
      const data = await res.json();
      if (data && data.display_name) {
        const result: GeocodeResponse = {
          formattedAddress: data.display_name,
          placeId: data.place_id ? String(data.place_id) : `osm_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          plusCode: this.generateMockPlusCode(lat, lng)
        };
        this.reverseCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.error('Nominatim reverse geocoding failed:', e);
    }

    const fallback: GeocodeResponse = {
      formattedAddress: `إحداثيات (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      placeId: `coord_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      plusCode: this.generateMockPlusCode(lat, lng)
    };
    return fallback;
  }

  async getAutocompleteSuggestions(input: string): Promise<AutocompleteSuggestion[]> {
    const query = input.trim();
    if (query.length < 3) return [];
    
    // Check Cache
    if (this.autocompleteCache.has(query)) {
      return this.autocompleteCache.get(query)!;
    }

    // Cancel Previous Active Fetch Request
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    this.activeAbortController = new AbortController();
    const { signal } = this.activeAbortController;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&accept-language=ar&limit=5`,
        { signal }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const suggestions: AutocompleteSuggestion[] = data.map((item: any) => ({
          description: item.display_name,
          placeId: String(item.place_id),
          lat: Number(item.lat),
          lng: Number(item.lon)
        }));
        this.autocompleteCache.set(query, suggestions);
        return suggestions;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Expected abortion
      } else {
        console.error('Nominatim autocomplete search failed:', e);
      }
    }
    return [];
  }

  private generateMockPlusCode(lat: number, lng: number): string {
    const base36Lat = Math.abs(Math.floor(lat * 100000)).toString(36).toUpperCase().slice(-4);
    const base36Lng = Math.abs(Math.floor(lng * 100000)).toString(36).toUpperCase().slice(-4);
    return `8G3F${base36Lat}+${base36Lng}`;
  }
}

export const openSourceMapsService = new OpenSourceMapsService();
export default openSourceMapsService;