import {
  NotificationType,
  NotificationChannel,
  NotificationTargetType
} from './SendNotificationRequest.model';

export interface NotificationDto {
  id:         number;
  title:      string;
  message:    string;
  type:       NotificationType;
  channel:    NotificationChannel;
  targetType: NotificationTargetType;
  targetIds:  string;
  createdAt:  string;
}
