import { TaxiCriteria } from "./TaxiCriteria.model";

export interface PagedTaxiCriteriaResponse {
  content:       TaxiCriteria[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
  first:         boolean;
  last:          boolean;
}