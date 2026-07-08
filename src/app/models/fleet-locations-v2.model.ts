/**
 * Fleet real-time payload from {@code /topic/fleet/locations/v2} (STOMP).
 * Mirrors backend FleetLocationsV2Payload / TaxiLocationResponseV2.
 */
export interface FleetV2Statistics {
  waitingCount: number;
  inProgressCount: number;
  startedCount: number;
  terminatedCount: number;
  cancelledCount: number;
  cancelledByClientCount: number;
  cancelledByTaxiCount: number;
  expiredCount: number;
  totalTaxis: number;
}

export interface TaxiLocationResponseV2 {
  taxiId: number;
  taxiNumber: string | number;
  latitude: number;
  longitude: number;
  phone: string | null;
  driverName: string | null;
  offreId: number | null;
  rideStatus: string | null;
  feesOption: string | null;
  totalPrice: number | null;
  locationHistory?: unknown;
  destinationHistory?: unknown;
  clientLocation?: string | null;
  clientDestination?: string | null;
  clientDestLatitude?: number | null;
  clientDestLongitude?: number | null;
}

export interface FleetLocationsV2Payload {
  statistics: FleetV2Statistics;
  locations: TaxiLocationResponseV2[];
}

export const FLEET_LOCATIONS_V2_TOPIC = '/topic/fleet/locations/v2';

/** STOMP destination to trigger a fleet broadcast (unchanged unless backend adds a v2-specific path). */
export const FLEET_SUBSCRIBE_APP_DESTINATION = '/app/fleet.subscribe';
