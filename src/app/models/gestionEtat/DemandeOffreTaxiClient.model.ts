export interface DemandeOffreTaxiClient {
  // ── Infos Demande ───────────────────────────────────────────────────────
  demandeId:               number;
  dateDepot:               string;
  dateSmsMasquerNumero:    string | null;
  etatDemande:             string;
  masquerNumero:           boolean;
  demandeClientId:         number | null;
  dateSmsMasquerNumeroAlt: string | null;
  masquerNumeroAlt:        boolean | null;
  demandeFeesOption:       number | null;
  demandeFeesOptionAlt:    number | null;

  // ── Infos Taxi (peut être null si pas d'offre) ────────────────────────────
  taxiId:                  number | null;
  telephone:               string | null;
  nom:                     string | null;
  numeroMatricule:         string | null;
  numeroCin:               string | null;
  numeroTaxi:              string | null;

  // ── Infos Offre (peut être null si pas d'offre) ───────────────────────────
  offreId:                 number | null;
  duration:                string | null;
  distance:                string | null;
  totalPrice:              string | null;
  feesOption:               string | null;
  rating:                  number | null;
  comments:                string | null;
  realPrice:               number | null;
  info:                    string | null;
  locationHistory:         string | null;
  destinationHistory:      string | null;
  etatOffre:               string | null;

  // ── Infos Client ────────────────────────────────────────────────────────
  clientId:                number | null;
  clientTelephone:         string | null;
  clientName:              string | null;
}