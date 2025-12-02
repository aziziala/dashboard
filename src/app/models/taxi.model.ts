export interface Taxi {
  id?: number;
  contenu?: string;
  telephone: string;
  traitement: boolean;
  latitude?: number;
  longitude?: number;
  nom?: string;
  numero_matricule?: string;
  numero_cin?: string;
  constructeur?: string;
  numero_taxi?: string;
  masquerNumero?: boolean;
  email?: string;
  sms_winek?: boolean;
  date_sms_winek?: Date;
  date_enregistrement?: Date;
  etat?: string;
  type?: PhoneType;
  destination?: string;
  location?: string;
  lat_gps?: number;
  lng_gps?: number;
  taxiStatus: TaxiStatus;
  offres?: any[];
}

export enum TaxiStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PhoneType {
  ANDROID = 'ANDROID',
  IPHONE = 'IPHONE',
  OTHER = 'OTHER'
}

export interface TaxiLocation {
  taxiId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  direction?: string;
  status: TaxiStatus;
}

export interface TaxiPerformance {
  taxiId: number;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
  averageRating: number;
  totalDistance: number;
  averageResponseTime: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface TaxiAnalytics {
  totalTaxis: number;
  activeTaxis: number;
  offlineTaxis: number;
  totalRevenue: number;
  averageRating: number;
  totalRides: number;
  averageResponseTime: number;
  topPerformingTaxis: TaxiPerformance[];
  revenueTrend: RevenueTrend[];
  rideFrequency: RideFrequency[];
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  rides: number;
}

export interface RideFrequency {
  hour: number;
  count: number;
}

export interface TaxiIssue {
  id?: number;
  taxiId: number;
  issue: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  reportedAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export interface EmergencyAlert {
  id?: number;
  taxiId: number;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  status: 'active' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaxiAssignment {
  id?: number;
  taxiId: number;
  clientId: number;
  assignedAt: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TaxiSearchFilters {
  status?: TaxiStatus;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  online?: boolean;
  rating?: number;
  vehicleType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaxiExportData {
  format: 'csv' | 'pdf' | 'excel';
  filters?: TaxiSearchFilters;
  includeDetails?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
