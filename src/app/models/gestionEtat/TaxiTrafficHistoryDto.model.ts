import { PageMeta }   from './PageMeta.model';
import { TaxiCourse } from './TaxiCourse.model';

export interface TaxiTrafficHistoryDto {
  taxiId:          number;
  telephone:       string;
  nom:             string;
  numeroMatricule: string;
  numeroCin:       string;
  numeroTaxi:      string;
  courses:         TaxiCourse[];
  totalCourses:    number;
  page:            PageMeta;
}