import { NotificationDto } from "./NotificationDto.model";

export interface PagedNotificationResponse {
  content:          NotificationDto[];
  totalElements:    number;
  totalPages:       number;
  number:           number;
  size:             number;
  first:            boolean;
  last:             boolean;
}