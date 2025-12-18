export interface FleetLocation {
  id?: number;
  taxiId: number;
  taxiNumber: string;
  driverName: string;
  telephone: string;
  latitude?: number;
  longitude?: number;
  status: FleetStatus;
  lastUpdate?: Date;
  speed?: number;
  direction?: string;
  destination?: string;
  estimatedArrival?: Date;
  batteryLevel?: number;
  fuelLevel?: number;
  isOnline: boolean;
  currentFare?: number;
  rating?: number;
  totalRides?: number;
  totalEarnings?: number;
  vehicleType?: string;
  vehicleModel?: string;
  licensePlate?: string;
  insuranceExpiry?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  waitingCount:number;
  inProgressCount:number;
  startedRide:number;
  totalTaxis: number;
}

export enum FleetStatus {
  ACTIVE = 'LIBRE',
  BUSY = 'OCCUPÉ',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  SUSPENDED = 'SUSPENDED',
  BREAK = 'BREAK',
  EN_ROUTE = 'En approche',
  ARRIVED = 'ARRIVED'
}

export interface FleetStatistics {
  totalTaxis: number;
  activeTaxis: number;
  enrouteTaxis: number;
  busyTaxis: number;
  offlineTaxis: number;
  totalRevenue: number;
  averageRating: number;
  totalRides: number;
  averageResponseTime: number;
  coverageArea: number;
  averageEarnings: number;
  topPerformers: TopPerformer[];
  statusDistribution: StatusDistribution[];
  revenueTrend: RevenueTrend[];
  performanceMetrics: PerformanceMetrics;
}

export interface TopPerformer {
  taxiId: number;
  taxiNumber: string;
  driverName: string;
  totalRides: number;
  totalEarnings: number;
  averageRating: number;
  responseTime: number;
  completionRate: number;
}

export interface StatusDistribution {
  status: FleetStatus;
  count: number;
  percentage: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  rides: number;
  averageFare: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  averageCompletionTime: number;
  customerSatisfaction: number;
  fleetUtilization: number;
  fuelEfficiency: number;
  maintenanceCosts: number;
}

export interface NearbyTaxiResponse {
  taxiId: number;
  taxiNumber: string;
  driverName: string;
  distance: number;
  estimatedArrival: number;
  status: FleetStatus;
  rating: number;
  currentFare: number;
  vehicleType?: string;
  isAvailable: boolean;
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export interface FleetMovement {
  taxiId: number;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  direction: string;
  status: FleetStatus;
  destination?: string;
  estimatedArrival?: Date;
}

export interface FleetRoute {
  id?: number;
  taxiId: number;
  startPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    address: string;
  };
  waypoints?: {
    latitude: number;
    longitude: number;
    address: string;
  }[];
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
  startTime: Date;
  endTime?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  fuelConsumption?: number;
  cost?: number;
}

export interface FleetAlert {
  id?: number;
  taxiId: number;
  type: 'maintenance' | 'safety' | 'performance' | 'location' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export interface FleetMaintenance {
  id?: number;
  taxiId: number;
  type: 'scheduled' | 'emergency' | 'inspection' | 'repair';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  cost?: number;
  mechanic?: string;
  parts?: string[];
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  nextMaintenanceDate?: Date;
}

export interface FleetCommunication {
  id?: number;
  taxiId: number;
  type: 'broadcast' | 'direct' | 'emergency' | 'system';
  message: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  response?: string;
  responseAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface FleetEmergency {
  id?: number;
  taxiId: number;
  type: 'accident' | 'medical' | 'mechanical' | 'security' | 'other';
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'responding' | 'resolved';
  responseTime?: number;
  resolvedAt?: Date;
  resolution?: string;
  emergencyContacts?: string[];
}

export interface FleetAnalytics {
  period: string;
  totalRevenue: number;
  totalRides: number;
  averageFare: number;
  averageRating: number;
  fleetUtilization: number;
  customerSatisfaction: number;
  operationalEfficiency: number;
  costAnalysis: {
    fuel: number;
    maintenance: number;
    insurance: number;
    other: number;
  };
  performanceTrends: {
    revenue: number[];
    rides: number[];
    rating: number[];
    utilization: number[];
  };
}

export interface FleetSearchFilters {
  status?: FleetStatus;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  vehicleType?: string;
  rating?: number;
  isOnline?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  earnings?: {
    min: number;
    max: number;
  };
  rides?: {
    min: number;
    max: number;
  };
}

export interface FleetExportData {
  format: 'csv' | 'pdf' | 'excel';
  filters?: FleetSearchFilters;
  includeDetails?: boolean;
  includeHistory?: boolean;
  includeAnalytics?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
