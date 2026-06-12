import { PageMeta }    from './PageMeta.model';
import { TaxiCourses } from './TaxiCourses.model';

export interface TaxiCoursesResultDto {
  taxiCourses:             TaxiCourses[];
  t1sommesTotalCourses:    number;
  t2sommesTotalCourses:    number;
  t3sommesTotalCourses:    number;
  sommesTotalCourses:      number;
  page:                    PageMeta;
}