import { PageMeta }                  from './PageMeta.model';
import { DemandeOffreTaxiClient }    from './DemandeOffreTaxiClient.model';

export interface DemandeByStateResultDto {
  demandes:       DemandeOffreTaxiClient[];
  totalDemandes:  number;
  page:           PageMeta;
}