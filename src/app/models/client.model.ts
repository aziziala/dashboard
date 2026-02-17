export interface Client {
  id?: number;
  nom?: string;
  prenom?: string;
  telephone: string;
  email?: string;
  adresse?: string;
  status?: string;
  note?: string;
  date_enregistrement?: Date;
  contenu?: string;
  masquerNumero?: boolean;
  latitude?: number;
  longitude?: number;
  traitement?: boolean;
  etat?: string;
  destination?: string;
  location?: string;
  dest_latitude?: number;
  dest_longitude?: number;
  type?: PhoneType;
  offres?: any[];
  demandes?: any[];
}


export enum PhoneType {
  gsm = 'GSM',
  smartphone = 'SMART',

}

export interface ClientLocation {
  clientId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  destination?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface ClientRide {
  id?: number;
  clientId: number;
  pickupLocation: string;
  dropoffLocation: string;
  startTime: Date;
  endTime?: Date;
  distance?: number;
  fare: number;
  status: RideStatus;
  taxiId?: number;
  rating?: number;
  feedback?: string;
}

export enum RideStatus {
  WAITING = 'WAITING',  //~
  EXPIRED = 'EXPIRED', //-
  IN_PROGRESS = 'IN_PROGRESS', //+
  //COMPLETED = 'COMPLETED',
  //CANCELLED = 'CANCELLED'
}

export interface ClientExpense {
  id?: number;
  clientId: number;
  amount: number;
  type: ExpenseType;
  description: string;
  date: Date;
  rideId?: number;
  status: 'pending' | 'paid' | 'cancelled';
}

export enum ExpenseType {
  RIDE_FARE = 'RIDE_FARE',
  CANCELLATION_FEE = 'CANCELLATION_FEE',
  WAITING_FEE = 'WAITING_FEE',
  OTHER = 'OTHER'
}

export interface ClientPreferences {
  clientId: number;
  preferredVehicleType?: string;
  preferredPaymentMethod?: string;
  notificationsEnabled: boolean;
  language: string;
  accessibilityFeatures?: string[];
  specialRequirements?: string[];
}

export interface ClientAnalytics {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalExpenses: number;
  averageRating: number;
  totalDistance: number;
  favoriteDestinations: string[];
  peakUsageHours: number[];
  averageRideDuration: number;
}

export interface ClientSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minRides?: number;
    maxRides?: number;
    minSpending?: number;
    maxSpending?: number;
    location?: string;
    ageRange?: string;
    activityLevel?: 'low' | 'medium' | 'high';
  };
  clientCount: number;
}

export interface ClientNotification {
  id?: number;
  clientId: number;
  type: 'sms' | 'email' | 'push';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ClientSupportTicket {
  id?: number;
  clientId: number;
  issue: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'service' | 'other';
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  notes?: string[];
}

export interface ClientFeedback {
  id?: number;
  clientId: number;
  rideId?: number;
  rating: number;
  comment?: string;
  category: 'driver' | 'vehicle' | 'service' | 'app' | 'other';
  timestamp: Date;
  tags?: string[];
}

export interface ClientVerification {
  clientId: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  verificationDate?: Date;
  documents?: {
    type: string;
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
  }[];
}

export interface ClientSearchFilters {
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  minRides?: number;
  maxRides?: number;
  minSpending?: number;
  maxSpending?: number;
  verified?: boolean;
  segment?: string;
}

export interface ClientExportData {
  format: 'csv' | 'pdf' | 'excel';
  filters?: ClientSearchFilters;
  includeDetails?: boolean;
  includeRideHistory?: boolean;
  includeExpenses?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ClientGrowthMetrics {
  period: string;
  newClients: number;
  activeClients: number;
  churnedClients: number;
  retentionRate: number;
  averageLifetime: number;
  revenuePerClient: number;
}

export interface ClientCommunicationHistory {
  clientId: number;
  communications: {
    type: 'sms' | 'email' | 'push' | 'call';
    timestamp: Date;
    content: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    response?: string;
  }[];
}
