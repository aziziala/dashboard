export interface TaxiInactif {
  taxiId: number;
  telephone: string;
  nom: string;
  numeroMatricule: string;
  numeroCin: string;
  numeroTaxi: string;
  dernierEtat?: string;   // champ optionnel retourné par l'API inactifs
}