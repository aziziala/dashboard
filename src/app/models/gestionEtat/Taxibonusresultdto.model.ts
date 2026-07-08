import { PageMeta } from "./PageMeta.model";
import { TaxiBonus } from "./Taxibonus.model";

export interface TaxiBonusResultDto {
  taxiBonus:               TaxiBonus[];
  sommesTotalParrainage:   number;
  sommesTotaleReduction:   number;
  sommesTotalCourses:      number;
  page:                    PageMeta;
}