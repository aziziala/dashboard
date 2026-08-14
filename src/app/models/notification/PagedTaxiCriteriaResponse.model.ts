
export interface TaxiCriteria {
  id: number;
  contenu: string;
  telephone: string;
  traitement: boolean;
  nom: string;
  numeroMatricule: string;
  numeroCin: string;
  constructeur: string;
  numeroTaxi: string;
  email: string;
  type: string;
  taxiStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  rating: number;
  hide: boolean;
  numeroSim: string;
  dateEnregistrement: string;
}

export interface TaxiPage {
  totalPages: number;
  totalElements: number;
  size: number;
  content: TaxiCriteria[];
  number: number;
  first: boolean;
  numberOfElements: number;
  last: boolean;
  empty: boolean;
}

export interface TaxiStats {
  total: number;
  withSim: number;
  withoutSim: number;
  approved: number;
  waiting: number;
}

export interface PagedTaxiCriteriaResponse {
  taxis: TaxiPage;
  stats: TaxiStats;
}