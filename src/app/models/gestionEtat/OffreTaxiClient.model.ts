export interface OffreTaxiClient {
  // ── Infos Taxi ────────────────────────────────────────────────────────────
  taxiId:             number;
  telephone:          string;
  nom:                string;
  numeroMatricule:    string;
  numeroCin:          string;
  numeroTaxi:         string;

  // ── Infos Offre ───────────────────────────────────────────────────────────
  offreId:            number;
  dateDepot:          string;
  duration:           string;
  distance:           string;
  totalPrice:         string;
  feesOption:         string;
  rating:             number | null;
  comments:           string | null;
  realPrice:          number | null;
  info:               string | null;
  locationHistory:    string;
  destinationHistory: string;
  etat:               string;

  // ── Infos Client ──────────────────────────────────────────────────────────
  clientId:           number;
  clientTelephone:    string;
  clientName:         string;
}