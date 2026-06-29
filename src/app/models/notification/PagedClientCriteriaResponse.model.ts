import { ClientCriteria } from "./ClientCriteria.model";

export interface PagedClientCriteriaResponse {
  content:       ClientCriteria[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
  first:         boolean;
  last:          boolean;
}