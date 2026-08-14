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