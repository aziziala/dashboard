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

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  STICKER = 'STICKER',
  LOCATION = 'LOCATION',
  CONTACTS = 'CONTACTS',
  BUTTON = 'BUTTON',
  INTERACTIVE = 'INTERACTIVE',
  TEMPLATE = 'TEMPLATE',
  UNKNOWN = 'UNKNOWN',
  UNSUPPORTED = 'UNSUPPORTED'
}