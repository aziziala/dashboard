export type NotificationType       = 'INFO' | 'WARNING' | 'ERROR';
export type NotificationChannel    = 'SMS' | 'EMAIL' | 'PUSH' | 'WHATSAPP';
export type NotificationTargetType = 'TAXI' | 'CLIENT' | 'ADMIN';

export interface SendNotificationRequest {
  title:      string;
  message:    string;
  type:       NotificationType;
  channel:    NotificationChannel;
  targetType: NotificationTargetType;
  targetIds:  string[];   // ["ALL"] or ["1","2",...]
}