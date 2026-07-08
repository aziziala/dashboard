/** Payload sent when backend requires registration data (BAD_REQUEST retry). */
export interface SyncTaxiRegistrationPayload {
  nom?: string;
  numeroCin?: string;
  numeroMatricule?: string;
  numeroTaxi?: string;
  constructeur?: string;
  type?: string;
  contenu?: string;
}

export type SyncTaxiAccountAction =
  | 'NONE'
  | 'CREATED_TAXI_CLIENT'
  | 'CREATED_JWT_ACCOUNT'
  | 'CREATED_BOTH'
  | string;

/** Mirrors backend SyncTaxiAccountResponse (flexible for extra fields). */
export interface SyncTaxiAccountResponse {
  actionPerformed?: SyncTaxiAccountAction;
  message?: string;
  error?: string;
  missingFields?: string[];
}
