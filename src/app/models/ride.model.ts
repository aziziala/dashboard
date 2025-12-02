export interface RideRequest {
  id?: number;
  clientId: number;
  clientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destLatitude?: number;
  destLongitude?: number;
  status: RideStatus;
  dateCreated: Date;
  dateUpdated?: Date;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RideOffer {
  id?: number;
  taxiId: number;
  taxiPhone: string;
  clientId: number;
  clientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: RideStatus;
  dateCreated: Date;
  dateUpdated?: Date;
  duration?: string;
  distance?: string;
  totalPrice?: string;
  info?: string;
  locationHistory?: string;
  destinationHistory?: string;
  isAutoCancelled?: boolean;
}

export enum RideStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ASSIGNED = 'ASSIGNED',
  ARRIVED = 'ARRIVED',
  STARTED = 'STARTED'
}

export interface RideMatching {
  requestId: number;
  taxiId: number;
  clientId: number;
  estimatedArrival: number; // in minutes
  distance: number; // in km
  fare: number;
  taxiRating?: number;
  taxiName?: string;
  clientName?: string;
}

export interface RideStatistics {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  averageFare: number;
  totalRevenue: number;
  averageDistance: number;
  averageDuration: number;
  successRate: number;
}
