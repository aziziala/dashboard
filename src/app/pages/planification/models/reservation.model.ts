
export enum ReservationStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  WAITING_DRIVER = 'WAITING_DRIVER',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum ReservationSource {
  DASHBOARD = 'DASHBOARD',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  CALL = 'CALL'
}

export enum ReservationLanguage {
  FR = 'FR',
  AR = 'AR',
  EN = 'EN'
}

export enum AssignmentType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL'
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REFUSED = 'REFUSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  ACTIVE = 'ACTIVE'

}

// ═══════════════════════════════════════════════════════════════════════════
// DTO — Requests
// ═══════════════════════════════════════════════════════════════════════════

export interface ReservationRequest {
  telephone: string;
  pickup: string;
  destination: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  // null = ASAP, sinon réservation programmée
  reservationDateTime?: string | null;
  source: ReservationSource;
  language?: ReservationLanguage | null;
  commentaire?: string | null;
}

export interface AssignTaxiRequest {
  taxiId: number;
  assignmentType?: AssignmentType | null;
  assignedBy?: string | null;
  comment?: string | null;
}

export interface ReservationWithAssignmentRequest {
  reservation: ReservationRequest;
  // undefined si création "sans affectation immédiate"
  assignment?: AssignTaxiRequest;
}

export interface UpdateReservationRequest {
  telephone?: string;
  pickup?: string;
  destination?: string;
  reservationDateTime?: string | null;
  commentaire?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DTO — Responses
// ═══════════════════════════════════════════════════════════════════════════

export interface ReservationAssignmentResponse {
  id: number;
  taxiId: number;
  taxiNumero: string;
  taxiNom: string;
  taxiMatricule: string;
  taxiTelephone: string;
  assignmentType: AssignmentType;
  status: AssignmentStatus;
  assignedBy: string;
  assignedAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  comment: string | null;
}

export interface ReservationResponse {
  id: number;
  clientId: number;
  telephone: string;
  pickup: string;
  destination: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  reservationDateTime: string | null;
  status: ReservationStatus;
  source: ReservationSource;
  language: ReservationLanguage | null;
  commentaire: string | null;
  estimatedPrice: number | null;
  estimatedDistance: string | null;
  estimatedDuration: string | null;
  reminderSent: boolean;
  convertedToDemande: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
  cancelledBy: string | null;
  // null si aucun taxi affecté pour l'instant
  assignment: ReservationAssignmentResponse | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page courante (0-based, côté API)
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers d'affichage
// ═══════════════════════════════════════════════════════════════════════════

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.CREATED]: 'Créée',
  [ReservationStatus.CONFIRMED]: 'Confirmée',
  [ReservationStatus.WAITING_DRIVER]: 'En attente d’affectation',
  [ReservationStatus.ASSIGNED]: 'Taxi affecté',
  [ReservationStatus.ACCEPTED]: 'Acceptée par le taxi',
  [ReservationStatus.IN_PROGRESS]: 'En course',
  [ReservationStatus.COMPLETED]: 'Terminée',
  [ReservationStatus.CANCELLED]: 'Annulée',
  [ReservationStatus.EXPIRED]: 'Expirée'
};

export const RESERVATION_STATUS_BADGE_CLASS: Record<ReservationStatus, string> = {
  [ReservationStatus.CREATED]: 'badge-status-neutral',
  [ReservationStatus.CONFIRMED]: 'badge-status-info',
  [ReservationStatus.WAITING_DRIVER]: 'badge-status-pending',
  [ReservationStatus.ASSIGNED]: 'badge-status-info',
  [ReservationStatus.ACCEPTED]: 'badge-status-approved',
  [ReservationStatus.IN_PROGRESS]: 'badge-status-approved',
  [ReservationStatus.COMPLETED]: 'badge-status-approved',
  [ReservationStatus.CANCELLED]: 'badge-status-rejected',
  [ReservationStatus.EXPIRED]: 'badge-status-rejected'
};

// Statuts pour lesquels une action "retirer l'affectation" a du sens
export const UNASSIGNABLE_STATUSES: ReservationStatus[] = [
  ReservationStatus.ASSIGNED,
  ReservationStatus.ACCEPTED
];


/// Pour le web socket de notifiaction

export enum ReservationNotificationType {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_UPDATED = 'RESERVATION_UPDATED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  RESERVATION_ASSIGNED = 'RESERVATION_ASSIGNED',
  RESERVATION_UNASSIGNED = 'RESERVATION_UNASSIGNED'
}

export interface ReservationNotification {
  type: ReservationNotificationType | string;
  reservation: ReservationResponse;
}
