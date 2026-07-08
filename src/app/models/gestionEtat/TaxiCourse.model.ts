export interface TaxiCourse {
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
  clientId:           number;
  clientTelephone:    string;
  clientName:         string;
}