
export enum PhoneType {
  SMART = 'SMART',
  GSM = 'GSM',
  WHATSAPP = 'WHATSAPP',
  WHATSAPP_AR = 'WHATSAPP_AR'
}

export enum TaxiStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export interface GetAllTaxisDtoResponse {
  id: number;
  contenu: string | null;
  telephone: string;
  traitement: boolean;
  nom: string;
  numeroMatricule: string;
  numeroCin: string;
  constructeur: string;
  numeroTaxi: string;
  email: string;
  type: PhoneType;
  taxiStatus: TaxiStatus;
  rating: number;
}

export interface SortCriterion {
  field: string;
  direction: 'asc' | 'desc';
}
