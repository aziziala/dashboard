export enum ContactType {
  TAXI = 'TAXI',
  CLIENT = 'CLIENT',
  GESTIONNAIRE = 'GESTIONNAIRE',
  AUTRE = 'AUTRE'
}

export enum MessageDirection {
  IN = 'IN',
  OUT = 'OUT'
}

export enum ChatMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}