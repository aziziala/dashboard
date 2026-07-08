import { PageMeta } from "./PageMeta.model";
import { TaxiActif } from "./TaxiActif.model";

export interface TaxiActifResultDto {
  taxiActifs: TaxiActif[];
  sommeActifs: number;
  sommeInactifs: number;
  sommeTotal: number;
  page: PageMeta;
}