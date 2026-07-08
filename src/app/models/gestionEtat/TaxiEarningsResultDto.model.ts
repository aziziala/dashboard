import { PageMeta }     from './PageMeta.model';
import { TaxiEarnings } from './TaxiEarnings.model';

export interface TaxiEarningsResultDto {
  taxiEarnings:          TaxiEarnings[];
  sommesTotalCourses:    number;
  sommesTotalCompteur:   number;
  sommesTotalExtrat:     number;
  sommeTotal:            number;
  page:                  PageMeta;
}