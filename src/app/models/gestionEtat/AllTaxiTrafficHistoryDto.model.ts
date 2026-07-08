import { PageMeta }          from './PageMeta.model';
import { OffreTaxiClient }   from './OffreTaxiClient.model';

export interface AllTaxiTrafficHistoryDto {
  courses:      OffreTaxiClient[];
  totalCourses: number;
  page:         PageMeta;
}