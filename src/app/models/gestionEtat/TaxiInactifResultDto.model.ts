import { PageMeta }     from './PageMeta.model';
import { TaxiInactif } from './TaxiInactif.model';  

export interface TaxiInactifResultDto {
  taxiInactifs: TaxiInactif[];
  sommeActifs:  number;
  sommeInactifs: number;
  sommeTotal:   number;
  page: PageMeta;
}