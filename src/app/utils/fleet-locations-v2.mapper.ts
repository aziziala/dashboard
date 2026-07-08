import { FleetLocation, FleetStatistics, FleetStatus } from '../models/fleet-location.model';
import {
  FleetLocationsV2Payload,
  FleetV2Statistics,
  TaxiLocationResponseV2
} from '../models/fleet-locations-v2.model';

export function isFleetLocationsV2Payload(body: unknown): body is FleetLocationsV2Payload {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const o = body as Record<string, unknown>;
  return (
    o.statistics !== null &&
    typeof o.statistics === 'object' &&
    Array.isArray(o.locations)
  );
}

/** Map backend ride status to legacy FleetStatus for map colours and filters. */
export function rideStatusToFleetStatus(rideStatus: string | null | undefined): FleetStatus {
  const s = (rideStatus || '').toUpperCase();
  if (s === 'IN_PROGRESS') {
    return FleetStatus.BUSY;
  }
  if (s === 'STARTED' || s === 'EN_ROUTE') {
    return FleetStatus.EN_ROUTE;
  }
  return FleetStatus.ACTIVE;
}

export function mergeV2StatisticsIntoFleetStats(
  base: FleetStatistics,
  s: FleetV2Statistics
): FleetStatistics {
  return {
    ...base,
    totalTaxis: s.totalTaxis,
    activeTaxis: s.waitingCount,
    busyTaxis: s.inProgressCount,
    enrouteTaxis: s.startedCount
  };
}

export function taxiLocationV2ToFleetLocation(
  t: TaxiLocationResponseV2,
  stats: FleetV2Statistics
): FleetLocation {
  const rideStatus = t.rideStatus || '';
  return {
    taxiId: t.taxiId,
    taxiNumber: String(t.taxiNumber ?? ''),
    driverName: t.driverName || '',
    telephone: t.phone || '',
    latitude: t.latitude,
    longitude: t.longitude,
    status: rideStatusToFleetStatus(rideStatus),
    rideStatus,
    offreId: t.offreId ?? undefined,
    feesOption: t.feesOption ?? undefined,
    totalPrice: t.totalPrice ?? undefined,
    destination: t.clientDestination || undefined,
    isOnline: true,
    waitingCount: stats.waitingCount,
    inProgressCount: stats.inProgressCount,
    startedRide: stats.startedCount,
    totalTaxis: stats.totalTaxis
  };
}

export function mapFleetLocationsV2Payload(payload: FleetLocationsV2Payload): {
  locations: FleetLocation[];
  statistics: FleetV2Statistics;
} {
  const stats: FleetV2Statistics = {
    waitingCount: payload.statistics?.waitingCount ?? 0,
    inProgressCount: payload.statistics?.inProgressCount ?? 0,
    startedCount: payload.statistics?.startedCount ?? 0,
    terminatedCount: payload.statistics?.terminatedCount ?? 0,
    cancelledCount: payload.statistics?.cancelledCount ?? 0,
    cancelledByClientCount: payload.statistics?.cancelledByClientCount ?? 0,
    cancelledByTaxiCount: payload.statistics?.cancelledByTaxiCount ?? 0,
    expiredCount: payload.statistics?.expiredCount ?? 0,
    totalTaxis: payload.statistics?.totalTaxis ?? 0
  };
  const locations = (payload.locations || []).map((row) => taxiLocationV2ToFleetLocation(row, stats));
  return { locations, statistics: stats };
}

/** True if taxi should be treated as “on a ride” for assignment UI. */
export function isRideActiveForAssignment(rideStatus: string | null | undefined): boolean {
  const s = (rideStatus || '').toUpperCase();
  return s === 'IN_PROGRESS' || s === 'STARTED' || s === 'EN_ROUTE';
}
